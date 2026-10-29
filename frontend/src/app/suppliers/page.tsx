"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { fetchSuppliers } from "@/lib/api";
import { SupplierItem } from "@/lib/types";
import { Truck, Clock, ShieldCheck, Mail, Info, Award, AlertCircle } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers()
      .then((data) => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header
        title="Supplier Performance & Reliability Analytics"
        subtitle="Historical lead times, on-time delivery rates, and vendor tier scorecard"
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Explanation Alert */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-100">Metric Calculation Methodology:</span>
            <p className="text-slate-400">
              Reliability Score is calculated from synthetic Goods Receipt Note (GRN) quality acceptance rates. 
              On-Time Delivery Rate tracks fulfillment against promised supplier lead times. 
              Vendors with lead times &gt; 12 days require increased safety stock buffering in the ROP engine.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            Loading supplier scorecard...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((s) => {
              const isHighRiskLeadTime = s.lead_time_days >= 14;
              return (
                <div
                  key={s.code}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition shadow-sm space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                          {s.code}
                        </span>
                        <h3 className="font-bold text-slate-100 text-base mt-2">{s.name}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                          s.reliability_score >= 95
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                            : s.reliability_score >= 85
                            ? "bg-blue-950/80 text-blue-300 border-blue-800"
                            : "bg-amber-950/80 text-amber-300 border-amber-800"
                        }`}
                      >
                        {s.performance_tier}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{s.contact_email}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3.5 pt-3 border-t border-slate-800/80 text-xs">
                    {/* Lead Time */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Contract Lead Time:
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isHighRiskLeadTime ? "text-amber-400" : "text-slate-200"
                        }`}
                      >
                        {s.lead_time_days} days
                        {isHighRiskLeadTime && (
                          <span className="ml-1 text-[10px] text-amber-500 font-normal">(Long)</span>
                        )}
                      </span>
                    </div>

                    {/* Reliability Score */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reliability Score:</span>
                        <span className="font-mono font-bold text-emerald-400">{s.reliability_score}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${s.reliability_score}%` }}
                        />
                      </div>
                    </div>

                    {/* On-Time Rate */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">On-Time Delivery Rate:</span>
                        <span className="font-mono font-bold text-blue-400">{s.on_time_delivery_rate}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${s.on_time_delivery_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Active SKUs Supplied:</span>
                    <span className="font-bold text-slate-300 font-mono">{s.active_products_count} Products</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
