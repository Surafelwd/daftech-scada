import React, { useEffect, useState } from "react";
import { 
  Activity, 
  AlertTriangle, 
  Battery, 
  CheckCircle, 
  Clock, 
  Droplets, 
  Search, 
  Signal, 
  TrendingUp,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { api } from "../services/api";
import { Meter, AnalyticsSummary, AlarmSeverity, MeterStatus } from "../types";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [commHealth, setCommHealth] = useState<{ date: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allMeters = await api.meters.list();
      setMeters(allMeters);

      const analytics = await api.analytics.summary();
      setSummary(analytics);

      const commHealthSeries = await api.analytics.commHealth(30);
      setCommHealth(commHealthSeries);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground italic serif">
          Loading operational overview...
        </p>
      </div>
    );
  }

  const alarmData = summary ? [
    { name: "Critical", value: summary.alarms_by_severity[AlarmSeverity.CRITICAL], color: "#ef4444" },
    { name: "High", value: summary.alarms_by_severity[AlarmSeverity.HIGH], color: "#f97316" },
    { name: "Medium", value: summary.alarms_by_severity[AlarmSeverity.MEDIUM], color: "#eab308" },
    { name: "Low", value: summary.alarms_by_severity[AlarmSeverity.LOW], color: "#3b82f6" },
  ].filter(d => d.value > 0) : [];

  const topLeakRisk = [...meters]
    .sort((a, b) => b.leak_risk_score - a.leak_risk_score)
    .slice(0, 5);

  const lowBattery = [...meters]
    .sort((a, b) => a.battery_level - b.battery_level)
    .slice(0, 5);

  const missingReports = meters.filter(m => m.status === MeterStatus.MISSING).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 italic serif">Global Dashboard</h1>
          <p className="text-zinc-500 text-sm">Real-time operational overview of Daftech SCADA network.</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200">
          <Clock className="h-4 w-4 text-primary" />
          Last Ingestion: {summary?.last_ingestion_time ? new Date(summary.last_ingestion_time).toLocaleString() : "N/A"}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Meters" 
          value={summary?.total_meters || 0} 
          icon={Droplets} 
          color="bg-blue-600"
          description="Total provisioned devices"
        />
        <StatCard 
          title="Data Freshness" 
          value={`${summary?.reported_today || 0}/${summary?.total_meters || 0}`} 
          icon={CheckCircle} 
          color="bg-green-600"
          description="Reported today vs expected"
          trend={summary ? Math.round((summary.reported_today / summary.total_meters) * 100) : 0}
          trendLabel="% completion"
        />
        <StatCard 
          title="Active Alarms" 
          value={Object.values(summary?.alarms_by_severity || {}).reduce((a: number, b: number) => a + b, 0)} 
          icon={AlertTriangle} 
          color="bg-red-600"
          description="Total unacknowledged alerts"
        />
        <StatCard 
          title="Network Health" 
          value={`${summary?.comm_health_score || 0}%`} 
          icon={Signal} 
          color="bg-zinc-900"
          description="Avg communication success"
          trend={2}
          trendLabel="vs yesterday"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Alarm Severity Donut */}
        <div className="col-span-1 lg:col-span-3 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 italic serif text-zinc-500">Alarm Severity Distribution</h3>
          <div className="h-[250px]">
            {alarmData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alarmData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {alarmData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400 italic serif">
                No active alarms detected.
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {alarmData.map((d) => (
              <div key={d.name} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-zinc-500">{d.name}:</span>
                <span className="text-zinc-900 mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Communication Health Trend */}
        <div className="col-span-1 lg:col-span-4 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 italic serif text-zinc-500">Communication Health (30 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={commHealth}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[80, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="score" stroke="#2563eb" fillOpacity={1} fill="url(#colorHealth)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Leak Risk Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 italic serif">
              <Droplets className="h-4 w-4 text-blue-600" />
              Top Leak Risk
            </h3>
            <Link to="/analytics" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {topLeakRisk.map(m => (
              <div key={m.meter_id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div>
                  <div className="text-sm font-bold mono text-zinc-900">{m.meter_id}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{m.site}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full",
                        m.leak_risk_score > 70 ? 'bg-red-500' : m.leak_risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${m.leak_risk_score}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold mono w-8 text-right text-zinc-700">{Math.round(m.leak_risk_score)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Battery Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 italic serif">
              <Battery className="h-4 w-4 text-orange-600" />
              Low Battery
            </h3>
            <Link to="/meters?status=low_battery" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {lowBattery.map(m => (
              <div key={m.meter_id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div>
                  <div className="text-sm font-bold mono text-zinc-900">{m.meter_id}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{m.site}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-bold mono",
                    m.battery_level < 20 ? 'text-red-600' : 'text-zinc-700'
                  )}>
                    {Math.round(m.battery_level)}%
                  </span>
                  <Battery className={cn("h-3 w-3", m.battery_level < 20 ? 'text-red-600' : 'text-zinc-400')} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Reports */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 italic serif">
              <Clock className="h-4 w-4 text-red-600" />
              Missing Reports
            </h3>
            <Link to="/meters?status=missing" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {missingReports.length > 0 ? missingReports.map(m => (
              <div key={m.meter_id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div>
                  <div className="text-sm font-bold mono text-zinc-900">{m.meter_id}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{m.site}</div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                  Missing Today
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-zinc-400 text-xs italic serif">
                All meters reported successfully.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-8">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 italic serif text-zinc-500">Quick Operations</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <QuickActionCard 
            title="Command Center" 
            description="Issue remote commands to meters" 
            to="/commands" 
            icon={Activity}
          />
          <QuickActionCard 
            title="Alarm Queue" 
            description="Acknowledge and manage alerts" 
            to="/alarms" 
            icon={AlertTriangle}
          />
          <QuickActionCard 
            title="Daily Reports" 
            description="Download CSV of today's telemetry" 
            to="/reports" 
            icon={TrendingUp}
          />
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color, description, trend, trendLabel }: any) => (
  <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2.5 rounded-lg text-white", color)}>
        <Icon size={20} />
      </div>
      {trend !== undefined && (
        <div className={cn("text-xs font-bold mono", trend >= 0 ? "text-green-600" : "text-red-600")}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div className="text-3xl font-bold text-zinc-900 mono mb-1">{value}</div>
    <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">{title}</div>
    <div className="text-[10px] text-zinc-500 mt-2 italic serif">{trendLabel || description}</div>
  </div>
);

const QuickActionCard = ({ title, description, to, icon: Icon }: any) => (
  <Link to={to} className="group bg-white hover:bg-zinc-900 border border-zinc-200 hover:border-zinc-900 p-5 rounded-xl transition-all flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-5">
      <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-800 group-hover:text-white transition-colors">
        <Icon size={24} />
      </div>
      <div>
        <div className="font-bold text-zinc-900 group-hover:text-white transition-colors italic serif">{title}</div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors">{description}</div>
      </div>
    </div>
    <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
  </Link>
);
