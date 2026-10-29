from typing import List, Dict, Any
from pydantic import BaseModel

class KPISummary(BaseModel):
    total_skus: int
    low_stock_items: int
    critical_stockout_risks: int
    open_purchase_orders: int
    total_inventory_value: float
    average_supplier_reliability: float

class CategoryDistribution(BaseModel):
    category: str
    item_count: int
    total_stock: int
    total_value: float

class DashboardSummaryOut(BaseModel):
    kpis: KPISummary
    category_distribution: List[CategoryDistribution]
    recent_critical_alerts: List[Dict[str, Any]]
