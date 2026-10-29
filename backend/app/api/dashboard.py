from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.inventory import Inventory
from app.models.purchase_order import PurchaseOrder
from app.models.audit_log import AuditLog
from app.services.risk_engine import calculate_inventory_risk
from app.schemas.dashboard import DashboardSummaryOut, KPISummary, CategoryDistribution

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    total_skus = len(products)
    
    low_stock_count = 0
    critical_stockout_count = 0
    total_inv_value = 0.0
    category_map = {}
    recent_critical_alerts = []

    for product in products:
        supplier = product.supplier
        lead_time = supplier.lead_time_days if supplier else 7

        total_curr = db.query(func.coalesce(func.sum(Inventory.current_stock), 0)).filter(Inventory.product_id == product.id).scalar()
        total_inc = db.query(func.coalesce(func.sum(Inventory.incoming_stock), 0)).filter(Inventory.product_id == product.id).scalar()
        
        current_stock = int(total_curr)
        incoming_stock = int(total_inc)

        risk = calculate_inventory_risk(
            current_stock=current_stock,
            incoming_stock=incoming_stock,
            avg_daily_demand=product.avg_daily_demand,
            lead_time_days=lead_time,
            safety_stock=product.safety_stock
        )

        item_value = current_stock * product.unit_price
        total_inv_value += item_value

        # Category aggregates
        cat = product.category
        if cat not in category_map:
            category_map[cat] = {"count": 0, "stock": 0, "value": 0.0}
        category_map[cat]["count"] += 1
        category_map[cat]["stock"] += current_stock
        category_map[cat]["value"] += item_value

        if "CRITICAL" in risk["risk_level"]:
            critical_stockout_count += 1
            low_stock_count += 1
            recent_critical_alerts.append({
                "sku": product.sku,
                "name": product.name,
                "days_of_supply": risk["days_of_supply"],
                "lead_time_days": lead_time,
                "risk_level": risk["risk_level"],
                "reorder_urgency": risk["reorder_urgency"]
            })
        elif risk["risk_level"] == "REORDER_REQUIRED":
            low_stock_count += 1

    # Supplier reliability avg
    avg_rel = db.query(func.avg(Supplier.reliability_score)).scalar() or 0.0
    open_pos = db.query(PurchaseOrder).filter(PurchaseOrder.status.in_(["DRAFT", "PENDING"])).count()

    categories_list = [
        CategoryDistribution(
            category=k,
            item_count=v["count"],
            total_stock=v["stock"],
            total_value=round(v["value"], 2)
        )
        for k, v in category_map.items()
    ]

    return DashboardSummaryOut(
        kpis=KPISummary(
            total_skus=total_skus,
            low_stock_items=low_stock_count,
            critical_stockout_risks=critical_stockout_count,
            open_purchase_orders=open_pos,
            total_inventory_value=round(total_inv_value, 2),
            average_supplier_reliability=round(float(avg_rel), 1)
        ),
        category_distribution=categories_list,
        recent_critical_alerts=recent_critical_alerts
    )
