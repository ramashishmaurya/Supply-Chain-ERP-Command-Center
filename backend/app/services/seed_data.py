import sys
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.models.supplier import Supplier
from app.models.warehouse import Warehouse
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.audit_log import AuditLog

def seed_database(force: bool = False):
    db: Session = SessionLocal()

    try:
        if force:
            print("Purging existing data for fresh enterprise re-seeding...")
            # Drop in reverse order of foreign keys
            db.query(AuditLog).delete()
            db.query(PurchaseOrderItem).delete()
            db.query(PurchaseOrder).delete()
            db.query(Inventory).delete()
            db.query(Product).delete()
            db.query(Warehouse).delete()
            db.query(Supplier).delete()
            db.commit()
        elif db.query(Supplier).first():
            print("Database already contains data. Use force=True to reseed.")
            return

        print("Seeding comprehensive Enterprise Supply Chain & ERP dataset into PostgreSQL...")

        # ==========================================
        # 1. SUPPLIERS (8 Enterprise Vendors)
        # ==========================================
        suppliers = [
            Supplier(code="SUP-APEX", name="Apex Microelectronics Ltd.", contact_email="procurement@apexmicro.io", lead_time_days=5, reliability_score=98.5, on_time_delivery_rate=96.2),
            Supplier(code="SUP-NORDIC", name="Nordic Precision Works", contact_email="sales@nordicprecision.de", lead_time_days=7, reliability_score=99.1, on_time_delivery_rate=98.0),
            Supplier(code="SUP-GLOBAL", name="Global Dynamics Logistics", contact_email="b2b@globaldynamics.com", lead_time_days=10, reliability_score=88.4, on_time_delivery_rate=84.5),
            Supplier(code="SUP-QUANTUM", name="Quantum Power Systems", contact_email="support@quantumpower.tech", lead_time_days=14, reliability_score=82.0, on_time_delivery_rate=77.3),
            Supplier(code="SUP-PACIFIC", name="Pacific Edge Sensors", contact_email="orders@pacificedge.jp", lead_time_days=18, reliability_score=78.2, on_time_delivery_rate=71.5),
            Supplier(code="SUP-MURATA", name="Murata High-Frequency Labs", contact_email="supply@muratalabs.jp", lead_time_days=6, reliability_score=96.8, on_time_delivery_rate=94.0),
            Supplier(code="SUP-SIEMENS", name="Siemens Industrial Controls", contact_email="orders@siemens-industry.de", lead_time_days=12, reliability_score=94.5, on_time_delivery_rate=91.2),
            Supplier(code="SUP-TEXAS", name="Texas High-Power Components", contact_email="enterprise@texashighpower.com", lead_time_days=8, reliability_score=91.0, on_time_delivery_rate=89.0),
        ]
        db.add_all(suppliers)
        db.flush()

        sup_map = {s.code: s for s in suppliers}

        # ==========================================
        # 2. WAREHOUSES (5 Strategic Hubs)
        # ==========================================
        warehouses = [
            Warehouse(code="WH-EAST", name="North America Central Hub", location="Chicago, IL, USA"),
            Warehouse(code="WH-WEST", name="Pacific Distribution Depot", location="Reno, NV, USA"),
            Warehouse(code="WH-EU", name="European Regional Fulfillment", location="Rotterdam, Netherlands"),
            Warehouse(code="WH-APAC", name="Asia-Pacific Logistics Hub", location="Jurong, Singapore"),
            Warehouse(code="WH-LATAM", name="Latin America Strategic Depot", location="São Paulo, Brazil"),
        ]
        db.add_all(warehouses)
        db.flush()

        wh_map = {w.code: w for w in warehouses}

        # ==========================================
        # 3. PRODUCTS (20 Enterprise SKUs across 8 Categories)
        # ==========================================
        products = [
            # Critical Stockout Archetypes
            Product(sku="SKU-ARM-X900", name="ARM Cortex-M7 Industrial Core Processor", category="Semiconductors", unit_price=145.00, safety_stock=50, avg_daily_demand=22.0, supplier_id=sup_map["SUP-PACIFIC"].id),
            Product(sku="SKU-FPGA-Z7", name="UltraScale+ FPGA System-on-Module", category="Semiconductors", unit_price=320.00, safety_stock=25, avg_daily_demand=6.0, supplier_id=sup_map["SUP-PACIFIC"].id),
            Product(sku="SKU-MEM-DDR5", name="16GB Industrial LPDDR5 Memory IC", category="Memory", unit_price=42.50, safety_stock=35, avg_daily_demand=15.0, supplier_id=sup_map["SUP-QUANTUM"].id),
            Product(sku="SKU-OPT-S40", name="High-Res Optical Proximity Sensor", category="Sensors", unit_price=18.75, safety_stock=40, avg_daily_demand=16.0, supplier_id=sup_map["SUP-GLOBAL"].id),
            Product(sku="SKU-IMU-6AXIS", name="Automotive 6-Axis Motion Tracking IMU", category="Sensors", unit_price=24.50, safety_stock=30, avg_daily_demand=14.0, supplier_id=sup_map["SUP-PACIFIC"].id),
            
            # Reorder Threshold Breach Archetypes
            Product(sku="SKU-CAN-TX2", name="Dual-Channel Isolated CAN Bus Transceiver", category="Connectivity", unit_price=12.20, safety_stock=60, avg_daily_demand=20.0, supplier_id=sup_map["SUP-NORDIC"].id),
            Product(sku="SKU-ETH-1G", name="Rugged Industrial Gigabit Ethernet PHY", category="Connectivity", unit_price=14.80, safety_stock=50, avg_daily_demand=18.0, supplier_id=sup_map["SUP-MURATA"].id),
            Product(sku="SKU-DC-50W", name="Wide-Input 50W Isolated DC-DC Converter", category="Power Management", unit_price=36.00, safety_stock=40, avg_daily_demand=12.0, supplier_id=sup_map["SUP-TEXAS"].id),
            Product(sku="SKU-EMMC-32G", name="32GB Industrial eMMC Flash Storage", category="Memory", unit_price=28.50, safety_stock=45, avg_daily_demand=16.0, supplier_id=sup_map["SUP-QUANTUM"].id),
            Product(sku="SKU-PLC-CPU", name="Micro-PLC Automation Logic Controller", category="Industrial Controls", unit_price=210.00, safety_stock=20, avg_daily_demand=5.0, supplier_id=sup_map["SUP-SIEMENS"].id),

            # Healthy Stock Archetypes
            Product(sku="SKU-PWR-M65", name="65W GaN High-Efficiency Power Module", category="Power Management", unit_price=28.00, safety_stock=100, avg_daily_demand=30.0, supplier_id=sup_map["SUP-APEX"].id),
            Product(sku="SKU-CON-USB4", name="Industrial Ruggedized USB-C 4.0 Receptacle", category="Passive Components", unit_price=3.40, safety_stock=120, avg_daily_demand=45.0, supplier_id=sup_map["SUP-APEX"].id),
            Product(sku="SKU-THERM-80", name="Precision Thermal Heat Sink 80W Rating", category="Thermal Management", unit_price=9.80, safety_stock=30, avg_daily_demand=10.0, supplier_id=sup_map["SUP-NORDIC"].id),
            Product(sku="SKU-WIFI-6E", name="Embedded Wi-Fi 6E + BLE 5.3 RF Module", category="Connectivity", unit_price=16.50, safety_stock=80, avg_daily_demand=25.0, supplier_id=sup_map["SUP-MURATA"].id),
            Product(sku="SKU-RELAY-12V", name="Solid-State Industrial Switching Relay", category="Passive Components", unit_price=7.20, safety_stock=90, avg_daily_demand=35.0, supplier_id=sup_map["SUP-SIEMENS"].id),
            Product(sku="SKU-BUCK-24V", name="Synchronous 24V Step-Down Buck Regulator", category="Power Management", unit_price=11.40, safety_stock=70, avg_daily_demand=22.0, supplier_id=sup_map["SUP-TEXAS"].id),
            Product(sku="SKU-PRESS-TRAN", name="Stainless Steel Pressure Transducer 100PSI", category="Sensors", unit_price=64.00, safety_stock=20, avg_daily_demand=4.0, supplier_id=sup_map["SUP-GLOBAL"].id),
            Product(sku="SKU-FAN-120MM", name="IP68 Dual Ball-Bearing Cooling Fan 120mm", category="Thermal Management", unit_price=15.00, safety_stock=50, avg_daily_demand=15.0, supplier_id=sup_map["SUP-NORDIC"].id),
            Product(sku="SKU-NOR-64M", name="64MB Quad-SPI Industrial NOR Flash", category="Memory", unit_price=6.90, safety_stock=100, avg_daily_demand=30.0, supplier_id=sup_map["SUP-APEX"].id),
            Product(sku="SKU-RISCV-SOC", name="Dual-Core 64-bit RISC-V Embedded SoC", category="Semiconductors", unit_price=88.00, safety_stock=35, avg_daily_demand=8.0, supplier_id=sup_map["SUP-APEX"].id),
        ]
        db.add_all(products)
        db.flush()

        prod_map = {p.sku: p for p in products}

        # ==========================================
        # 4. INVENTORY (Multi-warehouse stock allocations)
        # ==========================================
        inventory_items = [
            # CRITICAL STOCKOUT ITEMS (Stock depleted, supplier lead time is high)
            Inventory(product_id=prod_map["SKU-ARM-X900"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=45, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-ARM-X900"].id, warehouse_id=wh_map["WH-WEST"].id, current_stock=20, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-FPGA-Z7"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=14, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-MEM-DDR5"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=48, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-OPT-S40"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=150, incoming_stock=20),
            Inventory(product_id=prod_map["SKU-IMU-6AXIS"].id, warehouse_id=wh_map["WH-APAC"].id, current_stock=35, incoming_stock=0),

            # REORDER THRESHOLD BREACHES (Stock <= ROP)
            Inventory(product_id=prod_map["SKU-CAN-TX2"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=160, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-ETH-1G"].id, warehouse_id=wh_map["WH-EU"].id, current_stock=120, incoming_stock=15),
            Inventory(product_id=prod_map["SKU-DC-50W"].id, warehouse_id=wh_map["WH-WEST"].id, current_stock=110, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-EMMC-32G"].id, warehouse_id=wh_map["WH-APAC"].id, current_stock=180, incoming_stock=50),
            Inventory(product_id=prod_map["SKU-PLC-CPU"].id, warehouse_id=wh_map["WH-EU"].id, current_stock=65, incoming_stock=0),

            # HEALTHY STOCKS
            Inventory(product_id=prod_map["SKU-PWR-M65"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=550, incoming_stock=200),
            Inventory(product_id=prod_map["SKU-PWR-M65"].id, warehouse_id=wh_map["WH-WEST"].id, current_stock=200, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-CON-USB4"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=1200, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-THERM-80"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=320, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-WIFI-6E"].id, warehouse_id=wh_map["WH-APAC"].id, current_stock=450, incoming_stock=100),
            Inventory(product_id=prod_map["SKU-RELAY-12V"].id, warehouse_id=wh_map["WH-EU"].id, current_stock=600, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-BUCK-24V"].id, warehouse_id=wh_map["WH-WEST"].id, current_stock=380, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-PRESS-TRAN"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=140, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-FAN-120MM"].id, warehouse_id=wh_map["WH-LATAM"].id, current_stock=280, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-NOR-64M"].id, warehouse_id=wh_map["WH-EAST"].id, current_stock=850, incoming_stock=0),
            Inventory(product_id=prod_map["SKU-RISCV-SOC"].id, warehouse_id=wh_map["WH-APAC"].id, current_stock=240, incoming_stock=50),
        ]
        db.add_all(inventory_items)
        db.flush()

        # ==========================================
        # 5. PURCHASE ORDERS (7 Realistic POs across status tiers)
        # ==========================================
        # PO 1: Approved GaN modules
        po1 = PurchaseOrder(po_number="PO-2026-001", supplier_id=sup_map["SUP-APEX"].id, status="APPROVED", total_amount=5600.00, notes="Scheduled Q1 replenishment for high-efficiency GaN power modules.")
        db.add(po1)
        db.flush()
        db.add(PurchaseOrderItem(purchase_order_id=po1.id, product_id=prod_map["SKU-PWR-M65"].id, quantity=200, unit_price=28.00, total_price=5600.00))

        # PO 2: Draft Optical Sensors
        po2 = PurchaseOrder(po_number="PO-2026-002", supplier_id=sup_map["SUP-GLOBAL"].id, status="DRAFT", total_amount=3750.00, notes="Automated draft recommendation to prevent optical sensor stockout.")
        db.add(po2)
        db.flush()
        db.add(PurchaseOrderItem(purchase_order_id=po2.id, product_id=prod_map["SKU-OPT-S40"].id, quantity=200, unit_price=18.75, total_price=3750.00))

        # PO 3: Draft Urgent ARM Cortex replenishment
        po3 = PurchaseOrder(po_number="PO-2026-003", supplier_id=sup_map["SUP-PACIFIC"].id, status="DRAFT", total_amount=14500.00, notes="Critical replenishment draft for Cortex-M7. Stockout anticipated in 3 days.")
        db.add(po3)
        db.flush()
        db.add(PurchaseOrderItem(purchase_order_id=po3.id, product_id=prod_map["SKU-ARM-X900"].id, quantity=100, unit_price=145.00, total_price=14500.00))

        # PO 4: Approved Connectivity batch
        po4 = PurchaseOrder(po_number="PO-2026-004", supplier_id=sup_map["SUP-NORDIC"].id, status="APPROVED", total_amount=3660.00, notes="Approved purchase for dual CAN bus transceivers and heatsinks.")
        db.add(po4)
        db.flush()
        db.add(PurchaseOrderItem(purchase_order_id=po4.id, product_id=prod_map["SKU-CAN-TX2"].id, quantity=300, unit_price=12.20, total_price=3660.00))

        # PO 5: Rejected order (budget policy limit)
        po5 = PurchaseOrder(po_number="PO-2026-005", supplier_id=sup_map["SUP-SIEMENS"].id, status="REJECTED", total_amount=21000.00, notes="Bulk PLC CPU order. [REJECTION REASON]: Exceeded monthly discretionary procurement limit; renegotiating contract tier.")
        db.add(po5)
        db.flush()
        db.add(PurchaseOrderItem(purchase_order_id=po5.id, product_id=prod_map["SKU-PLC-CPU"].id, quantity=100, unit_price=210.00, total_price=21000.00))

        # PO 6: Approved Wi-Fi and Ethernet shipment
        po6 = PurchaseOrder(po_number="PO-2026-006", supplier_id=sup_map["SUP-MURATA"].id, status="APPROVED", total_amount=5180.00, notes="Q1 wireless hardware replenishment for APAC manufacturing.")
        db.add(po6)
        db.flush()
        db.add(PurchaseOrderItem(purchase_order_id=po6.id, product_id=prod_map["SKU-WIFI-6E"].id, quantity=200, unit_price=16.50, total_price=3300.00))
        db.add(PurchaseOrderItem(purchase_order_id=po6.id, product_id=prod_map["SKU-ETH-1G"].id, quantity=100, unit_price=18.80, total_price=1880.00))

        # PO 7: Draft Memory IC
        po7 = PurchaseOrder(po_number="PO-2026-007", supplier_id=sup_map["SUP-QUANTUM"].id, status="DRAFT", total_amount=6375.00, notes="AI Copilot proposed draft order for LPDDR5 Memory ICs.")
        db.add(po7)
        db.flush()
        db.add(PurchaseOrderItem(purchase_order_id=po7.id, product_id=prod_map["SKU-MEM-DDR5"].id, quantity=150, unit_price=42.50, total_price=6375.00))

        # ==========================================
        # 6. AUDIT LOGS (8 Immutable Enterprise Audit Trails)
        # ==========================================
        audit_records = [
            AuditLog(entity_type="PURCHASE_ORDER", entity_id="PO-2026-001", action="APPROVE", details="Purchase order approved by VP of Procurement. Supplier acknowledged 5-day SLA.", performed_by="Sarah Connor (Head of Procurement)"),
            AuditLog(entity_type="PURCHASE_ORDER", entity_id="PO-2026-002", action="AI_PROPOSED", details="SupplyChain Copilot generated draft PO following stockout alert on SKU-OPT-S40.", performed_by="SupplyChain Copilot AI"),
            AuditLog(entity_type="INVENTORY", entity_id="SKU-ARM-X900", action="RISK_FLAGGED", details="Critical stockout flagged. Physical stock: 65 units, covering 3.0 days against 18-day lead time.", performed_by="Deterministic Risk Engine"),
            AuditLog(entity_type="PURCHASE_ORDER", entity_id="PO-2026-004", action="APPROVE", details="Approved purchase order PO-2026-004 for Nordic Precision Works.", performed_by="Alex Rivera (Procurement Lead)"),
            AuditLog(entity_type="PURCHASE_ORDER", entity_id="PO-2026-005", action="REJECT", details="Rejected purchase order PO-2026-005. Reason: Exceeded monthly discretionary procurement limit; renegotiating contract tier.", performed_by="Marcus Vance (Finance Controller)"),
            AuditLog(entity_type="PURCHASE_ORDER", entity_id="PO-2026-006", action="APPROVE", details="Approved expedited order for Wi-Fi and Ethernet hardware.", performed_by="Sarah Connor (Head of Procurement)"),
            AuditLog(entity_type="PURCHASE_ORDER", entity_id="PO-2026-007", action="AI_PROPOSED", details="SupplyChain Copilot generated draft PO following reorder breach on SKU-MEM-DDR5.", performed_by="SupplyChain Copilot AI"),
            AuditLog(entity_type="SUPPLIER", entity_id="SUP-PACIFIC", action="SLA_WARNING", details="Lead time breach detected: Average delivery variance exceeded 3.2 days across last 4 deliveries.", performed_by="Supplier Analytics Engine"),
        ]
        db.add_all(audit_records)

        db.commit()
        print("Successfully seeded 20 SKUs, 8 Suppliers, 5 Warehouses, 7 POs, and 8 Audit Logs into PostgreSQL!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    seed_database(force=force_flag)
