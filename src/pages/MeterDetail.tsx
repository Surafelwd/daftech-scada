import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { Meter, Telemetry, Command, MeterStatus } from "../types";
import { ChevronLeft, Terminal, Activity, Battery, Signal, Droplets, AlertTriangle, Clock, RefreshCw, Send } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../lib/utils";

const MetricCard = ({ label, value, unit, icon: Icon, color }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow-inner">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      <Icon size={14} className={color} />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold mono text-white">{value ?? "---"}</span>
      <span className="text-[10px] font-bold text-zinc-600 uppercase">{unit}</span>
    </div>
  </div>
);

export default function MeterDetail() {
  const { id } = useParams<{ id: string }>();
  const [meter, setMeter] = useState<Meter | null>(null);
  const [latest, setLatest] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.meters.get(id),
      api.telemetry.latest(id).catch(() => null),
      api.telemetry.history(id, 7),
      api.commands.list(id)
    ]).then(([m, l, h, c]) => {
      setMeter(m);
      setLatest(l);
      setHistory(h);
      setCommands(c);
      setLoading(false);
    });
  }, [id]);

  if (loading || !meter) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/meters" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft size={16} />
          <span>Back to Fleet</span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors">
            <Terminal size={14} />
            Issue Command
          </button>
          <button className="p-2 bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
                <Droplets size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 mono">{meter.meter_id}</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{meter.serial_number}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Status</span>
                <span className={cn("font-bold uppercase tracking-widest", 
                  meter.status === MeterStatus.ONLINE ? "text-green-600" : "text-red-600"
                )}>{meter.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Site</span>
                <span className="text-zinc-900 font-bold">{meter.site}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Location</span>
                <span className="text-zinc-900 font-bold">{meter.location}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Firmware</span>
                <span className="text-zinc-900 font-bold mono">{meter.firmware_version}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 shadow-xl space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Real-time Diagnostics</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Battery" value={latest?.battery} unit="%" icon={Battery} color="text-green-500" />
              <MetricCard label="Signal" value={latest?.network_strength} unit="dBm" icon={Signal} color="text-blue-500" />
              <MetricCard label="Flow Rate" value={latest?.flow_rate} unit="m³/h" icon={Activity} color="text-orange-500" />
              <MetricCard label="Total Vol" value={latest?.total_volume} unit="m³" icon={Droplets} color="text-cyan-500" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-6 italic serif">Flow Rate History (7 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="snapshot_date_utc" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="flow_rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 italic serif">Recent Alarms</h3>
              <div className="space-y-3">
                {latest?.alarms.map((alarm, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <AlertTriangle size={16} className="text-red-600" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-900 uppercase tracking-wider">{alarm.code}</p>
                      <p className="text-[10px] text-red-600 font-medium">{alarm.message}</p>
                      <p className="text-[10px] text-red-500 font-medium">Detected at {new Date(alarm.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {(!latest?.alarms || latest.alarms.length === 0) && (
                  <div className="text-center py-8 text-zinc-400 italic text-xs">No active alarms detected.</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 italic serif">Command History</h3>
              <div className="space-y-3">
                {commands.map((cmd) => (
                  <div key={cmd.command_id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-md", 
                        cmd.status === "ack" ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-500"
                      )}>
                        <Send size={12} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">{cmd.command_type}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{new Date(cmd.created_at_utc).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", 
                      cmd.status === "ack" ? "text-green-600" : "text-zinc-400"
                    )}>{cmd.status}</span>
                  </div>
                ))}
                {commands.length === 0 && (
                  <div className="text-center py-8 text-zinc-400 italic text-xs">No command history.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
