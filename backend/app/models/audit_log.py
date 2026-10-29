from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # e.g., "PURCHASE_ORDER", "INVENTORY"
    entity_id = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)        # e.g., "CREATE_DRAFT", "APPROVE", "REJECT", "AI_PROPOSED"
    details = Column(Text, nullable=False)
    performed_by = Column(String(100), nullable=False, default="System User")
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
