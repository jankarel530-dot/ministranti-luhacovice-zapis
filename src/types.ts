import { EventsData } from './types/events';

export type LiturgicalRank = 'slavnost' | 'svatek' | 'pamatka' | 'nedele' | 'vsedni';

export type LiturgicalColor = 'gold' | 'red' | 'purple' | 'green' | 'white' | 'blue';

export interface Ministrant {
  id: string;
  name: string;
  phone?: string;
  isActive: boolean;
  avatarColor?: string;
  note?: string;
}

export interface MassAssignment {
  serverId: string;
  signedUpAt: string; // ISO date string
  note?: string;
}

export interface Mass {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string; // e.g., 'Kostel Svaté Rodiny, Luhačovice'
  title: string; // e.g. 'Nedělní mše svatá', 'Slavnost Vzkříšení'
  rank: LiturgicalRank;
  liturgicalColor: LiturgicalColor;
  maxServers: number;
  assignments: MassAssignment[];
  isLocked: boolean;
  note?: string;
}

export interface LiturgicalFeast {
  date: string; // MM-DD or dynamic key
  name: string;
  rank: LiturgicalRank;
  color: LiturgicalColor;
  description?: string;
  isMovable?: boolean;
}

export interface SubAdminPin {
  id: string;
  label: string; // Např. "PIN pro o. Josefa"
  pin: string;   // 4-místný kód
  createdAt: string;
  permissions: AdminPermissions;
}

export interface AdminPermissions {
  canManageSchedule: boolean;      // Mše & ministranti
  canManageForms: boolean;         // Tvorba a úprava formulářů
  canViewFormSubmissions: boolean; // Odpovědi formulářů
  canViewAnalytics: boolean;       // Analytika a statistika
  canManageEvents: boolean;        // Akce a tábory
}

export type QuestionType =
  | 'text'
  | 'paragraph'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'html';

export interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  htmlContent?: string; // Vkládaný HTML kód, který se přečte a vloží přímo do rozhraní
  options?: string[];
  required?: boolean;
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string; // ISO date string
  respondentName?: string;
  answers: Record<string, string | string[]>;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  published: boolean;
  isClosed?: boolean;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  questions: FormQuestion[];
  allowMultipleSubmissions?: boolean;
}

export interface AppConfig {
  masterPin: string; // Hlavní kód (Master Admin)
  subAdminPins: SubAdminPin[]; // PINy a účty s pravomocemi
  parishName: string;
  globalLockSignups: boolean;
}

export interface AppData {
  masses: Mass[];
  ministrants: Ministrant[];
  forms?: Form[];
  formResponses?: FormResponse[];
  eventsData?: EventsData;
  config: AppConfig;
  version: number;
}

