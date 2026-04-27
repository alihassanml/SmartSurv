export interface Detection {
  label: string;
  confidence: number;
  box: number[];
}

export interface Alert {
  id: number;
  timestamp: string;
  backend_ts?: number;
  detections: Detection[];
  image: string;
  is_person_search_match?: boolean | string;
  location?: { id: string; lat: string; lon: string; maps: string };
}

export interface PersonEvent {
  person_id: string;
  feed_id: string;
  face: string;
  timestamp: string;
  backend_ts?: number;
  status: 'NEW' | 'REAPPEARED';
  is_focused?: boolean;
  traits?: string;
}

export interface ClassThreshold {
  name: string;
  threshold: number;
  sound_enabled: boolean;
}

export const API = `http://${window.location.hostname}:8000`;
