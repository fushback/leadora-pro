import { LeadItem } from '../types';

export interface DuplicateRecordDetail {
  duplicateLead: LeadItem;
  originalLead: LeadItem;
  matchField: 'placeId' | 'businessName' | 'phone';
  matchValue: string;
}

export interface ValidationAuditResult {
  totalChecked: number;
  uniqueCount: number;
  duplicateCount: number;
  duplicates: DuplicateRecordDetail[];
  cleanedLeads: LeadItem[];
}

/**
 * Normalizes phone numbers to their last 10 significant digits
 */
function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Normalizes business names for robust matching (lowercase, removes punctuation and common suffixes)
 */
function cleanBusinessName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Performs a comprehensive audit of leads across Google Place IDs, business names, and phone numbers.
 * Keeps the primary record (retaining richer details if available) and eliminates redundant duplicate records.
 */
export function auditAndDeduplicateLeads(leads: LeadItem[]): ValidationAuditResult {
  if (!leads || leads.length === 0) {
    return {
      totalChecked: 0,
      uniqueCount: 0,
      duplicateCount: 0,
      duplicates: [],
      cleanedLeads: []
    };
  }

  const seenIds = new Map<string, LeadItem>();
  const seenNames = new Map<string, LeadItem>();
  const seenPhones = new Map<string, LeadItem>();

  const cleanedLeads: LeadItem[] = [];
  const duplicates: DuplicateRecordDetail[] = [];

  for (const item of leads) {
    if (!item) continue;
    const id = (item.id || '').trim();
    const normName = cleanBusinessName(item.businessName);
    const cleanPhone = cleanPhoneNumber(item.contactNumber);

    let isDuplicate = false;
    let matchField: 'placeId' | 'businessName' | 'phone' = 'businessName';
    let matchValue = '';
    let matchedOriginal: LeadItem | null = null;

    // 1. Check Google Place ID (strongest identifier worldwide)
    if (id && seenIds.has(id)) {
      isDuplicate = true;
      matchField = 'placeId';
      matchValue = id;
      matchedOriginal = seenIds.get(id)!;
    }
    // 2. Check normalized business name
    else if (normName && seenNames.has(normName)) {
      isDuplicate = true;
      matchField = 'businessName';
      matchValue = item.businessName;
      matchedOriginal = seenNames.get(normName)!;
    }
    // 3. Check authentic phone number (>= 7 digits)
    else if (cleanPhone && cleanPhone.length >= 7 && seenPhones.has(cleanPhone)) {
      isDuplicate = true;
      matchField = 'phone';
      matchValue = item.contactNumber || cleanPhone;
      matchedOriginal = seenPhones.get(cleanPhone)!;
    }

    if (isDuplicate && matchedOriginal) {
      duplicates.push({
        duplicateLead: item,
        originalLead: matchedOriginal,
        matchField,
        matchValue
      });
      // Do not add the duplicate to cleanedLeads
    } else {
      if (id) seenIds.set(id, item);
      if (normName) seenNames.set(normName, item);
      if (cleanPhone && cleanPhone.length >= 7) seenPhones.set(cleanPhone, item);
      cleanedLeads.push(item);
    }
  }

  return {
    totalChecked: leads.length,
    uniqueCount: cleanedLeads.length,
    duplicateCount: duplicates.length,
    duplicates,
    cleanedLeads
  };
}
