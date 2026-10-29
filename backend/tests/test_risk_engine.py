from app.services.risk_engine import calculate_inventory_risk

def test_critical_stockout_risk():
    """
    Test when days of supply is strictly less than supplier lead time.
    """
    res = calculate_inventory_risk(
        current_stock=20,
        incoming_stock=0,
        avg_daily_demand=10.0,
        lead_time_days=7,
        safety_stock=30
    )
    # Days of supply = 20 / 10 = 2.0 days <= 7 days lead time -> CRITICAL_STOCKOUT_RISK
    assert res["risk_level"] == "CRITICAL_STOCKOUT_RISK"
    assert res["status_color"] == "red"
    assert res["reorder_urgency"] == "HIGH"
    assert res["reorder_point"] == 100.0  # (10 * 7) + 30
    assert res["days_of_supply"] == 2.0

def test_reorder_required_when_below_rop():
    """
    Test when days of supply > lead time, but effective stock <= ROP.
    """
    res = calculate_inventory_risk(
        current_stock=80,
        incoming_stock=10,
        avg_daily_demand=5.0,
        lead_time_days=5,
        safety_stock=70
    )
    # ROP = (5 * 5) + 70 = 95
    # Effective stock = 80 + 10 = 90 <= 95
    # Days of supply = 80 / 5 = 16 days > 5 days lead time
    assert res["risk_level"] == "REORDER_REQUIRED"
    assert res["status_color"] == "amber"
    assert res["reorder_urgency"] == "MEDIUM"
    assert res["reorder_point"] == 95.0

def test_healthy_inventory_level():
    """
    Test when stock is well above ROP.
    """
    res = calculate_inventory_risk(
        current_stock=300,
        incoming_stock=50,
        avg_daily_demand=10.0,
        lead_time_days=5,
        safety_stock=50
    )
    # ROP = (10 * 5) + 50 = 100
    # Effective stock = 350 > 100
    assert res["risk_level"] == "HEALTHY"
    assert res["status_color"] == "green"
    assert res["reorder_urgency"] == "LOW"
