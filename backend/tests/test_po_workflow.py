import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from app.core.database import Base
from app.models.supplier import Supplier
from app.models.product import Product
from app.services.po_service import (
    create_purchase_order_draft,
    approve_purchase_order,
    reject_purchase_order
)

# Use in-memory SQLite for isolated test execution
TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def test_db():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSession()

    # Seed minimal setup
    sup = Supplier(code="SUP-TEST", name="Test Supplier", contact_email="test@sup.com", lead_time_days=5)
    db.add(sup)
    db.flush()

    prod = Product(sku="SKU-TEST-1", name="Test Product", category="Hardware", unit_price=50.0, supplier_id=sup.id)
    db.add(prod)
    db.commit()

    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_po_lifecycle(test_db):
    sup = test_db.query(Supplier).first()
    prod = test_db.query(Product).first()

    # 1. Create Draft
    po = create_purchase_order_draft(
        db=test_db,
        supplier_id=sup.id,
        items_data=[{"product_id": prod.id, "quantity": 10}],
        notes="Automated test draft"
    )
    assert po.status == "DRAFT"
    assert po.total_amount == 500.0  # 10 * 50.0
    assert len(po.items) == 1

    # 2. Approve Draft
    approved_po = approve_purchase_order(db=test_db, po_id=po.id)
    assert approved_po.status == "APPROVED"

    # 3. Prevent Double Approval / Rejecting Approved PO
    with pytest.raises(HTTPException) as excinfo:
        approve_purchase_order(db=test_db, po_id=po.id)
    assert excinfo.value.status_code == 409

    with pytest.raises(HTTPException) as excinfo:
        reject_purchase_order(db=test_db, po_id=po.id, reason="Too expensive")
    assert excinfo.value.status_code == 409
