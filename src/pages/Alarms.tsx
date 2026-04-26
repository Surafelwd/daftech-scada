import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Filter, Search, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { Meter, AlarmEntry, AlarmSeverity } from "../types";
import { cn } from "../lib/utils";

type AlarmRow = {
  meterId: string;
  site: string;
  zone: string;
  alarm: AlarmEntry;
};

export default function Alarms() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [alarms, setAlarms] = useState<AlarmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlarmSeverity | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allMeters = await api.meters.list();
      setMeters(allMeters);

      // Pull alarms from the latest telemetry for each meter.
      const latestTelemetry = await Promise.all(
        allMeters.map(async (m) => {
          try {
            const latest = await api.telemetry.latest(m.meter_id);
            return { meter: m, latest };
          } catch {
            return { meter: m, latest: null as any };
          }
        })
      );

      const rows: AlarmRow[] = [];
      for (const item of latestTelemetry) {
        const latest = item.latest;
        if (!latest?.alarms?.length) continue;
        for (const alarm of latest.alarms) {
          if (alarm.acknowledged) continue;
          rows.push({
            meterId: item.meter.meter_id,
            site: item.meter.site,
            zone: item.meter.zone,
            alarm,
          });
        }
      }

      // Newest first
      rows.sort((a, b) => (a.alarm.timestamp < b.alarm.timestamp ? 1 : -1));
      setAlarms(rows);
      setLoading(false);
    };

    load();
  }, []);

  const filteredAlarms = alarms
    .filter((a) => (filter === "all" ? true : a.alarm.severity === filter))
    .filter((a) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        a.meterId.toLowerCase().includes(q) ||
        a.site.toLowerCase().includes(q) ||
        a.zone.toLowerCase().includes(q) ||
        a.alarm.code.toLowerCase().includes(q) ||
        a.alarm.message.toLowerCase().includes(q)
      );
    });

  if (loading) return <div className="animate-pulse">Loading alarms...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 italic serif">Alarm Queue</h1>
          <p className="text-zinc-500 text-sm">Manage and acknowledge active system alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">
            Acknowledge All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search by Meter ID or Site..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg text-xs font-bold uppercase tracking-widest px-3 py-2 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value={AlarmSeverity.CRITICAL}>Critical</option>
              <option value={AlarmSeverity.HIGH}>High</option>
              <option value={AlarmSeverity.MEDIUM}>Medium</option>
              <option value={AlarmSeverity.LOW}>Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Severity</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Meter ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Site</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Zone</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Message</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAlarms.length > 0 ? filteredAlarms.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                      item.alarm.severity === AlarmSeverity.CRITICAL ? "bg-red-50 text-red-600 border-red-100" :
                      item.alarm.severity === AlarmSeverity.HIGH ? "bg-orange-50 text-orange-600 border-orange-100" :
                      item.alarm.severity === AlarmSeverity.MEDIUM ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {item.alarm.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold mono text-zinc-900">{item.meterId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{item.site}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{item.zone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-600">{item.alarm.message}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-zinc-400 mono">{new Date(item.alarm.timestamp).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-green-600 transition-colors" title="Acknowledge">
                        <CheckCircle size={16} />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-red-600 transition-colors" title="Close">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 italic serif">
                    No active alarms found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
