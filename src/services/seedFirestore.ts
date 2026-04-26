import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { MeterStatus, Telemetry, Meter, AlarmSeverity, AlarmEntry } from "../types";
import { subDays, format } from "date-fns";

const SITES = ["Bole Sub-City", "Kirkos Sub-City", "Arada Sub-City", "Yeka Sub-City"];
const ZONES = ["Bole Atlas", "Kazanchis", "Piazza", "Megenagna"];

export async function seedFirestore() {
  const metersCol = collection(db, "meters");
  const snapshot = await getDocs(metersCol);
  
  if (!snapshot.empty) {
    console.log("Database already seeded");
    return;
  }

  const batch = writeBatch(db);
  const meterIds: string[] = [];

  // Create 20 meters
  for (let i = 1; i <= 20; i++) {
    const meterId = `MTR-${String(i).padStart(3, '0')}`;
    const status = i % 7 === 0 ? MeterStatus.ALARM : (i % 10 === 0 ? MeterStatus.MISSING : MeterStatus.ONLINE);
    
    const meter: Meter = {
      meter_id: meterId,
      serial_number: `SN-${Math.floor(Math.random() * 1000000)}`,
      site: SITES[Math.floor(Math.random() * SITES.length)],
      location: `Building ${Math.floor(Math.random() * 50)}`,
      zone: ZONES[Math.floor(Math.random() * ZONES.length)],
      gateway_id: `GW-${Math.floor(Math.random() * 5)}`,
      firmware_version: "v2.1.4",
      status: status,
      last_daily_update: new Date().toISOString(),
      battery_level: 60 + Math.random() * 40,
      leak_risk_score: Math.random() * 100,
    };

    batch.set(doc(db, "meters", meterId), meter);
    meterIds.push(meterId);
  }

  // Seed Telemetry (last 60 days for demo)
  const now = new Date();
  
  for (const meterId of meterIds) {
    for (let i = 0; i < 60; i++) {
      const date = subDays(now, i);
      const snapshotDate = format(date, "yyyy-MM-dd");
      const telemetryId = `${meterId}_${snapshotDate}`;
      
      // Some meters might miss reports
      if (Math.random() < 0.05 && i > 0) continue;

      const alarms: AlarmEntry[] = [];
      if (Math.random() < 0.1) {
        const severities = [AlarmSeverity.LOW, AlarmSeverity.MEDIUM, AlarmSeverity.HIGH, AlarmSeverity.CRITICAL];
        alarms.push({
          code: "ALM_001",
          severity: severities[Math.floor(Math.random() * severities.length)],
          timestamp: date.toISOString(),
          acknowledged: Math.random() > 0.5,
          message: "Potential leak detected or sensor anomaly"
        });
      }

      const telemetry: Telemetry = {
        meter_id: meterId,
        snapshot_date_utc: snapshotDate,
        timestamp_utc: date.toISOString(),
        flow_rate: Math.random() * 2,
        dtof: 120 + Math.random() * 5,
        abs_tof_ups: 1500 + Math.random() * 10,
        abs_tof_dns: 1500 + Math.random() * 10,
        alarms: alarms,
        quality_flags: Math.random() > 0.9 ? ["SIGNAL_WEAK"] : ["SIGNAL_OK"],
        battery: 100 - (i * 0.1) - (Math.random() * 0.5),
        total_volume: 1000 + (60 - i) * (15 + Math.random()),
        network_strength: -70 - Math.random() * 20,
        ingestion_status: "SUCCESS",
        raw_payload: { raw: "data" }
      };
      
      batch.set(doc(db, "telemetry", telemetryId), telemetry);
    }
  }

  await batch.commit();
  console.log("Firestore seeding complete");
}
