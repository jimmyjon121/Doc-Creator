export interface Program {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  levelOfCare: string;
  format?: string;
  insuranceAlignment?: string;
  ageMin?: number;
  ageMax?: number;
  availability?: string;
  description?: string;
  tags?: string[];
  phone?: string;
  website?: string;
  address?: string;
  focus?: string;
}

export type ProgramId = Program['id'];

export interface LegacyProgram {
  id?: string;
  name?: string;
  focus?: string;
  format?: string;
  summary?: string;
  overview?: string;
  tags?: string[];
  description?: string;
  availabilityDays?: number;
  insurance?: string[] | string;
  population?: {
    ages?: string;
  };
  contacts?: {
    phone?: string;
    email?: string;
    website?: string;
    director?: string;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  levelOfCare?: string;
  formatLabel?: string;
  deliveryFormat?: string;
  address?: string;
  website?: string;
  phone?: string;
  defaultTrack?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    programsData?: unknown;
    eventBus?: {
      emit?: (eventName: string, payload?: unknown) => void;
    };
  }
}

export {};

