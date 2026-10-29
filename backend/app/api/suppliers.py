from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierOut

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierOut])
def get_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    results = []
    for s in suppliers:
        tier = "Tier 1 (Strategic)" if s.reliability_score >= 95 else "Tier 2 (Preferred)" if s.reliability_score >= 85 else "Tier 3 (Conditional)"
        results.append(
            SupplierOut(
                id=s.id,
                code=s.code,
                name=s.name,
                contact_email=s.contact_email,
                lead_time_days=s.lead_time_days,
                reliability_score=s.reliability_score,
                on_time_delivery_rate=s.on_time_delivery_rate,
                created_at=s.created_at,
                performance_tier=tier,
                active_products_count=len(s.products)
            )
        )
    return results
