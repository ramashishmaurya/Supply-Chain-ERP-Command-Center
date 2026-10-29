"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { fetchInventoryRisks, createPurchaseOrderDraft } from "@/lib/api";
import { InventoryRisk } from "@/lib/types";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  ShoppingCart, 
  X, 
  Info,
  Check
} from "lucide-react";

export default function InventoryPage() {
  const [risks, setRisks] = useState<InventoryRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "CRITICAL" | "REORDER">("ALL");
  const [selectedItemForModal, setSelectedItemForModal] = useState<InventoryRisk | null>(null);
  const [draftSuccessMessage, setDraftSuccessMessage] = useState<string | null>(null);
  const [draftingSku, setDraftingSku] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedFilter]);

  const loadData = () => {
    setLoading(true);
    fetchInventoryRisks(selectedFilter === "ALL" ? undefined : selectedFilter)
      .then((data) => {
        setRisks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleDraftPO = async (item: InventoryRisk) => {
    try {
      setDraftingSku(item.sku);
      await createPurchaseOrderDraft({
        supplier_id: 1, // Will associate with default or item's supplier
        items: [
          {
            product_id: item.product_id,
            quantity: item.suggested_order_qty > 0 ? item.suggested_order_qty : 100,
          },
        ],
        notes: `Automated draft generated from Inventory Risk screen to prevent stockout on ${item.sku}.`,
      });
      setDraftSuccessMessage(`Draft Purchase Order generated for ${item.sku}! Check Purchase Orders tab.`);
      setTimeout(() => setDraftSuccessMessage(null), 5000);
    } catch (err: any) {
      alert("Failed to draft PO: " + err.message);
    } finally {
      setDraftingSku(null);
    }
  };

  const filteredRisks = risks.filter((r) => {
    const matchesSearch =
      r.sku.toLowerCase().includes(search.toLowerCase()) ||
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Header
        title="Inventory Risk & Reorder Point Engine"
        subtitle="Deterministic inventory replenishment analysis based on lead times and average daily demand"
      />

      <main className="p-8 space-y-6 flex-1">
        {draftSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 flex items-center justify-between text-xs shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{draftSuccessMessage}</span>
            </div>
            <button onClick={() => setDraftSuccessMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by SKU, name, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setSelectedFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedFilter === "ALL"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedFilter("CRITICAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedFilter === "CRITICAL"
                  ? "bg-red-950/80 text-red-300 border border-red-800"
                  : "text-slate-400 hover:text-red-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              Critical Stockout Risk
            </button>
            <button
              onClick={() => setSelectedFilter("REORDER")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedFilter === "REORDER"
                  ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Reorder Breaches
            </button>
          </div>
        </div>

        {/* Inventory Risk Table */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Product</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3 text-center">Stock (Curr / Inc)</th>
                  <th className="py-3 px-3 text-center">Daily Demand</th>
                  <th className="py-3 px-3 text-center">Lead Time</th>
                  <th className="py-3 px-3 text-center">ROP</th>
                  <th className="py-3 px-3 text-center">Days Supply</th>
                  <th className="py-3 px-3 text-center">Risk Tier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Calculating real-time supply chain formulas...
                    </td>
                  </tr>
                ) : filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No items found matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((item) => (
                    <tr key={item.sku} className="hover:bg-slate-800/40 transition">
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-100">{item.sku}</div>
                        <div className="text-[11px] text-slate-400">{item.product_name}</div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-300 font-medium">{item.supplier_name}</div>
                        <div className="text-[10px] text-slate-400">{item.category}</div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="font-bold text-slate-100">{item.current_stock}</span>
                        {item.incoming_stock > 0 && (
                          <span className="text-blue-400 text-[10px] ml-1">(+{item.incoming_stock})</span>
                        )}
                      </td>

                      {/* Daily Demand */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                        {item.avg_daily_demand} /day
                      </td>

                      {/* Lead Time */}
                      <td className="py-3.5 px-3 text-center text-slate-300 font-mono">
                        {item.lead_time_days}d
                      </td>

                      {/* ROP */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-200">
                        {item.reorder_point}
                      </td>

                      {/* Days Supply */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                            item.days_of_supply <= item.lead_time_days
                              ? "bg-red-950 text-red-300 border-red-800"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {item.days_of_supply} days
                        </span>
                      </td>

                      {/* Risk Tier */}
                      <td className="py-3.5 px-3 text-center">
                        {item.status_color === "red" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            CRITICAL
                          </span>
                        )}
                        {item.status_color === "amber" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                            REORDER
                          </span>
                        )}
                        {item.status_color === "green" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            HEALTHY
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedItemForModal(item)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
                          title="View mathematical ROP formula breakdown"
                        >
                          <Calculator className="w-3 h-3 inline mr-1 text-blue-400" />
                          Formula
                        </button>

                        <button
                          onClick={() => handleDraftPO(item)}
                          disabled={draftingSku === item.sku}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-semibold transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          {draftingSku === item.sku ? "Drafting..." : "Draft PO"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mathematical Explanation Modal */}
        {selectedItemForModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-400">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">
                      Deterministic ROP Breakdown
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedItemForModal.sku} - {selectedItemForModal.product_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mathematical Formula Display */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Reorder Point Formula
                </div>
                <div className="text-sm font-mono text-blue-300 font-bold">
                  ROP = (Avg Daily Demand × Supplier Lead Time) + Safety Stock
                </div>
                <div className="text-xs font-mono text-slate-300 pt-1">
                  ROP = ({selectedItemForModal.avg_daily_demand} × {selectedItemForModal.lead_time_days}) + {selectedItemForModal.safety_stock} = <span className="text-white font-bold">{selectedItemForModal.reorder_point} units</span>
                </div>
              </div>

              {/* Stock Coverage vs Lead Time Analysis */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Current Stock:</span>
                  <span className="font-mono text-slate-100 font-semibold">{selectedItemForModal.current_stock} units</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Incoming Stock:</span>
                  <span className="font-mono text-slate-100 font-semibold">{selectedItemForModal.incoming_stock} units</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Days of Physical Supply:</span>
                  <span className="font-mono text-slate-100 font-semibold">{selectedItemForModal.days_of_supply} days</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Supplier Lead Time:</span>
                  <span className="font-mono text-slate-100 font-semibold">{selectedItemForModal.lead_time_days} days</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Suggested Order Quantity:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedItemForModal.suggested_order_qty} units</span>
                </div>
              </div>

              {/* Diagnosis box */}
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                selectedItemForModal.status_color === "red"
                  ? "bg-red-950/40 border-red-800/70 text-red-200"
                  : selectedItemForModal.status_color === "amber"
                  ? "bg-amber-950/40 border-amber-800/70 text-amber-200"
                  : "bg-emerald-950/40 border-emerald-800/70 text-emerald-200"
              }`}>
                <strong>Operational Explanation:</strong> {selectedItemForModal.explanation}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDraftPO(selectedItemForModal);
                    setSelectedItemForModal(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-md flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Draft PO ({selectedItemForModal.suggested_order_qty} units)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
