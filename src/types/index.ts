export interface SocialProfiles {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  indiamart?: string;
  tradeindia?: string;
  justdial?: string;
  amazon?: string;
  flipkart?: string;
  meesho?: string;
}

export interface LeadItem {
  id: string;
  businessName: string;
  category: string;
  tag?: string; // Applied to Spreadsheet & VCF note and [Category] - [Tag]
  address: string;
  location: string; // Short location: Road/Street name, Area/Town/City, State/District
  googleMapLocation: string; // Hyperlink
  contactNumber: string;
  email: string;
  whatsappNo: string;
  pincode: string;
  website: string;
  socialProfiles: SocialProfiles;
  rating?: number;
  reviewsCount?: number;
  verified?: boolean;
  enrichedByGemini?: boolean;
  note: string; // [Tag] into note section
  scrapedAt: string;
  lat?: number;
  lng?: number;
  distanceKm?: number; // Exact calculated distance from search origin in km (always <= radiusKm)
  source?: string;
  specificSource?: string; // Exact directory or registry: e.g. Justdial, IndiaMART, MCA / ROC Registry, Google Maps, TradeIndia, Official Website
  discoverySource?: string;
}

export type SearchMode = 'manual' | 'proximity';

export interface SearchConfig {
  searchMode: SearchMode;
  manualLocation: string; // e.g. "Sevoke Road, Siliguri" or "MG Marg, Gangtok, Sikkim"
  country?: string;
  tag: string; // Field name "Tag" applied in Spreadsheet and VCF note & name
  lat?: number;
  lng?: number;
  radiusKm: number; // in kilometers
  category: string;
  categories: string[];
  options: {
    enrichEmails: boolean;
    enrichSocials: boolean;
    enrichIndiaMart: boolean;
    verifyWhatsApp: boolean;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  isCustom?: boolean;
}

export interface InterestItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isCustom?: boolean;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agent: 'Step 1: Scraper' | 'Step 2: Aggregator' | 'Step 3: VCF Generator';
  message: string;
  status: 'info' | 'success' | 'warning' | 'error' | 'in_progress';
  dataCount?: number;
}

export interface RoleRecord {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  permissions: string[];
}

export interface LinkedProvider {
  provider: 'google';
  providerId: string;
  email?: string;
  phoneNumber?: string;
  linkedAt: string;
  avatar?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  avatarUrl?: string;
  provider: 'google';
  providerId?: string;
  googleId?: string;
  providers?: LinkedProvider[];
  roleId?: string;
  roleName?: string;
  permissions?: string[];
  locale?: string;
  emailVerified?: boolean;
  company?: string;
  timezone?: string;
  createdAt: string;
  lastLogin: string;
  searchCount: number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

