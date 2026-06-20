// Base Type Exports for FabricViz AI

export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'brand_admin' | 'sales_rep' | 'showroom_user';
  name?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessCode {
  id: string;
  code: string;
  customerName?: string;
  companyName?: string;
  phone?: string;
  active: boolean;
  renderCount: number;
  creditLimit: number;
  creditsUsed: number;
  createdBy?: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface CustomerSession {
  id: string;
  accessCodeId: string;
  deviceFingerprint?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  groupId?: string;
  endUse: 'sofa' | 'curtain' | 'rug' | 'wallpaper' | 'both';
  qrCode?: string;
  qrUrl?: string;
  active: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FabricFeatureFlags {
  highMartindale?: boolean;
  fadeResistant?: boolean;
  waterRepellent?: boolean;
  stainRepellent?: boolean;
  antimicrobial?: boolean;
  premiumQuality?: boolean;
  [key: string]: boolean | undefined;
}

export interface Fabric {
  id: string;
  collectionId: string;
  name: string;
  code: string;
  swatchUrl?: string;
  textureUrl?: string;
  colorFamily?: string;
  quality?: string;
  tags?: string[];
  endUse: 'sofa' | 'curtain' | 'rug' | 'wallpaper' | 'both';
  repeatWidthMm?: number;
  repeatHeightMm?: number;
  fabricWidthCm?: number;
  priceInr?: number;
  featureFlags: FabricFeatureFlags;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredefinedRoom {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  endUse: 'sofa' | 'curtain' | 'rug' | 'wallpaper' | 'both';
  displayOrder: number;
  active: boolean;
  createdAt: Date;
}

export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'queued' | 'retrying';

export interface Visualization {
  id: string;
  accessCodeId?: string;
  fabricId?: string;
  roomId?: string;
  uploadedPhotoUrl?: string;
  objectType: 'sofa' | 'curtain' | 'rug' | 'wallpaper';
  sourceType: 'template' | 'predefined_room' | 'upload' | 'camera';
  beforeUrl?: string;
  afterUrl?: string;
  pdfUrl?: string;
  renderJobId?: string;
  status: RenderStatus;
  createdAt: Date;
}

export interface RenderJob {
  id: string;
  visualizationId?: string;
  queueJobId?: string;
  status: RenderStatus;
  attemptCount: number;
  errorMessage?: string;
  provider: string;
  promptUsed?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Request {
  id: string;
  type: 'access_code_request' | 'quote_request' | 'sample_request';
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  fabricId?: string;
  visualizationId?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  handledBy?: string;
  createdAt: Date;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  accessCodeId?: string;
  fabricId?: string;
  collectionId?: string;
  visualizationId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AppSettings {
  id: string;
  key: string;
  value?: string;
  updatedBy?: string;
  updatedAt: Date;
}

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
