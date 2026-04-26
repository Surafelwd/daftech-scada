export enum MeterStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  ALARM = "alarm",
  MAINTENANCE = "maintenance",
  MISSING = "missing", // Missing daily report
}

export enum AlarmSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum CommandStatus {
  QUEUED = "queued",
  SENT = "sent",
  ACK = "ack",
  NACK = "nack",
  TIMEOUT = "timeout",
  RETRY_EXHAUSTED = "retry_exhausted",
}

export interface Meter {
  meter_id: string;
  serial_number: string;
  site: string;
  location: string;
  zone: string;
  gateway_id: string;
  firmware_version: string;
  status: MeterStatus;
  last_daily_update?: string; // ISO date
  battery_level: number;
  leak_risk_score: number;

  // Derived flags (from latest telemetry). Optional so callers don't have to set them.
  has_active_alarm?: boolean;
  active_alarm_count?: number;
}

export interface Telemetry {
  meter_id: string;
  snapshot_date_utc: string; // YYYY-MM-DD
  timestamp_utc: string; // ISO
  flow_rate?: number;
  dtof?: number;
  abs_tof_ups?: number;
  abs_tof_dns?: number;
  alarms: AlarmEntry[];
  quality_flags: string[];
  battery?: number;
  total_volume?: number;
  network_strength?: number;
  ingestion_status: string;
  raw_payload: any;
}

export interface AlarmEntry {
  code: string;
  severity: AlarmSeverity;
  timestamp: string;
  acknowledged: boolean;
  message: string;
}

export interface Command {
  command_id: string;
  meter_id: string;
  command_type: string;
  command_payload: any;
  status: CommandStatus;
  ack_code?: string;
  nack_reason?: string;
  retries: number;
  created_at_utc: string;
  sent_at_utc?: string;
  responded_at_utc?: string;
  created_by_user: string;
  operator_comments?: string;
}

export interface AuditLog {
  actor: string;
  action: string;
  meter_id?: string;
  command_id?: string;
  before_json?: any;
  after_json?: any;
  timestamp_utc: string;
}

export interface AnalyticsSummary {
  total_meters: number;
  reported_today: number;
  missing_today: number;
  alarms_by_severity: Record<AlarmSeverity, number>;
  comm_health_score: number;
  last_ingestion_time: string;
}
