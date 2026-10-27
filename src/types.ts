export interface Vendor {
  id: string;
  name: string;
  phone: string;
  target: number;
  achievement: number;
  remaining: number;
  bonus: number;
  region: string;
  manager: string;
  status: 'Active' | 'Inactive';
  lastMessageDate?: string;
  customNotes?: string;
  history?: CommunicationHistory[];
}

export interface CommunicationHistory {
  id: string;
  campaignId: string;
  campaignName: string;
  sentAt: string;
  status: 'Sent' | 'Failed' | 'Skipped' | 'Already Sent';
  message: string;
  errorReason?: string;
}

export type CampaignStatus = 'Pending Approval' | 'Draft' | 'Scheduled' | 'Running' | 'Completed' | 'Paused' | 'Cancelled' | 'Failed';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  schedule: 'Immediate' | 'Daily' | 'Weekly' | 'Monthly' | 'Specific Date' | 'Custom';
  scheduleDetails?: string;
  status: CampaignStatus;
  templateText: string;
  createdAt: string;
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
  excelFileName: string;
  vendorCount: number;
  stats: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    skipped: number;
    alreadySent: number; // Duplicate skips
  };
  vendors?: CampaignVendorProgress[];
}

export interface CampaignVendorProgress {
  vendorId: string;
  name: string;
  phone: string;
  status: 'Pending' | 'Sending' | 'Sent' | 'Failed' | 'Skipped' | 'Already Sent';
  generatedMessage: string;
  sentAt?: string;
  errorReason?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  registeredAt: string;
  status: 'Active' | 'Suspended';
  maxDailyMessages: number;
  dbProvider?: 'Supabase' | 'PostgreSQL' | 'Isolated Local Vault' | 'Custom Database API';
  dbUrl?: string;
  dbApiKey?: string;
  dbConnectedTables?: string[];
  dbConnectionStatus?: 'Connected' | 'Not Configured' | 'Syncing';
}

export interface UserAccount {
  id: string;
  name: string;
  emailOrUsername: string;
  password: string;
  role: 'Administrator' | 'Company Employee';
  companyId?: string;
  companyName?: string;
  autoApproveCampaigns: boolean;
  status: 'Active' | 'Locked';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: 'Administrator' | 'Company Employee' | 'Staff User';
  action: string;
  module: string;
  details: string;
}

export interface SystemSettings {
  defaultExcelFileName: string;
  defaultTemplate: string;
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string; // "18:00"
  campaignLimitsPerDay: number;
  messageDelaySeconds: number;
  orgName: string;
  orgWhatsAppNumber: string;
  gatewayEnabled?: boolean;
  gatewayType?: 'whatsapp-web' | 'custom-api';
  gatewayUrl?: string;
  gatewayMethod?: 'GET' | 'POST';
  gatewayHeaders?: string;
  gatewayBodyTemplate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}
