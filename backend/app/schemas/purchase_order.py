from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, description="Quantity must be positive")
    unit_price: Optional[float] = None

class PurchaseOrderItemOut(BaseModel):
    id: int
    product_id: int
    product_sku: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: List[PurchaseOrderItemCreate]
    notes: Optional[str] = None
    created_by: Optional[str] = "Procurement User"

class PurchaseOrderRejectRequest(BaseModel):
    reason: str = Field(min_length=3, description="Detailed reason for rejection")
    rejected_by: Optional[str] = "Procurement Reviewer"

class PurchaseOrderApproveRequest(BaseModel):
    approved_by: Optional[str] = "Authorized Procurement Officer"

class PurchaseOrderOut(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_name: str
    supplier_code: str
    status: str
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[PurchaseOrderItemOut]

    class Config:
        from_attributes = True
