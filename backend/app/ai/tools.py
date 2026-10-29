from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.inventory import Inventory
from app.models.purchase_order import PurchaseOrder
from app.services.risk_engine import calculate_inventory_risk
from app.services.po_service import create_purchase_order_draft

def get_inventory_risks_tool(db: Session, risk_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieves all inventory items and assesses their risk using the deterministic ROP engine.
    Optional filter: 'CRITICAL', 'REORDER', or 'ALL'
    """
    products = db.query(Product).all()
    results = []

    for product in products:
        supplier = product.supplier
        lead_time = supplier.lead_time_days if supplier else 7

        # Aggregate across warehouses
        total_curr = db.query(func.coalesce(func.sum(Inventory.current_stock), 0)).filter(Inventory.product_id == product.id).scalar()
        total_inc = db.query(func.coalesce(func.sum(Inventory.incoming_stock), 0)).filter(Inventory.product_id == product.id).scalar()

        risk = calculate_inventory_risk(
            current_stock=int(total_curr),
            incoming_stock=int(total_inc),
            avg_daily_demand=product.avg_daily_demand,
            lead_time_days=lead_time,
            safety_stock=product.safety_stock
        )

        item = {
            "sku": product.sku,
            "name": product.name,
            "category": product.category,
            "supplier_name": supplier.name if supplier else "N/A",
            "current_stock": int(total_curr),
            "incoming_stock": int(total_inc),
            "reorder_point": risk["reorder_point"],
            "days_of_supply": risk["days_of_supply"],
            "lead_time_days": lead_time,
            "risk_level": risk["risk_level"],
            "reorder_urgency": risk["reorder_urgency"],
            "suggested_order_qty": risk["suggested_order_qty"],
            "explanation": risk["explanation"]
        }

        if risk_filter == "CRITICAL" and "CRITICAL" not in risk["risk_level"]:
            continue
        if risk_filter == "REORDER" and risk["risk_level"] not in ["CRITICAL_OUT_OF_STOCK", "CRITICAL_STOCKOUT_RISK", "REORDER_REQUIRED"]:
            continue

        results.append(item)

    return results

def get_supplier_metrics_tool(db: Session, supplier_name_or_code: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetches performance metrics, lead times, reliability scores, and on-time delivery rates.
    """
    query = db.query(Supplier)
    if supplier_name_or_code:
        query = query.filter(
            (Supplier.code.ilike(f"%{supplier_name_or_code}%")) |
            (Supplier.name.ilike(f"%{supplier_name_or_code}%"))
        )
    suppliers = query.all()
    results = []

    for sup in suppliers:
        prod_count = len(sup.products)
        tier = "Tier 1 (Strategic)" if sup.reliability_score >= 95 else "Tier 2 (Preferred)" if sup.reliability_score >= 85 else "Tier 3 (Conditional)"
        results.append({
            "id": sup.id,
            "code": sup.code,
            "name": sup.name,
            "lead_time_days": sup.lead_time_days,
            "reliability_score": f"{sup.reliability_score}%",
            "on_time_delivery_rate": f"{sup.on_time_delivery_rate}%",
            "tier": tier,
            "products_count": prod_count
        })

    return results

def get_open_purchase_orders_tool(db: Session) -> List[Dict[str, Any]]:
    """
    Lists all active or draft purchase orders currently in progress.
    """
    pos = db.query(PurchaseOrder).filter(PurchaseOrder.status.in_(["DRAFT", "PENDING"])).all()
    results = []
    for po in pos:
        results.append({
            "po_number": po.po_number,
            "supplier_name": po.supplier.name if po.supplier else "N/A",
            "status": po.status,
            "total_amount": f"${po.total_amount:,.2f}",
            "items_count": len(po.items),
            "created_at": po.created_at.strftime("%Y-%m-%d %H:%M") if po.created_at else "N/A",
            "notes": po.notes
        })
    return results

def get_reorder_recommendations_tool(db: Session) -> List[Dict[str, Any]]:
    """
    Generates deterministic reorder recommendations grouped by supplier with cost estimates.
    """
    risks = get_inventory_risks_tool(db, risk_filter="REORDER")
    recommendations = []

    for r in risks:
        prod = db.query(Product).filter(Product.sku == r["sku"]).first()
        if not prod or r["suggested_order_qty"] <= 0:
            continue
        est_cost = round(r["suggested_order_qty"] * prod.unit_price, 2)
        recommendations.append({
            "product_id": prod.id,
            "sku": prod.sku,
            "product_name": prod.name,
            "supplier_id": prod.supplier_id,
            "supplier_name": prod.supplier.name,
            "current_stock": r["current_stock"],
            "reorder_point": r["reorder_point"],
            "suggested_order_qty": r["suggested_order_qty"],
            "unit_price": prod.unit_price,
            "estimated_total_cost": est_cost,
            "urgency": r["reorder_urgency"]
        })

    return recommendations

def explain_product_risk_tool(db: Session, sku: str) -> Dict[str, Any]:
    """
    Provides a mathematical and operational root-cause breakdown of risk for a specific SKU.
    """
    prod = db.query(Product).filter(Product.sku.ilike(sku)).first()
    if not prod:
        return {"error": f"Product with SKU '{sku}' not found in catalog."}

    supplier = prod.supplier
    lead_time = supplier.lead_time_days if supplier else 7

    total_curr = int(db.query(func.coalesce(func.sum(Inventory.current_stock), 0)).filter(Inventory.product_id == prod.id).scalar())
    total_inc = int(db.query(func.coalesce(func.sum(Inventory.incoming_stock), 0)).filter(Inventory.product_id == prod.id).scalar())

    risk = calculate_inventory_risk(
        current_stock=total_curr,
        incoming_stock=total_inc,
        avg_daily_demand=prod.avg_daily_demand,
        lead_time_days=lead_time,
        safety_stock=prod.safety_stock
    )

    return {
        "sku": prod.sku,
        "name": prod.name,
        "category": prod.category,
        "supplier": {
            "name": supplier.name,
            "lead_time_days": lead_time,
            "reliability_score": supplier.reliability_score
        },
        "metrics": {
            "current_stock": total_curr,
            "incoming_stock": total_inc,
            "avg_daily_demand": prod.avg_daily_demand,
            "safety_stock": prod.safety_stock,
            "reorder_point": risk["reorder_point"],
            "days_of_supply": risk["days_of_supply"]
        },
        "risk_evaluation": risk["risk_level"],
        "urgency": risk["reorder_urgency"],
        "formula_breakdown": f"ROP = ({prod.avg_daily_demand} demand/day × {lead_time} days lead time) + {prod.safety_stock} safety stock = {risk['reorder_point']}",
        "stockout_analysis": f"Current stock ({total_curr}) provides {risk['days_of_supply']} days of coverage. Because this is {'LESS than' if risk['days_of_supply'] <= lead_time else 'greater than'} the supplier lead time ({lead_time} days), replenishment {'CANNOT arrive before stockout' if risk['days_of_supply'] <= lead_time else 'has sufficient safety buffer'}.",
        "recommendation": f"Order {risk['suggested_order_qty']} units immediately from {supplier.name} to restore target buffer."
    }
