from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    contact_email = Column(String(100), nullable=False)
    lead_time_days = Column(Integer, nullable=False, default=7)
    reliability_score = Column(Float, nullable=False, default=95.0)  # 0 to 100%
    on_time_delivery_rate = Column(Float, nullable=False, default=90.0)  # 0 to 100%
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
