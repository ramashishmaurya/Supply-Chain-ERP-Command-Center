from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.audit_log import AuditLog

def create_purchase_order_draft(
    db: Session,
    supplier_id: int,
    items_data: List[Dict[str, Any]],
    notes: Optional[str] = None,
    created_by: str = "System User"
) -> PurchaseOrder:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier with ID {supplier_id} not found."
        )

    # Generate sequential or unique PO number
    po_count = db.query(PurchaseOrder).count() + 1
    po_number = f"PO-{datetime.now().year}-{po_count:04d}"

    total_amount = 0.0
    po_items = []

    for item in items_data:
        product = db.query(Product).filter(Product.id == item["product_id"]).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item['product_id']} not found."
            )
        qty = item["quantity"]
        unit_price = item.get("unit_price")
        if unit_price is None:
            unit_price = product.unit_price
        total_price = round(qty * unit_price, 2)
        total_amount += total_price

        po_items.append(
            PurchaseOrderItem(
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
                total_price=total_price
            )
        )

    po = PurchaseOrder(
        po_number=po_number,
        supplier_id=supplier.id,
        status="DRAFT",
        total_amount=round(total_amount, 2),
        notes=notes or "Draft created for review",
        items=po_items
    )
    db.add(po)
    db.flush()

    # Log action to audit log
    audit = AuditLog(
        entity_type="PURCHASE_ORDER",
        entity_id=po.po_number,
        action="CREATE_DRAFT",
        details=f"Created DRAFT purchase order {po.po_number} with {len(po_items)} items for ${total_amount:,.2f}",
        performed_by=created_by
    )
    db.add(audit)
    db.commit()
    db.refresh(po)
    return po

def approve_purchase_order(
    db: Session,
    po_id: int,
    approved_by: str = "Authorized Procurement Officer"
) -> PurchaseOrder:
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")

    if po.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve PO in '{po.status}' state. Only DRAFT orders can be approved."
        )

    po.status = "APPROVED"
    
    audit = AuditLog(
        entity_type="PURCHASE_ORDER",
        entity_id=po.po_number,
        action="APPROVE",
        details=f"Approved purchase order {po.po_number} for total ${po.total_amount:,.2f}",
        performed_by=approved_by
    )
    db.add(audit)
    db.commit()
    db.refresh(po)
    return po

def reject_purchase_order(
    db: Session,
    po_id: int,
    reason: str,
    rejected_by: str = "Procurement Reviewer"
) -> PurchaseOrder:
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")

    if po.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reject PO in '{po.status}' state. Only DRAFT orders can be rejected."
        )

    po.status = "REJECTED"
    if po.notes:
        po.notes += f"\n[REJECTION REASON]: {reason}"
    else:
        po.notes = f"[REJECTION REASON]: {reason}"

    audit = AuditLog(
        entity_type="PURCHASE_ORDER",
        entity_id=po.po_number,
        action="REJECT",
        details=f"Rejected purchase order {po.po_number}. Reason: {reason}",
        performed_by=rejected_by
    )
    db.add(audit)
    db.commit()
    db.refresh(po)
    return po
