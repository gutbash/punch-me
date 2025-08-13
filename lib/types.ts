export type LoyaltyCard = {
  id: string; // uuid
  establishmentId: string;
  name: string;
  goal: number; // punches required
  punches: number;
  rewardDescription?: string;
  walletPassUrl?: string; // optional link to a .pkpass file or enrollment page
  createdAt: string;
  updatedAt: string;
};

export type ScanResultAdd = {
  type: 'add';
  establishmentId: string;
  name: string;
  goal?: number;
  reward?: string;
  walletPassUrl?: string;
};

export type ScanResultPunch = {
  type: 'punch';
  establishmentId: string;
  token?: string; // optional token, not validated client-side in MVP
};

export type ParsedScan = ScanResultAdd | ScanResultPunch | { type: 'unknown'; raw: string };
