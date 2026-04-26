import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Meter, MeterStatus } from "../types";
import { Search, Filter, ChevronRight, Droplets, MapPin, Activity, AlertTriangle, CheckCircle, Clock, Battery } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "../lib/utils";

const StatusBadge = ({ status }: { status: MeterStatus }) => {
  const config = {
    [MeterStatus.ONLINE]: { icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" },
    [MeterStatus.OFFLINE]: { icon: Activity, color: "text-zinc-500 bg-zinc-50 border-zinc-200" },
    [MeterStatus.ALARM]: { icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
    [MeterStatus.MAINTENANCE]: { icon: Activity, color: "text-blue-600 bg-blue-50 border-blue-200" },
    [MeterStatus.MISSING]: { icon: Clock, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  };
  const { icon: Icon, color } = config[status];
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", color)}>
      <Icon size={10} />
      {status}
    </div>
  );
};

export default function MeterList() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<MeterStatus | "all" | "low_battery">(
    (searchParams.get("status") as MeterStatus | "low_battery") || "all"
  );

  useEffect(() => {
    api.meters.list().then(setMeters);
  }, []);

  const filteredMeters = meters.filter(m => {
    const matchesSearch = m.meter_id.toLowerCase().includes(search.toLowerCase()) || 
                         m.serial_number.toLowerCase().includes(search.toLowerCase()) ||
                         m.site.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all"
        ? true
        : filter === MeterStatus.ALARM
          ? Boolean(m.has_active_alarm)
          : filter === "low_battery"
          ? m.battery_level < 20
          : m.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 italic serif tracking-tight">Meter Fleet</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, SN, Site..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
            />
          </div>
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-1 overflow-x-auto max-w-full">
            {(["all", "low_battery", ...Object.values(MeterStatus)] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1",
                  filter === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {s === "low_battery" && <Battery size={12} />}
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_60px] p-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="col-header">#</div>
          <div className="col-header">Meter ID / SN</div>
          <div className="col-header">Site / Location</div>
          <div className="col-header">Zone</div>
          <div className="col-header">Status</div>
          <div className="col-header">Last Update</div>
          <div className="col-header"></div>
        </div>

        <div className="divide-y divide-zinc-100">
          {filteredMeters.map((meter, i) => (
            <Link 
              key={meter.meter_id} 
              to={`/meters/${meter.meter_id}`}
              className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_60px] p-4 items-center hover:bg-zinc-50 transition-colors group"
            >
              <div className="data-value text-zinc-400 text-xs">{i + 1}</div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 mono">{meter.meter_id}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{meter.serial_number}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-zinc-700 font-medium">{meter.site}</span>
                <span className="text-[10px] text-zinc-400 font-semibold">{meter.location}</span>
              </div>
              <div className="data-value text-xs text-zinc-600">{meter.zone}</div>
              <div>
                <StatusBadge status={meter.status} />
              </div>
              <div className="data-value text-xs text-zinc-500">
                {meter.last_daily_update ? new Date(meter.last_daily_update).toLocaleDateString() : "N/A"}
              </div>
              <div className="flex justify-end">
                <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {filteredMeters.length === 0 && (
          <div className="p-12 text-center text-zinc-500 italic serif">
            No meters found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
