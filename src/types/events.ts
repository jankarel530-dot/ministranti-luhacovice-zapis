export type EventType = 'tabor' | 'vikendovka' | 'jednodenni' | 'ostatni';

export type EventStatus = 
  | 'napad' 
  | 'priprava' 
  | 'prihlasovani' 
  | 'pripraveno' 
  | 'probiha' 
  | 'dokonceno' 
  | 'archiv';

export type PaymentStatus = 'zaplaceno' | 'zaloha' | 'nezaplaceno';

export type LeaderRole = 
  | 'hlavni_vedouci' 
  | 'vedouci' 
  | 'zdravotnik' 
  | 'kuchar' 
  | 'praktikant' 
  | 'doprovod';

export type ArrivalStatus = 'neprirat' | 'pritomen' | 'odjel';

export interface EventParticipant {
  id: string;
  eventId: string;
  ministrantId?: string;
  name: string;
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  healthInfo?: string; // alergie, léky, omezení
  dietaryRestrictions?: string;
  swimmingAbility?: string;
  tshirtSize?: string;
  consents?: {
    photoConsent?: boolean;
    healthConsent?: boolean;
    departureConsent?: boolean;
  };
  paymentStatus: PaymentStatus;
  paymentAmount?: number;
  paidAmount?: number;
  teamId?: string;
  roomId?: string;
  registeredAt: string;
  arrivalStatus: ArrivalStatus;
  notes?: string;
  formResponseId?: string;
}

export interface EventTeam {
  id: string;
  eventId: string;
  name: string;
  color?: string;
  leaderName?: string;
  notes?: string;
}

export interface EventRoom {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  notes?: string;
}

export interface EventLeader {
  id: string;
  eventId: string;
  name: string;
  role: LeaderRole;
  phone?: string;
  email?: string;
  availability?: string;
  notes?: string;
}

export interface EventScheduleItem {
  id: string;
  eventId: string;
  dayDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  description?: string;
  responsibleLeader?: string;
  location?: string;
  materialsNeeded?: string;
}

export interface EventTask {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  assignedToLeader?: string;
  dueDate?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface EventDocument {
  id: string;
  eventId: string;
  title: string;
  type: 'souhlas_rodicu' | 'posudek_lekare' | 'potvrzeni_o_bezinfekcnosti' | 'prezencni_listina' | 'ostatni';
  fileUrl?: string;
  contentSnippet?: string;
  uploadedAt: string;
  participantId?: string;
}

export interface EventNotice {
  id: string;
  eventId: string;
  authorName: string;
  createdAt: string;
  content: string;
  isImportant?: boolean;
}

export interface EventEmailLog {
  id: string;
  eventId: string;
  sentAt: string;
  subject: string;
  recipientCount: number;
  body: string;
  sentBy: string;
}

export interface EventPhoto {
  id: string;
  eventId: string;
  url: string;
  caption?: string;
  authorName?: string;
  uploadedAt: string;
}

export interface CampEvent {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description?: string;
  capacity?: number;
  price?: number;
  deposit?: number;
  signupDeadline?: string;
  formId?: string; // Linked form for auto signup
  coverImage?: string;
  createdAt: string;
}

export interface EventsData {
  events: CampEvent[];
  participants: EventParticipant[];
  teams: EventTeam[];
  rooms: EventRoom[];
  leaders: EventLeader[];
  schedules: EventScheduleItem[];
  tasks: EventTask[];
  documents: EventDocument[];
  notices: EventNotice[];
  emailLogs: EventEmailLog[];
  photos: EventPhoto[];
}
