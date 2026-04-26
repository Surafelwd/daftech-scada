import React, { useState } from "react";
import { Globe, Key, Link2, Activity, Shield, RefreshCw, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { cn } from "../lib/utils";

const INTEGRATIONS = [
  { id: "mqtt", title: "MQTT Publisher", description: "Push daily telemetry to external MQTT brokers.", status: "Active", icon: Activity, color: "bg-blue-600" },
  { id: "opcua", title: "OPC UA Bridge", description: "Expose meter data via standard industrial protocol.", status: "Inactive", icon: Globe, color: "bg-zinc-600" },
  { id: "webhook", title: "Webhook Configs", description: "HTTP callbacks for real-time alarm notifications.", status: "Active", icon: Link2, color: "bg-green-600" },
  { id: "api", title: "REST API Access", description: "Direct programmatic access to your SCADA data.", status: "Active", icon: Key, color: "bg-orange-600" },
];

export default function Integration() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 italic serif">Integration & API</h1>
          <p className="text-zinc-500 text-sm">Interoperability with external systems and industrial protocols.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/20">
            <Shield className="h-4 w-4" />
            Generate API Key
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-6">
              <div className={cn("p-3 rounded-xl text-white shadow-lg", integration.color)}>
                <integration.icon size={24} />
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                integration.status === "Active" ? "bg-green-50 text-green-600 border-green-100" : "bg-zinc-50 text-zinc-400 border-zinc-100"
              )}>
                {integration.status}
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2 italic serif">{integration.title}</h3>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">{integration.description}</p>
            <div className="flex items-center gap-3">
              <button className="flex-1 bg-zinc-100 text-zinc-900 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                Configure
              </button>
              <button className="p-3 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-all" title="View Logs">
                <Activity size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest italic serif text-zinc-400">Outbound Integration Logs</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-500">
              <CheckCircle size={12} />
              98.4% Success
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500">
              <AlertTriangle size={12} />
              1.6% Failed
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex items-center justify-between hover:bg-zinc-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded text-white", i === 3 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500")}>
                  <RefreshCw size={20} className={i === 1 ? "animate-spin" : ""} />
                </div>
                <div>
                  <div className="text-sm font-bold italic serif">MQTT_PUSH_MTR_00{i}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Payload: Telemetry • Destination: AWS IoT Core</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("text-[10px] font-bold uppercase tracking-widest", i === 3 ? "text-red-500" : "text-green-500")}>
                  {i === 3 ? "Failed (Timeout)" : "Success"}
                </div>
                <div className="text-[10px] text-zinc-500 mono">2026-03-30 09:45:1{i}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
