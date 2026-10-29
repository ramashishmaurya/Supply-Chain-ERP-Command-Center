export interface KPISummary {
  total_skus: number;
  low_stock_items: number;
  critical_stockout_risks: number;
  open_purchase_orders: number;
  total_inventory_value: number;
  average_supplier_reliability: number;
}

export interface CategoryDistribution {
  category: string;
  item_count: number;
  total_stock: number;
  total_value: number;
}

export interface CriticalAlert {
  sku: string;
  name: string;
  days_of_supply: number;
  lead_time_days: number;
  risk_level: string;
  reorder_urgency: string;
}

export interface DashboardSummary {
  kpis: KPISummary;
  category_distribution: CategoryDistribution[];
  recent_critical_alerts: CriticalAlert[];
}

export interface InventoryItem {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  category: string;
  unit_price: number;
  warehouse_id: number;
  warehouse_name: string;
  warehouse_code: string;
  current_stock: number;
  incoming_stock: number;
  safety_stock: number;
  avg_daily_demand: number;
  supplier_id: number;
  supplier_name: string;
  supplier_lead_time: number;
  last_updated?: string;
}

export interface InventoryRisk {
  product_id: number;
  sku: string;
  product_name: string;
  category: string;
  supplier_name: string;
  lead_time_days: number;
  avg_daily_demand: number;
  safety_stock: number;
  current_stock: number;
  incoming_stock: number;
  effective_stock: number;
  reorder_point: number;
  days_of_supply: number;
  risk_level: string;
  status_color: string;
  reorder_urgency: string;
  suggested_order_qty: number;
  estimated_reorder_cost: number;
  explanation: string;
}

export interface SupplierItem {
  id: number;
  code: string;
  name: string;
  contact_email: string;
  lead_time_days: number;
  reliability_score: number;
  on_time_delivery_rate: number;
  performance_tier: string;
  active_products_count: number;
}

export interface PurchaseOrderItem {
  id: number;
  product_id: number;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_code: string;
  status: "DRAFT" | "APPROVED" | "REJECTED" | "CANCELLED";
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
}

export interface AuditLogItem {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  details: string;
  performed_by: string;
  timestamp: string;
}

export interface ToolCallLog {
  tool_name: string;
  arguments: Record<string, any>;
  result_summary: string;
}

export interface ChatResponse {
  reply: string;
  tools_executed: ToolCallLog[];
  suggested_action?: Record<string, any>;
}
