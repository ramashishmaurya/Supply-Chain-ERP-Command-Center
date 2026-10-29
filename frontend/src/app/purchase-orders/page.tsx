"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { fetchPurchaseOrders, approvePurchaseOrder, rejectPurchaseOrder } from "@/lib/api";
import { PurchaseOrder } from "@/lib/types";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Check, 
  AlertCircle,
  ShieldCheck,
  DollarSign
} from "lucide-react";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectModalPo, setRejectModalPo] = useState<PurchaseOrder | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = () => {
    setLoading(true);
    fetchPurchaseOrders(statusFilter === "ALL" ? undefined : statusFilter)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleApprove = async (poId: number, poNumber: string) => {
    try {
      setActionLoadingId(poId);
      await approvePurchaseOrder(poId);
      setSuccessToast(`Purchase Order ${poNumber} has been successfully APPROVED!`);
      loadOrders();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalPo || !rejectReason.trim()) return;
    try {
      setActionLoadingId(rejectModalPo.id);
      await rejectPurchaseOrder(rejectModalPo.id, rejectReason);
      setSuccessToast(`Purchase Order ${rejectModalPo.po_number} has been REJECTED.`);
      setRejectModalPo(null);
      setRejectReason("");
      loadOrders();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      <Header
        title="Purchase Order Approval & Workflow Hub"
        subtitle="Human-in-the-Loop review for automated and manual replenishment drafts"
      />

      <main className="p-8 space-y-6 flex-1">
        {successToast && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {["ALL", "DRAFT", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st === "ALL" ? "All Orders" : st}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            Loading purchase order records...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No purchase orders found matching '{statusFilter}'.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((po) => {
              const isDraft = po.status === "DRAFT";
              const isApproved = po.status === "APPROVED";
              const isRejected = po.status === "REJECTED";

              return (
                <div
                  key={po.id}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 text-sm">
                            {po.po_number}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isApproved
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : isDraft
                                ? "bg-blue-950 text-blue-300 border-blue-800"
                                : "bg-red-950 text-red-300 border-red-800"
                            }`}
                          >
                            {po.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Supplier: <span className="text-slate-200 font-medium">{po.supplier_name}</span> ({po.supplier_code})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Capital</div>
                        <div className="text-base font-bold text-slate-100 font-mono">
                          ${po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* Action Buttons for Drafts */}
                      {isDraft && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRejectModalPo(po)}
                            disabled={actionLoadingId === po.id}
                            className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(po.id, po.po_number)}
                            disabled={actionLoadingId === po.id}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {actionLoadingId === po.id ? "Authorizing..." : "Approve PO"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                        <tr>
                          <th className="py-2 px-3">Item SKU</th>
                          <th className="py-2 px-3">Product Description</th>
                          <th className="py-2 px-3 text-center">Quantity</th>
                          <th className="py-2 px-3 text-right">Unit Price</th>
                          <th className="py-2 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {po.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-mono text-slate-200">{item.product_sku}</td>
                            <td className="py-2 px-3 text-slate-300">{item.product_name}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-100">{item.quantity}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-400">${item.unit_price.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-100 font-semibold">${item.total_price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes & Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <div>
                      {po.notes && (
                        <span><strong className="text-slate-300">Notes:</strong> {po.notes}</span>
                      )}
                    </div>
                    <div className="mt-1 sm:mt-0 font-mono text-slate-500">
                      Created: {new Date(po.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalPo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-slate-100 text-sm">
                Reject Purchase Order {rejectModalPo.po_number}
              </h3>
              <p className="text-xs text-slate-400">
                Please document a mandatory reason for rejecting this replenishment draft for audit logging:
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Supplier pricing exceeding Q1 target; renegotiating terms..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-red-500 transition"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectModalPo(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
