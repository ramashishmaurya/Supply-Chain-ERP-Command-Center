from fastapi import APIRouter
from app.api.dashboard import router as dashboard_router
from app.api.inventory import router as inventory_router
from app.api.suppliers import router as suppliers_router
from app.api.purchase_orders import router as po_router
from app.api.copilot import router as copilot_router
from app.api.audit import router as audit_router

api_router = APIRouter()
api_router.include_router(dashboard_router)
api_router.include_router(inventory_router)
api_router.include_router(suppliers_router)
api_router.include_router(po_router)
api_router.include_router(copilot_router)
api_router.include_router(audit_router)
