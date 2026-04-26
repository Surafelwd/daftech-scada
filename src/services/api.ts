import {
  AlarmEntry,
  AlarmSeverity,
  AnalyticsSummary,
  Command,
  CommandStatus,
  Meter,
  MeterStatus,
  Telemetry,
} from "../types";

function isoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededNumber(rand: () => number, min: number, max: number, decimals = 0): number {
  const value = min + (max - min) * rand();
  const p = Math.pow(10, decimals);
  return Math.round(value * p) / p;
}

const SITES = [
  "Bole Sub-City",
  "Arada Sub-City",
  "Yeka Sub-City",
  "Kirkos Sub-City",
  "Kolfe Keranio",
];

const ZONES = ["Bole Atlas", "Piazza", "Megenagna", "Kazanchis", "Jemo"] as const;

function buildMeters(count = 24): Meter[] {
  const meters: Meter[] = [];
  const rand = mulberry32(42);

  for (let i = 1; i <= count; i++) {
    const meter_id = `MTR-${String(i).padStart(3, "0")}`;
    const site = SITES[(i - 1) % SITES.length];
    const zone = ZONES[(i - 1) % ZONES.length];

    const statusRoll = rand();
    const status: MeterStatus =
      statusRoll < 0.72
        ? MeterStatus.ONLINE
        : statusRoll < 0.84
          ? MeterStatus.OFFLINE
          : statusRoll < 0.94
            ? MeterStatus.ALARM
            : MeterStatus.MISSING;

    const battery_level = clamp(Math.round(seededNumber(rand, 8, 100, 0)), 1, 100);
    const leak_risk_score = clamp(Math.round(seededNumber(rand, 5, 95, 0)), 0, 100);

    // Some meters report today; some are stale to drive dashboard KPIs.
    const lastUpdateOffsetDays = status === MeterStatus.MISSING ? 2 + Math.floor(seededNumber(rand, 0, 3)) : 0;
    const last_daily_update = new Date(Date.now() - lastUpdateOffsetDays * 24 * 60 * 60 * 1000).toISOString();

    meters.push({
      meter_id,
      serial_number: `SN${new Date().getUTCFullYear()}-${String(2300 + i)}-${zone}`,
      site,
      location: `Zone ${zone} - ${i % 2 === 0 ? "Output" : "Intake"}`,
      zone,
      gateway_id: `GW-${zone}-${String(((i - 1) % 6) + 1).padStart(2, "0")}`,
      firmware_version: i % 3 === 0 ? "1.4.1" : i % 3 === 1 ? "1.4.2" : "1.4.3",
      status,
      last_daily_update,
      battery_level,
      leak_risk_score,
    });
  }

  return meters;
}

function buildAlarm(
  code: string,
  severity: AlarmSeverity,
  timestamp_utc: string,
  message: string,
  acknowledged = false
): AlarmEntry {
  return {
    code,
    severity,
    timestamp: timestamp_utc,
    acknowledged,
    message,
  };
}

function buildTelemetryForMeter(meter: Meter, days = 30): Telemetry[] {
  const seed = parseInt(meter.meter_id.replace(/\D/g, ""), 10) || 1;
  const rand = mulberry32(seed * 1000 + 7);

  const history: Telemetry[] = [];

  // Baselines
  const baseFlow = seededNumber(rand, 10, 220, 1);
  const baseTof = seededNumber(rand, 120.0, 155.0, 2);
  let cumulativeVolume = seededNumber(rand, 10_000, 90_000, 1);

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - d);

    const timestamp_utc = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        9 + Math.floor(seededNumber(rand, 0, 6)),
        Math.floor(seededNumber(rand, 0, 59)),
        Math.floor(seededNumber(rand, 0, 59))
      )
    ).toISOString();

    const isOfflineLike = meter.status === MeterStatus.OFFLINE || meter.status === MeterStatus.MISSING;

    const drift = seededNumber(rand, -0.8, 1.4, 2);
    const abs_tof_ups = baseTof + drift + seededNumber(rand, -0.25, 0.25, 2);
    const abs_tof_dns = baseTof - drift + seededNumber(rand, -0.25, 0.25, 2);
    const dtof = Math.abs(abs_tof_ups - abs_tof_dns);

    // Flow drops when offline/missing to simulate comm gaps.
    const flow_rate = isOfflineLike ? 0 : clamp(baseFlow + seededNumber(rand, -18, 28, 1), 0, 9999);

    // Volume accumulates daily; if flow is zero, it barely changes.
    cumulativeVolume += flow_rate > 0 ? seededNumber(rand, 20, 140, 1) : seededNumber(rand, 0, 3, 1);

    const network_strength = Math.round(seededNumber(rand, -92, -55, 0));
    const battery = clamp(Math.round(meter.battery_level + seededNumber(rand, -2, 1, 0)), 1, 100);

    const quality_flags: string[] = [];
    const alarms: AlarmEntry[] = [];

    // Generate alarms in a SCADA-ish way
    const alarmRoll = rand();

    if (meter.status === MeterStatus.ALARM && d <= 3) {
      alarms.push(
        buildAlarm(
          "ABNORMAL_CONSUMPTION",
          AlarmSeverity.HIGH,
          timestamp_utc,
          "Consumption deviates from baseline beyond threshold.",
          false
        )
      );
      quality_flags.push("CAUTION");
    }

    if (!isOfflineLike && battery < 20 && alarmRoll < 0.6) {
      alarms.push(
        buildAlarm(
          "LOW_BATTERY",
          AlarmSeverity.MEDIUM,
          timestamp_utc,
          "Battery level below 20%.",
          false
        )
      );
      quality_flags.push("CAUTION");
    }

    if (!isOfflineLike && dtof > 2.0 && alarmRoll < 0.25) {
      alarms.push(
        buildAlarm(
          "SENSOR_DRIFT",
          AlarmSeverity.LOW,
          timestamp_utc,
          "TOF divergence indicates possible transducer drift/fouling.",
          false
        )
      );
      quality_flags.push("DRIFT");
    }

    if (isOfflineLike && alarmRoll < 0.4) {
      alarms.push(
        buildAlarm(
          "COMMUNICATION_LOSS",
          AlarmSeverity.HIGH,
          timestamp_utc,
          "Telemetry not received within expected window.",
          false
        )
      );
      quality_flags.push("STALE");
    }

    history.push({
      meter_id: meter.meter_id,
      snapshot_date_utc: isoDateUTC(new Date(timestamp_utc)),
      timestamp_utc,
      flow_rate,
      dtof,
      abs_tof_ups,
      abs_tof_dns,
      alarms,
      quality_flags,
      battery,
      total_volume: Math.round(cumulativeVolume * 10) / 10,
      network_strength,
      ingestion_status: isOfflineLike ? "missing" : "validated",
      raw_payload: {
        gateway_id: meter.gateway_id,
        firmware_version: meter.firmware_version,
        zone: meter.zone,
      },
    });
  }

  return history;
}

const mockMeters: Meter[] = buildMeters(200);
const telemetryHistoryByMeter: Map<string, Telemetry[]> = new Map(
  mockMeters.map((m) => [m.meter_id, buildTelemetryForMeter(m, 35)])
);

let mockCommands: Command[] = [];

function latestTelemetry(meter_id: string): Telemetry | null {
  const history = telemetryHistoryByMeter.get(meter_id) ?? [];
  return history.length ? history[history.length - 1] : null;
}

function activeAlarmCount(meter_id: string): number {
  const latest = latestTelemetry(meter_id);
  if (!latest) return 0;
  return latest.alarms.filter((a) => !a.acknowledged).length;
}

function withDerivedAlarmFields(meter: Meter): Meter {
  const count = activeAlarmCount(meter.meter_id);
  return { ...meter, has_active_alarm: count > 0, active_alarm_count: count };
}

function countAlarmSeverities(): Record<AlarmSeverity, number> {
  const counts: Record<AlarmSeverity, number> = {
    [AlarmSeverity.CRITICAL]: 0,
    [AlarmSeverity.HIGH]: 0,
    [AlarmSeverity.MEDIUM]: 0,
    [AlarmSeverity.LOW]: 0,
  };

  for (const meter of mockMeters) {
    const latest = latestTelemetry(meter.meter_id);
    if (!latest) continue;
    for (const alarm of latest.alarms) {
      if (!alarm.acknowledged) counts[alarm.severity]++;
    }
  }

  return counts;
}

function computeCommHealthScore(): number {
  const total = mockMeters.length;
  const bad = mockMeters.filter((m) => m.status === MeterStatus.OFFLINE || m.status === MeterStatus.MISSING).length;
  const score = total === 0 ? 0 : Math.round(100 * (1 - bad / total));
  return clamp(score, 0, 100);
}

export const api = {
  meters: {
    list: async (): Promise<Meter[]> => {
      return mockMeters.map((m) => withDerivedAlarmFields(m));
    },
    get: async (id: string): Promise<Meter> => {
      const meter = mockMeters.find((m) => m.meter_id === id);
      if (!meter) throw new Error("Meter not found");
      return withDerivedAlarmFields(meter);
    },
    patch: async (id: string, data: Partial<Meter>): Promise<void> => {
      const index = mockMeters.findIndex((m) => m.meter_id === id);
      if (index === -1) return;
      mockMeters[index] = { ...mockMeters[index], ...data };
    },
  },

  telemetry: {
    latest: async (id: string): Promise<Telemetry> => {
      const tel = latestTelemetry(id);
      if (!tel) throw new Error("No telemetry found");
      return { ...tel };
    },
    history: async (id: string, days: number = 30): Promise<Telemetry[]> => {
      const history = telemetryHistoryByMeter.get(id) ?? [];
      return history.slice(-days).map((t) => ({ ...t }));
    },
  },

  commands: {
    send: async (id: string, type: string, payload: any, userId: string): Promise<void> => {
      const now = new Date().toISOString();
      const command_id = `CMD-${Date.now()}`;

      // Simulate immediate transmit + ACK/NACK.
      const seed = Date.now() % 1000;
      const rand = mulberry32(seed);
      const willAck = rand() < 0.82;

      const sentAt = new Date(Date.now() + 500).toISOString();
      const respondedAt = new Date(Date.now() + 1500).toISOString();

      const command: Command = {
        command_id,
        meter_id: id,
        command_type: type,
        command_payload: payload,
        status: willAck ? CommandStatus.ACK : CommandStatus.NACK,
        ack_code: willAck ? "ACK_OK" : undefined,
        nack_reason: willAck ? undefined : "DEVICE_BUSY_OR_OFFLINE",
        retries: 0,
        created_at_utc: now,
        sent_at_utc: sentAt,
        responded_at_utc: respondedAt,
        created_by_user: userId,
      };

      mockCommands = [command, ...mockCommands].slice(0, 200);
    },

    list: async (id: string): Promise<Command[]> => {
      return mockCommands.filter((c) => c.meter_id === id);
    },
  },

  analytics: {
    summary: async (): Promise<AnalyticsSummary> => {
      const today = isoDateUTC(new Date());

      const reported_today = mockMeters.filter((m) => (m.last_daily_update ?? "").startsWith(today)).length;
      const total_meters = mockMeters.length;
      const missing_today = Math.max(0, total_meters - reported_today);

      const alarms_by_severity = countAlarmSeverities();

      const lastIngestion = mockMeters
        .map((m) => latestTelemetry(m.meter_id)?.timestamp_utc)
        .filter(Boolean)
        .sort()
        .at(-1);

      return {
        total_meters,
        reported_today,
        missing_today,
        alarms_by_severity,
        comm_health_score: computeCommHealthScore(),
        last_ingestion_time: lastIngestion ?? new Date().toISOString(),
      };
    },

    commHealth: async (days: number = 30): Promise<{ date: string; score: number }[]> => {
      const today = new Date();
      const total = mockMeters.length || 1;
      const points: { date: string; score: number }[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        date.setUTCDate(date.getUTCDate() - i);
        const dateStr = isoDateUTC(date);

        let validated = 0;
        for (const meter of mockMeters) {
          const history = telemetryHistoryByMeter.get(meter.meter_id) ?? [];
          const dayEntry = history.find((t) => t.snapshot_date_utc === dateStr);
          if (dayEntry?.ingestion_status === "validated") validated += 1;
        }

        const score = clamp(Math.round((validated / total) * 100), 0, 100);
        points.push({ date: dateStr.slice(5), score }); // MM-DD for compact axis
      }

      return points;
    },

    dailyConsumptionTrend: async (days: number = 7): Promise<{ date: string; current: number; baseline: number }[]> => {
      const today = new Date();
      const points: { date: string; current: number; baseline: number }[] = [];

      // Estimate daily consumption as sum of per-meter volume deltas.
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        date.setUTCDate(date.getUTCDate() - i);
        const dateStr = isoDateUTC(date);
        const prevDate = new Date(date);
        prevDate.setUTCDate(prevDate.getUTCDate() - 1);
        const prevDateStr = isoDateUTC(prevDate);

        let current = 0;
        for (const meter of mockMeters) {
          const history = telemetryHistoryByMeter.get(meter.meter_id) ?? [];
          const t = history.find((x) => x.snapshot_date_utc === dateStr);
          const p = history.find((x) => x.snapshot_date_utc === prevDateStr);
          const delta = (t?.total_volume ?? 0) - (p?.total_volume ?? 0);
          if (Number.isFinite(delta) && delta > 0) current += delta;
        }

        current = Math.round(current);
        // Baseline: smoothed reference around current.
        const jitter = 0.92 + (mulberry32(Number(dateStr.replaceAll("-", "")))() * 0.12);
        const baseline = Math.round(current * jitter);

        points.push({ date: dateStr.slice(5), current, baseline });
      }

      return points;
    },

    batteryForecast: async (): Promise<{ name: string; value: number; color: string }[]> => {
      const latestBatteries = mockMeters
        .map((m) => latestTelemetry(m.meter_id)?.battery ?? m.battery_level)
        .filter((b) => typeof b === "number" && Number.isFinite(b));

      const replacementNeeded = latestBatteries.filter((b) => b < 10).length;
      const low = latestBatteries.filter((b) => b >= 10 && b <= 30).length;
      const healthy = latestBatteries.filter((b) => b > 30).length;

      return [
        { name: "Replacement Needed (<10%)", value: replacementNeeded, color: "#ef4444" },
        { name: "Low (10-30%)", value: low, color: "#f97316" },
        { name: "Healthy (>30%)", value: healthy, color: "#22c55e" },
      ].filter((x) => x.value > 0);
    },

    tofDrift: async (days: number = 30): Promise<{ date: string; ups: number; dns: number }[]> => {
      const today = new Date();
      const points: { date: string; ups: number; dns: number }[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        date.setUTCDate(date.getUTCDate() - i);
        const dateStr = isoDateUTC(date);

        let upsSum = 0;
        let dnsSum = 0;
        let n = 0;
        for (const meter of mockMeters) {
          const history = telemetryHistoryByMeter.get(meter.meter_id) ?? [];
          const t = history.find((x) => x.snapshot_date_utc === dateStr);
          if (!t) continue;
          if (typeof t.abs_tof_ups !== "number" || typeof t.abs_tof_dns !== "number") continue;
          upsSum += t.abs_tof_ups;
          dnsSum += t.abs_tof_dns;
          n += 1;
        }

        const ups = n ? Math.round((upsSum / n) * 100) / 100 : 0;
        const dns = n ? Math.round((dnsSum / n) * 100) / 100 : 0;
        points.push({ date: dateStr.slice(5), ups, dns });
      }

      return points;
    },

    siteComparison: async (): Promise<{ name: string; value: number }[]> => {
      const bySite = new Map<string, number>();
      for (const meter of mockMeters) {
        const latest = latestTelemetry(meter.meter_id);
        const add = latest?.total_volume ?? 0;
        bySite.set(meter.site, (bySite.get(meter.site) ?? 0) + add);
      }

      return [...bySite.entries()]
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value);
    },

    zoneHealth: async (): Promise<{ name: string; value: number }[]> => {
      const zones = new Map<string, { total: number; good: number }>();
      for (const meter of mockMeters) {
        const z = meter.zone;
        const bucket = zones.get(z) ?? { total: 0, good: 0 };
        bucket.total += 1;
        const status = meter.status;
        if (status === MeterStatus.ONLINE || status === MeterStatus.MAINTENANCE || status === MeterStatus.ALARM) {
          bucket.good += 1;
        }
        zones.set(z, bucket);
      }

      return [...zones.entries()]
        .map(([name, bucket]) => ({ name, value: bucket.total ? Math.round((bucket.good / bucket.total) * 100) : 0 }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    consumption: async (): Promise<{ date: string; consumption: number }[]> => {
      // Kept as-is for the current Analytics view mock chart.
      return [
        { date: "2026-03-25", consumption: 120 },
        { date: "2026-03-26", consumption: 145 },
        { date: "2026-03-27", consumption: 110 },
        { date: "2026-03-28", consumption: 130 },
        { date: "2026-03-29", consumption: 150 },
      ];
    },
  },
};
