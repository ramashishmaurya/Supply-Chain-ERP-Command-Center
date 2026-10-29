from typing import Dict, Any, Optional

def calculate_inventory_risk(
    current_stock: int,
    incoming_stock: int,
    avg_daily_demand: float,
    lead_time_days: int,
    safety_stock: int
) -> Dict[str, Any]:
    """
    Deterministic calculation of inventory risk, reorder point (ROP),
    days of supply, and stockout probability tier.
    
    Formula:
      ROP = (Avg Daily Demand * Lead Time) + Safety Stock
      Effective Stock = Current Stock + Incoming Stock
      Days of Supply = Current Stock / Avg Daily Demand
    """
    # 1. Reorder Point
    lead_time_demand = avg_daily_demand * lead_time_days
    reorder_point = round(lead_time_demand + safety_stock, 1)
    
    # 2. Effective Stock
    effective_stock = current_stock + incoming_stock
    
    # 3. Days of Supply (Current physical stock coverage)
    if avg_daily_demand > 0:
        days_of_supply = round(current_stock / avg_daily_demand, 1)
    else:
        days_of_supply = 999.0
        
    # 4. Status Determination
    # Critical: Days of supply <= supplier lead time (cannot replenish before hitting zero!)
    # Warning: Effective stock <= ROP
    # Healthy: Above ROP
    if current_stock <= 0:
        risk_level = "CRITICAL_OUT_OF_STOCK"
        status_color = "red"
        reorder_urgency = "IMMEDIATE"
    elif days_of_supply <= lead_time_days:
        risk_level = "CRITICAL_STOCKOUT_RISK"
        status_color = "red"
        reorder_urgency = "HIGH"
    elif effective_stock <= reorder_point:
        risk_level = "REORDER_REQUIRED"
        status_color = "amber"
        reorder_urgency = "MEDIUM"
    else:
        risk_level = "HEALTHY"
        status_color = "green"
        reorder_urgency = "LOW"

    # Suggested quantity: restore back to (ROP + 20 days buffer)
    target_stock = int(reorder_point + (avg_daily_demand * 14))
    suggested_order_qty = max(0, target_stock - effective_stock)

    explanation = (
        f"Demand is {avg_daily_demand} units/day. With a {lead_time_days}-day lead time and "
        f"{safety_stock} safety buffer, the Reorder Point is {reorder_point:.1f}. "
        f"Current physical stock covers ~{days_of_supply} days. "
    )
    if risk_level in ["CRITICAL_OUT_OF_STOCK", "CRITICAL_STOCKOUT_RISK"]:
        explanation += f"CRITICAL: Stock will deplete in {days_of_supply} days, which is less than supplier lead time ({lead_time_days} days)!"
    elif risk_level == "REORDER_REQUIRED":
        explanation += f"Effective stock ({effective_stock}) is at or below ROP ({reorder_point:.1f})."
    else:
        explanation += "Stock levels are currently optimal."

    return {
        "reorder_point": reorder_point,
        "lead_time_demand": round(lead_time_demand, 1),
        "days_of_supply": days_of_supply,
        "effective_stock": effective_stock,
        "risk_level": risk_level,
        "status_color": status_color,
        "reorder_urgency": reorder_urgency,
        "suggested_order_qty": suggested_order_qty,
        "explanation": explanation
    }
