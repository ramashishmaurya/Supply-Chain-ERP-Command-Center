from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.purchase_order import PurchaseOrder
from app.schemas.purchase_order import (
    PurchaseOrderOut,
    PurchaseOrderItemOut,
    PurchaseOrderCreate,
    PurchaseOrderApproveRequest,
    PurchaseOrderRejectRequest
)
from app.services.po_service import (
    create_purchase_order_draft,
    approve_purchase_order,
    reject_purchase_order
)

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

@router.get("", response_model=List[PurchaseOrderOut])
def get_purchase_orders(
    status: Optional[str] = Query(None, description="Filter by status (DRAFT, APPROVED, REJECTED)"),
    db: Session = Depends(get_db)
):
    query = db.query(PurchaseOrder)
    if status:
        query = query.filter(PurchaseOrder.status == status.upper())
    
    pos = query.order_by(PurchaseOrder.created_at.desc()).all()
    results = []

    for po in pos:
        items_out = [
            PurchaseOrderItemOut(
                id=item.id,
                product_id=item.product_id,
                product_sku=item.product.sku,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price
            )
            for item in po.items
        ]
        results.append(
            PurchaseOrderOut(
                id=po.id,
                po_number=po.po_number,
                supplier_id=po.supplier_id,
                supplier_name=po.supplier.name,
                supplier_code=po.supplier.code,
                status=po.status,
                total_amount=po.total_amount,
                notes=po.notes,
                created_at=po.created_at,
                updated_at=po.updated_at,
                items=items_out
            )
        )
    return results

@router.post("/draft", response_model=PurchaseOrderOut)
def create_draft(payload: PurchaseOrderCreate, db: Session = Depends(get_db)):
    items_data = [item.model_dump() for item in payload.items]
    po = create_purchase_order_draft(
        db=db,
        supplier_id=payload.supplier_id,
        items_data=items_data,
        notes=payload.notes,
        created_by=payload.created_by or "Procurement User"
    )
    items_out = [
        PurchaseOrderItemOut(
            id=item.id,
            product_id=item.product_id,
            product_sku=item.product.sku,
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        )
        for item in po.items
    ]
    return PurchaseOrderOut(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name,
        supplier_code=po.supplier.code,
        status=po.status,
        total_amount=po.total_amount,
        notes=po.notes,
        created_at=po.created_at,
        updated_at=po.updated_at,
        items=items_out
    )

@router.post("/{po_id}/approve", response_model=PurchaseOrderOut)
def approve_po(
    po_id: int,
    payload: Optional[PurchaseOrderApproveRequest] = None,
    db: Session = Depends(get_db)
):
    approver = payload.approved_by if payload and payload.approved_by else "Authorized Procurement Officer"
    po = approve_purchase_order(db=db, po_id=po_id, approved_by=approver)
    items_out = [
        PurchaseOrderItemOut(
            id=item.id,
            product_id=item.product_id,
            product_sku=item.product.sku,
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        )
        for item in po.items
    ]
    return PurchaseOrderOut(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name,
        supplier_code=po.supplier.code,
        status=po.status,
        total_amount=po.total_amount,
        notes=po.notes,
        created_at=po.created_at,
        updated_at=po.updated_at,
        items=items_out
    )

@router.post("/{po_id}/reject", response_model=PurchaseOrderOut)
def reject_po(
    po_id: int,
    payload: PurchaseOrderRejectRequest,
    db: Session = Depends(get_db)
):
    po = reject_purchase_order(
        db=db,
        po_id=po_id,
        reason=payload.reason,
        rejected_by=payload.rejected_by or "Procurement Reviewer"
    )
    items_out = [
        PurchaseOrderItemOut(
            id=item.id,
            product_id=item.product_id,
            product_sku=item.product.sku,
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        )
        for item in po.items
    ]
    return PurchaseOrderOut(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name,
        supplier_code=po.supplier.code,
        status=po.status,
        total_amount=po.total_amount,
        notes=po.notes,
        created_at=po.created_at,
        updated_at=po.updated_at,
        items=items_out
    )
