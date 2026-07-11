// Shared API types — mirror the backend contracts.

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'AT_HOSPITAL'
  | 'RESOLVED'
  | 'CANCELLED';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: 'USER' | 'RESPONDER' | 'HOSPITAL_STAFF' | 'ADMIN';
  isGuest: boolean;
  displayName: string | null;
}

export interface TriageInput {
  chiefComplaint: string;
  isConscious?: boolean;
  isBreathing?: boolean;
  hasBleeding?: boolean;
  patientAge?: number;
  symptoms?: string[];
  freeText?: string;
}

export interface TriageResult {
  severity: Severity;
  confidence: number;
  chiefComplaint: string;
  recommendedActions: string[];
  suggestedFacility?: string;
  disclaimer: string;
  provider: 'mock' | 'openai';
}

export interface Incident {
  id: string;
  status: IncidentStatus;
  severity: Severity | null;
  chiefComplaint: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  triageReport?: TriageResult & { confidence: number };
  createdAt: string;
}

export interface CreateIncidentInput {
  latitude?: number;
  longitude?: number;
  address?: string;
  triage: TriageInput;
}

// ── Admin / directory types ──

export type FacilityCapability =
  | 'EMERGENCY'
  | 'TRAUMA_CENTER'
  | 'CARDIAC'
  | 'STROKE'
  | 'BURN'
  | 'PEDIATRIC'
  | 'MATERNITY'
  | 'POISON_CONTROL';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  isOpen24h: boolean;
  hasEmergency: boolean;
  capabilities: FacilityCapability[];
  availableBeds: number | null;
}

export type AmbulanceStatus = 'AVAILABLE' | 'DISPATCHED' | 'EN_ROUTE' | 'BUSY' | 'OFFLINE';
export type AmbulanceType = 'BLS' | 'ALS';

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
  latitude: number;
  longitude: number;
}

export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: AuthUser['role'];
  isGuest: boolean;
  displayName: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  incidentsBySeverity: Record<Severity, number>;
  incidentsByStatus: Record<string, number>;
  ambulanceRequests: number;
  hospitalPrearrivals: number;
  prearrivalAckRate: number;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  count: number;
}
