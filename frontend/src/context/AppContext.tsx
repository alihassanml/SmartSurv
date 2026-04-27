import React from 'react';
import type { Alert, PersonEvent, ClassThreshold } from '../types/dashboard';

export interface UrlCamera {
  id: number;
  name: string;
  url: string;
  active: boolean;
  visible: boolean;
  grid_position?: number;
}

export interface AppContextValue {
  alerts: Alert[];
  detectedPersons: PersonEvent[];
  setDetectedPersons: React.Dispatch<React.SetStateAction<PersonEvent[]>>;
  selectedPerson: PersonEvent | null;
  setSelectedPerson: (p: PersonEvent | null) => void;
  isConnected: boolean;
  cameraActive: boolean;
  isCameraToggling: boolean;
  toggleCamera: () => void;
  currentSource: '0' | 'remote' | 'hybrid';
  handleSourceChange: (src: '0' | 'remote' | 'hybrid') => void;
  activeFeeds: string[];
  watchlist: string[];
  urlCameras: UrlCamera[];
  fetchUrlCameras: () => void;
  toggleUrlCamera: (id: number) => void;
  toggleUrlCameraVisibility: (id: number) => void;
  localCameraVisible: boolean;
  toggleLocalCameraVisibility: () => void;
  fetchWatchlist: () => void;
  emailEnabled: boolean;
  toggleEmail: () => void;
  privacyMode: boolean;
  togglePrivacy: () => void;
  personLogEnabled: boolean;
  togglePersonLog: () => void;
  browserSoundEnabled: boolean;
  toggleBrowserSound: () => void;
  classThresholds: ClassThreshold[];
  thresholdsLoading: boolean;
  handleThresholdChange: (name: string, value: number) => void;
  handleSaveThresholds: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  handleSoundToggle: (name: string) => void;
  smtpEmail: string | null;
  systemIp: string | null;
  focusedPersonId: string | null;
  handleSetFocus: (pid: string | null) => void;
  focusedPersonVisible: boolean;
  semanticQuery: string;
  semanticResults: { id: string; score: number }[];
  semanticLoading: boolean;
  handleSemanticSearch: (val: string) => void;
  dataSettings: { display_days: number; retention_days: number };
  updateDataSettings: (display: number, retention: number) => Promise<void>;
  systemLatency: number | null;
  isReconnecting: boolean;
  username: string;
  userEmail: string;
  role: string;
  handleLogout: () => void;
  cameraMode: 'detection' | 'search' | 'both' | null;
  handleModeChange: (mode: 'detection' | 'search' | 'both') => Promise<void>;
  deleteAlerts: (ids: number[]) => Promise<void>;
}

export const AppContext = React.createContext<AppContextValue | null>(null);

export const useApp = () => {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppLayout');
  return ctx;
};
