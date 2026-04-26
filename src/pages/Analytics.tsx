import React, { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  AlertTriangle, 
  Battery, 
  Activity, 
  Droplets, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Search
} from "lucide-react";
import { api } from "../services/api";
import { Meter } from "../types";

export default function Analytics() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [consumptionTrend, setConsumptionTrend] = useState<{ date: string; current: number; baseline: number }[]>([]);
  const [batteryForecast, setBatteryForecast] = useState<{ name: string; value: number; color: string }[]>([]);
  const [tofDrift, setTofDrift] = useState<{ date: string; ups: number; dns: number }[]>([]);
  const [siteComparison, setSiteComparison] = useState<{ name: string; value: number }[]>([]);
  const [zoneHealth, setZoneHealth] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const allMeters = await api.meters.list();
      setMeters(allMeters);

      const [trend, battery, tof, sitesAgg, zonesAgg] = await Promise.all([
        api.analytics.dailyConsumptionTrend(7),
        api.analytics.batteryForecast(),
        api.analytics.tofDrift(30),
        api.analytics.siteComparison(),
        api.analytics.zoneHealth(),
      ]);

      setConsumptionTrend(trend);
      setBatteryForecast(battery);
      setTofDrift(tof);
      setSiteComparison(sitesAgg);
      setZoneHealth(zonesAgg);

      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="animate-pulse flex items-center justify-center min-h-[400px] text-zinc-400 italic serif">Loading Decision Support Analytics...</div>;

  const sites = Array.from(new Set(meters.map(m => m.site)));
  const filteredMeters = selectedSite === "all" ? meters : meters.filter((m) => m.site === selectedSite);
  const topLeakRisk = [...filteredMeters].sort((a, b) => b.leak_risk_score - a.leak_risk_score).slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 italic serif">Decision Support Analytics</h1>
          <p className="text-zinc-500 text-sm">Advanced analysis of consumption, health, and maintenance forecasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select 
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent border-none text-xs font-bold uppercase tracking-widest focus:outline-none"
            >
              <option value="all">All Sites</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/20">
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Daily Consumption Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest italic serif text-zinc-500">Daily Consumption Trend (m³)</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Current Week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-zinc-200 rounded-full"></div>
                <span>Baseline</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionTrend}>
                <defs>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="current" stroke="#2563eb" fillOpacity={1} fill="url(#colorCons)" strokeWidth={2} />
                <Area type="monotone" dataKey="baseline" stroke="#94a3b8" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leak Risk Ranking */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8 italic serif text-zinc-500">Leak Risk Ranking</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLeakRisk} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="meter_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="leak_risk_score" radius={[0, 4, 4, 0]}>
                  {topLeakRisk.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.leak_risk_score > 70 ? '#ef4444' : entry.leak_risk_score > 40 ? '#f97316' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Battery Replacement Forecast */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8 italic serif text-zinc-500">Battery Replacement Forecast</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={batteryForecast}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {batteryForecast.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {batteryForecast.map((d) => (
              <div key={d.name} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-zinc-500">{d.name}:</span>
                <span className="text-zinc-900 mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Drift Indicators (TOF) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest italic serif text-zinc-500">Sensor Drift Indicators (TOF Trends)</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>ABS TOF UPS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>ABS TOF DNS</span>
              </div>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tofDrift}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="ups" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dns" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[10px] text-zinc-400 italic serif">
            * Significant divergence between UPS and DNS may indicate sensor fouling or transducer drift.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl p-8 text-white shadow-lg">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-8 italic serif text-zinc-400">Site & Zone Comparison</h3>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Consumption by Site (m³)</h4>
            <div className="space-y-4">
              {siteComparison.map(site => (
                <div key={site.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-zinc-400 italic serif">{site.name}</span>
                    <span className="mono">{site.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${(site.value / 4500) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Network Health by Zone (%)</h4>
            <div className="space-y-4">
              {zoneHealth.map(zone => (
                <div key={zone.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-zinc-400 italic serif">{zone.name} Zone</span>
                    <span className="mono">{zone.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: `${zone.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
