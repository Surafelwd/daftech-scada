import React, { useState } from "react";
import { ShieldCheck, Users, Database, Activity, RefreshCw, CheckCircle, AlertTriangle, Clock, Server, HardDrive } from "lucide-react";
import { cn } from "../lib/utils";

const SYSTEM_HEALTH = [
  { id: "ingestion", title: "Ingestion Pipeline", description: "Daily telemetry processing status.", status: "Healthy", icon: Activity, color: "bg-blue-600" },
  { id: "database", title: "Database Health", description: "Storage usage and query performance.", status: "Healthy", icon: Database, color: "bg-green-600" },
  { id: "scheduler", title: "Daily Polling Scheduler", description: "Status of automated daily tasks.", status: "Active", icon: Clock, color: "bg-orange-600" },
  { id: "queue", title: "Command Queue Depth", description: "Pending commands and failed jobs.", status: "Empty", icon: Server, color: "bg-zinc-600" },
];

export default function SystemAdmin() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 italic serif">System Health & Admin</h1>
          <p className="text-zinc-500 text-sm">Platform reliability and user administration.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/20">
            <Users className="h-4 w-4" />
            Manage Users
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SYSTEM_HEALTH.map((health) => (
          <div key={health.id} className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-6">
              <div className={cn("p-3 rounded-xl text-white shadow-lg", health.color)}>
                <health.icon size={24} />
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                health.status === "Healthy" || health.status === "Active" || health.status === "Empty" ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
              )}>
                {health.status}
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2 italic serif">{health.title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-6">{health.description}</p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <RefreshCw size={12} className="animate-spin" />
              Monitoring Live
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8 italic serif text-zinc-500">Storage Usage</h3>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-zinc-500">Firestore Documents</span>
                <span className="text-zinc-900 mono">1.2 GB / 10 GB</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: "12%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-zinc-500">Audit Logs (30 Days)</span>
                <span className="text-zinc-900 mono">450 MB / 5 GB</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: "9%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-zinc-500">Raw Payload Cache</span>
                <span className="text-zinc-900 mono">8.5 GB / 20 GB</span>
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600" style={{ width: "42%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl p-8 text-white shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8 italic serif text-zinc-400">System Audit Trail</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-4">
                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-500">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold italic serif">Admin updated role for User_00{i}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Action: USER_ROLE_UPDATE • IP: 192.168.1.{10+i}</div>
                  <div className="text-[10px] text-zinc-600 mono mt-1">2026-03-30 09:45:1{i}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
            View Full Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
