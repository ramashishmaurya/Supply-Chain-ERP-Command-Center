from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class SupplierBase(BaseModel):
    code: str
    name: str
    contact_email: str
    lead_time_days: int
    reliability_score: float
    on_time_delivery_rate: float

class SupplierOut(SupplierBase):
    id: int
    created_at: Optional[datetime] = None
    performance_tier: str
    active_products_count: int

    class Config:
        from_attributes = True
