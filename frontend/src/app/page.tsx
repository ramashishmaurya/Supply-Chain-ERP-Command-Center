"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { fetchDashboardSummary } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";
import { 
  AlertTriangle, 
  Boxes, 
  Bot, 
  CheckCircle, 
  DollarSign, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  TrendingUp,
  FileText
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardSummary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header 
        title="Supply Chain & ERP Command Center" 
        subtitle="Real-time deterministic inventory risk calculations and AI Copilot recommendations"
      />

      <main className="p-8 space-y-8 flex-1">
        {loading && (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            Loading ERP database telemetry...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200">
            Failed to connect to backend: {error}. Ensure FastAPI is running on port 8000.
          </div>
        )}

        {data && (
          <>
            {/* Critical Stockout Banner */}
            {data.kpis.critical_stockout_risks > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-800/80 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-red-900/60 text-red-400 flex items-center justify-center shrink-0 border border-red-700/50">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-200">
                      Action Required: {data.kpis.critical_stockout_risks} SKUs at Critical Stockout Risk
                    </h3>
                    <p className="text-xs text-slate-400">
                      Physical stock coverage is strictly lower than supplier lead time. Stockout will occur before standard replenishment can arrive.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/inventory"
                    className="px-3.5 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/50 text-red-300 text-xs font-semibold border border-red-700/60 transition"
                  >
                    View Risk Table
                  </Link>
                  <Link
                    href="/copilot"
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Ask Copilot to Reorder
                  </Link>
                </div>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Catalog SKUs</span>
                  <div className="p-2 rounded-lg bg-slate-800 text-blue-400">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100 mt-3">{data.kpis.total_skus}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  Total Valuation: <span className="text-slate-200 font-semibold">${data.kpis.total_inventory_value.toLocaleString()}</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Stockout Risks</span>
                  <div className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-800/40">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-400 mt-3">{data.kpis.critical_stockout_risks}</div>
                <div className="text-xs text-red-300/80 mt-1">
                  Immediate replenishment needed
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reorder Breaches</span>
                  <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/40">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400 mt-3">{data.kpis.low_stock_items}</div>
                <div className="text-xs text-amber-300/80 mt-1">
                  Current stock ≤ Reorder Point
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open POs & Vendor SLA</span>
                  <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-300 mt-3">{data.kpis.open_purchase_orders} Open</div>
                <div className="text-xs text-slate-400 mt-1">
                  Supplier Reliability: <span className="text-emerald-400 font-semibold">{data.kpis.average_supplier_reliability}%</span>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Alerts Table */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Critical Stockout Warnings (ROP Engine)</h3>
                    <p className="text-xs text-slate-400">Products where days of supply is lower than vendor lead time</p>
                  </div>
                  <Link
                    href="/inventory"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60 border-y border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-center">Days Supply</th>
                        <th className="py-2.5 px-3 text-center">Lead Time</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.recent_critical_alerts.map((alert) => (
                        <tr key={alert.sku} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono font-medium text-slate-200">{alert.sku}</td>
                          <td className="py-3 px-3 font-medium text-slate-100">{alert.name}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 font-bold border border-red-800/50">
                              {alert.days_of_supply} d
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400">{alert.lead_time_days} days</td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/30 text-red-400 border border-red-800/40">
                              HIGH URGENCY
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Inventory Breakdown */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-1">Inventory Valuation by Category</h3>
                  <p className="text-xs text-slate-400 mb-5">Capital allocation across warehouse stocks</p>

                  <div className="space-y-3.5">
                    {data.category_distribution.map((cat) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">{cat.category}</span>
                          <span className="text-slate-400 font-mono">${cat.total_value.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, (cat.total_value / data.kpis.total_inventory_value) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800">
                  <Link
                    href="/copilot"
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
                  >
                    <Bot className="w-4 h-4 text-blue-400" />
                    Launch Copilot Risk Diagnosis
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
