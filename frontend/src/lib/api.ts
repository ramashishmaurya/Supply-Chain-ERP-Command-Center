import {
  DashboardSummary,
  InventoryItem,
  InventoryRisk,
  SupplierItem,
  PurchaseOrder,
  AuditLogItem,
  ChatResponse
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return res.json();
}

export async function fetchInventory(search?: string): Promise<InventoryItem[]> {
  const url = new URL(`${API_BASE}/inventory`);
  if (search) url.searchParams.append("search", search);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function fetchInventoryRisks(filter?: string): Promise<InventoryRisk[]> {
  const url = new URL(`${API_BASE}/inventory/risks`);
  if (filter) url.searchParams.append("filter_type", filter);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch inventory risks");
  return res.json();
}

export async function fetchSuppliers(): Promise<SupplierItem[]> {
  const res = await fetch(`${API_BASE}/suppliers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
}

export async function fetchPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
  const url = new URL(`${API_BASE}/purchase-orders`);
  if (status) url.searchParams.append("status", status);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch purchase orders");
  return res.json();
}

export async function createPurchaseOrderDraft(data: {
  supplier_id: number;
  items: { product_id: number; quantity: number }[];
  notes?: string;
}): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE}/purchase-orders/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create draft purchase order");
  return res.json();
}

export async function approvePurchaseOrder(poId: number): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE}/purchase-orders/${poId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved_by: "Procurement Manager (Demo User)" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Approval failed" }));
    throw new Error(err.detail || "Failed to approve purchase order");
  }
  return res.json();
}

export async function rejectPurchaseOrder(poId: number, reason: string): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE}/purchase-orders/${poId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, rejected_by: "Procurement Reviewer" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Rejection failed" }));
    throw new Error(err.detail || "Failed to reject purchase order");
  }
  return res.json();
}

export async function fetchAuditLogs(limit: number = 50): Promise<AuditLogItem[]> {
  const res = await fetch(`${API_BASE}/audit-logs?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

export async function sendCopilotChat(query: string, history: { role: string; content: string }[]): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/copilot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, history }),
  });
  if (!res.ok) throw new Error("Failed to get copilot response");
  return res.json();
}
