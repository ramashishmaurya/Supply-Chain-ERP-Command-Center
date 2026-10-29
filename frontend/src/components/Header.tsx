"use client";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Environment Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Enterprise Demo Node</span>
        </div>

        {/* User Role */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold text-xs">
            OP
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-200">Procurement Lead</div>
            <div className="text-[10px] text-slate-400">Admin Privileges</div>
          </div>
        </div>
      </div>
    </header>
  );
}
