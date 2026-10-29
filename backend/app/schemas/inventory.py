from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    unit_price: float
    safety_stock: int
    avg_daily_demand: float
    supplier_id: int

class ProductOut(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InventoryItemOut(BaseModel):
    id: int
    product_id: int
    sku: str
    product_name: str
    category: str
    unit_price: float
    warehouse_id: int
    warehouse_name: str
    warehouse_code: str
    current_stock: int
    incoming_stock: int
    safety_stock: int
    avg_daily_demand: float
    supplier_id: int
    supplier_name: str
    supplier_lead_time: int
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True

class InventoryRiskOut(BaseModel):
    product_id: int
    sku: str
    product_name: str
    category: str
    supplier_name: str
    lead_time_days: int
    avg_daily_demand: float
    safety_stock: int
    current_stock: int
    incoming_stock: int
    effective_stock: int
    reorder_point: float
    days_of_supply: float
    risk_level: str
    status_color: str
    reorder_urgency: str
    suggested_order_qty: int
    estimated_reorder_cost: float
    explanation: str
