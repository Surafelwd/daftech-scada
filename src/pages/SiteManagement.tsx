import React, { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, MapPin, Plus, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../services/api";
import { Meter, MeterStatus } from "../types";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// Fix Leaflet's default icon path issues with React/Vite
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

const getCustomIcon = (meter: Meter) => {
  let hasWater = meter.status === MeterStatus.ONLINE || meter.status === MeterStatus.MAINTENANCE;
  let hasAlarm = meter.status === MeterStatus.ALARM || meter.has_active_alarm;

  // Since our mock status is an enum, let's distribute ALARM state evenly to show both scenarios
  if (meter.status === MeterStatus.ALARM) {
    hasWater = meter.battery_level % 2 === 0;
  }

  // Determine exact colors based on user rules
  let ringClasses = "";

  if (hasWater && !hasAlarm) {
    // 1. Water + No Alarm = Pure Blue
    ringClasses = "border-blue-500 bg-blue-50";
  } else if (!hasWater && hasAlarm) {
    // 2. No Water + Warning (Alarm) = Pure Red
    ringClasses = "border-red-500 bg-red-100 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]";
  } else if (!hasWater && !hasAlarm) {
    // 3. No Water + No Alarm = Pure Gray (SOLID, NO TRANSPARENCY)
    ringClasses = "border-zinc-500 bg-zinc-200";
  } else if (hasWater && hasAlarm) {
    // 4. Water + Alarm = Blue with Red
    ringClasses = "border-blue-500 bg-red-100 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]";
  }

  return L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="relative w-10 h-10 drop-shadow-md flex items-center justify-center rounded-full p-1 border-[3px] ${ringClasses}">
             <img src="/LOGO.png" alt="meter" class="w-full h-full object-contain" />
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

type SiteCard = {
  id: string;
  name: string;
  region: string;
  zones: number;
  meters: number;
  status: "Healthy" | "Alarm" | "Maintenance";
  color: string;
};

export default function SiteManagement({ mapOnly = false, sitesOnly = false }: { mapOnly?: boolean, sitesOnly?: boolean }) {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const allMeters = await api.meters.list();
        setMeters(allMeters);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sites: SiteCard[] = useMemo(() => {
    const zoneToRegion: Record<string, string> = { A: "North", B: "South", C: "East", D: "West" };
    const bySite = new Map<string, Meter[]>();
    for (const meter of meters) {
      const arr = bySite.get(meter.site) ?? [];
      arr.push(meter);
      bySite.set(meter.site, arr);
    }

    const cards: SiteCard[] = [];
    for (const [siteName, ms] of bySite.entries()) {
      const zoneSet = new Set(ms.map((m) => m.zone));
      const metersCount = ms.length;

      const hasAlarm = ms.some((m) => m.status === MeterStatus.ALARM);
      const hasMaintenance = ms.some((m) => m.status === MeterStatus.MAINTENANCE);
      const status: SiteCard["status"] = hasAlarm ? "Alarm" : hasMaintenance ? "Maintenance" : "Healthy";
      const color = status === "Alarm" ? "bg-red-600" : status === "Maintenance" ? "bg-orange-600" : "bg-blue-600";

      // Pick the most common zone as the region.
      const zoneCounts = new Map<string, number>();
      for (const m of ms) zoneCounts.set(m.zone, (zoneCounts.get(m.zone) ?? 0) + 1);
      const topZone = [...zoneCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const region = topZone ? (zoneToRegion[topZone] ?? topZone) : "N/A";

      cards.push({
        id: siteName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
        name: siteName,
        region,
        zones: zoneSet.size,
        meters: metersCount,
        status,
        color,
      });
    }

    return cards.sort((a, b) => a.name.localeCompare(b.name));
  }, [meters]);

  return (
    <div className={cn(mapOnly ? "absolute inset-0 w-full h-full" : "space-y-8")}>
      {!mapOnly && (
      <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 italic serif">Site & Location Management</h1>
          <p className="text-zinc-500 text-sm">Organize assets by geography and network topology.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/20">
            <Plus className="h-4 w-4" />
            Add New Site
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full text-center text-zinc-400 italic serif py-12">Loading sites...</div>
        ) : sites.length === 0 ? (
          <div className="col-span-full text-center text-zinc-400 italic serif py-12">No sites found.</div>
        ) : sites.map((site) => (
          <div key={site.id} className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className={cn("p-3 rounded-xl text-white shadow-lg", site.color)}>
                <MapPin size={24} />
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                site.status === "Healthy" ? "bg-green-50 text-green-600 border-green-100" :
                site.status === "Alarm" ? "bg-red-50 text-red-600 border-red-100" :
                "bg-orange-50 text-orange-600 border-orange-100"
              )}>
                {site.status}
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2 italic serif">{site.name}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-6">{site.region} Region</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-zinc-50 rounded-lg text-center">
                <div className="text-lg font-bold text-zinc-900 mono">{site.zones}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Zones</div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg text-center">
                <div className="text-lg font-bold text-zinc-900 mono">{site.meters}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Meters</div>
              </div>
            </div>
            <button className="w-full mt-auto flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors group-hover:translate-x-1">
              <span>Manage Hierarchy</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      </>
      )}

      {!sitesOnly && (
      <div className={cn(mapOnly ? "w-full h-full" : "bg-white rounded-xl border border-zinc-200 p-8 shadow-sm")}>
        {!mapOnly && (
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest italic serif text-zinc-500">Network Topology Map</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Gateway
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Meter
            </div>
          </div>
        </div>
        )}
        <div className={cn("bg-zinc-100 relative overflow-hidden z-10", mapOnly ? "w-full h-full" : "rounded-xl border border-zinc-200 h-[500px]")}>
          <MapContainer 
            center={[9.03, 38.74]} 
            zoom={mapOnly ? 14 : 12} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            {/* Google Maps Hybrid Satellite View */}
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
            
            {/* Render markers for all meters */}
            {meters.map((meter, idx) => {
              // Creating some jitter around the center coord so pins aren't all stacked
              const lat = 9.03 + (Math.random() - 0.5) * 0.05;
              const lng = 38.74 + (Math.random() - 0.5) * 0.05;
              return (
                <Marker 
                  key={meter.id} 
                  position={[lat, lng]} 
                  icon={getCustomIcon(meter)}
                >
                  <Popup className="water-meter-popup">
                    <div className="font-bold italic serif border-b border-zinc-200 pb-2 mb-2">
                       Meter: {(meter as any).meter_id || meter.id || "Unknown"}
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-zinc-500">Location:</span>
                        <span className="font-medium text-zinc-900">{meter.site || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-zinc-500">Area:</span>
                        <span className="font-medium text-zinc-900">{meter.zone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-zinc-500">Battery Level:</span>
                        <span className="font-medium text-zinc-900">{meter.battery_level}%</span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-zinc-500">Firmware:</span>
                        <span className="font-medium text-zinc-900">{meter.firmware_version || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-zinc-500">Last Update:</span>
                        <span className="font-medium text-zinc-900">
                          {meter.last_daily_update ? new Date(meter.last_daily_update).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    <div className={cn(
                      "text-[10px] w-full block text-center font-bold px-2 py-1.5 rounded uppercase tracking-widest border mt-2",
                      (() => {
                        let hasWater = meter.status === MeterStatus.ONLINE || meter.status === MeterStatus.MAINTENANCE;
                        let hasAlarm = meter.status === MeterStatus.ALARM || meter.has_active_alarm;
                        if (meter.status === MeterStatus.ALARM) hasWater = meter.battery_level % 2 === 0;

                        if (hasWater && !hasAlarm) return "bg-blue-50 text-blue-700 border-blue-200";
                        if (!hasWater && hasAlarm) return "bg-red-50 text-red-700 border-red-200";
                        if (!hasWater && !hasAlarm) return "bg-zinc-100 text-zinc-500 border-zinc-300";
                        return "bg-blue-50 text-blue-700 border-blue-200"; // Water + Alarm (base is blue, alarm in next block)
                      })()
                    )}>
                      {(() => {
                        let hasWater = meter.status === MeterStatus.ONLINE || meter.status === MeterStatus.MAINTENANCE;
                        if (meter.status === MeterStatus.ALARM) hasWater = meter.battery_level % 2 === 0;
                        return hasWater ? "Water Available" : "No Water";
                      })()}
                    </div>

                    {((meter.status === MeterStatus.ALARM || meter.has_active_alarm) ? (
                      <div className="mt-2 text-[10px] w-full block text-center font-bold px-2 py-1.5 rounded uppercase tracking-widest border bg-red-50 text-red-600 border-red-200 animate-pulse">
                        ⚠️ Active Alarm Detected ⚠️
                      </div>
                    ) : null)}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
      )}
    </div>
  );
}
