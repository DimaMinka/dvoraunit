export interface TerminalMessage {
  id: string;
  sender: "user" | "command" | "system";
  text: string;
  timestamp: string;
}

export interface SubsystemInfo {
  name: string;
  status: "STABLE" | "MAINTENANCE" | "STANDBY" | "OFFLINE" | "SAFE";
  load: string;
  temp: string;
}

export interface RadarTarget {
  id: string;
  x: number; // distance from center, 0-1
  y: number; // distance from center, 0-1
  angle: number; // radians
  distance: number; // km
  label: string;
  speed: string;
  bearing: string;
  classification: "HOSTILE" | "FRIENDLY" | "UNKNOWN";
  detectedAt: string;
}

export interface SubUnitState {
  id: string;
  name: string;
  type: string;
  status: "ACTIVE" | "STANDBY" | "DEPLOYED" | "STAND_DOWN";
  strength: number;
  coordinates: string;
}
