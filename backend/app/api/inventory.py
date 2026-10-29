from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.services.risk_engine import calculate_inventory_risk
from app.schemas.inventory import InventoryItemOut, InventoryRiskOut

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryItemOut])
def get_inventory(
    search: Optional[str] = Query(None, description="Search by SKU, product name, or category"),
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Inventory).join(Product).join(Product.supplier)
    if search:
        query = query.filter(
            (Product.sku.ilike(f"%{search}%")) |
            (Product.name.ilike(f"%{search}%")) |
            (Product.category.ilike(f"%{search}%"))
        )
    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)

    items = query.all()
    results = []
    for inv in items:
        p = inv.product
        w = inv.warehouse
        s = p.supplier
        results.append(
            InventoryItemOut(
                id=inv.id,
                product_id=p.id,
                sku=p.sku,
                product_name=p.name,
                category=p.category,
                unit_price=p.unit_price,
                warehouse_id=w.id,
                warehouse_name=w.name,
                warehouse_code=w.code,
                current_stock=inv.current_stock,
                incoming_stock=inv.incoming_stock,
                safety_stock=p.safety_stock,
                avg_daily_demand=p.avg_daily_demand,
                supplier_id=s.id,
                supplier_name=s.name,
                supplier_lead_time=s.lead_time_days,
                last_updated=inv.last_updated
            )
        )
    return results

@router.get("/risks", response_model=List[InventoryRiskOut])
def get_inventory_risks(
    filter_type: Optional[str] = Query(None, description="'CRITICAL', 'REORDER', or 'ALL'"),
    db: Session = Depends(get_db)
):
    products = db.query(Product).all()
    results = []

    for p in products:
        supplier = p.supplier
        lead_time = supplier.lead_time_days if supplier else 7

        total_curr = db.query(func.coalesce(func.sum(Inventory.current_stock), 0)).filter(Inventory.product_id == p.id).scalar()
        total_inc = db.query(func.coalesce(func.sum(Inventory.incoming_stock), 0)).filter(Inventory.product_id == p.id).scalar()

        risk = calculate_inventory_risk(
            current_stock=int(total_curr),
            incoming_stock=int(total_inc),
            avg_daily_demand=p.avg_daily_demand,
            lead_time_days=lead_time,
            safety_stock=p.safety_stock
        )

        if filter_type == "CRITICAL" and "CRITICAL" not in risk["risk_level"]:
            continue
        if filter_type == "REORDER" and risk["risk_level"] not in ["CRITICAL_OUT_OF_STOCK", "CRITICAL_STOCKOUT_RISK", "REORDER_REQUIRED"]:
            continue

        est_cost = round(risk["suggested_order_qty"] * p.unit_price, 2)

        results.append(
            InventoryRiskOut(
                product_id=p.id,
                sku=p.sku,
                product_name=p.name,
                category=p.category,
                supplier_name=supplier.name if supplier else "N/A",
                lead_time_days=lead_time,
                avg_daily_demand=p.avg_daily_demand,
                safety_stock=p.safety_stock,
                current_stock=int(total_curr),
                incoming_stock=int(total_inc),
                effective_stock=risk["effective_stock"],
                reorder_point=risk["reorder_point"],
                days_of_supply=risk["days_of_supply"],
                risk_level=risk["risk_level"],
                status_color=risk["status_color"],
                reorder_urgency=risk["reorder_urgency"],
                suggested_order_qty=risk["suggested_order_qty"],
                estimated_reorder_cost=est_cost,
                explanation=risk["explanation"]
            )
        )

    # Sort critical first, then warning, then healthy
    severity_order = {"red": 0, "amber": 1, "green": 2}
    results.sort(key=lambda x: (severity_order.get(x.status_color, 9), x.days_of_supply))
    return results
