import { LeadItem } from '../types';

export interface IntegrityResult {
  score: number; // 0, 33, 67, 100
  itemsCount: number; // 0..3
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
  label: 'High' | 'Medium' | 'Low' | 'Incomplete';
  badgeClass: string;
}

/**
 * Calculates a Data Integrity score (0-100%) based on the completeness
 * of contact information (Phone, Email, Address).
 */
export function calculateDataIntegrity(lead: LeadItem): IntegrityResult {
  const hasPhone = Boolean(
    (lead.contactNumber && lead.contactNumber.trim() && lead.contactNumber.toLowerCase() !== 'not listed') ||
    (lead.whatsappNo && lead.whatsappNo.trim())
  );
  
  const hasEmail = Boolean(
    lead.email && 
    lead.email.trim() && 
    lead.email.includes('@') && 
    lead.email !== '—' &&
    lead.email.toLowerCase() !== 'not listed'
  );
  
  const hasAddress = Boolean(
    lead.address && 
    lead.address.trim() && 
    lead.address !== '—' && 
    lead.address.toLowerCase() !== 'not listed' &&
    lead.address.toLowerCase() !== 'n/a'
  );

  let count = 0;
  if (hasPhone) count++;
  if (hasEmail) count++;
  if (hasAddress) count++;

  const score = Math.round((count / 3) * 100);

  if (count === 3) {
    return {
      score,
      itemsCount: count,
      hasPhone,
      hasEmail,
      hasAddress,
      label: 'High',
      badgeClass: 'badge-g-green text-success'
    };
  } else if (count === 2) {
    return {
      score,
      itemsCount: count,
      hasPhone,
      hasEmail,
      hasAddress,
      label: 'Medium',
      badgeClass: 'badge-g-blue text-primary'
    };
  } else if (count === 1) {
    return {
      score,
      itemsCount: count,
      hasPhone,
      hasEmail,
      hasAddress,
      label: 'Low',
      badgeClass: 'badge-g-yellow'
    };
  } else {
    return {
      score,
      itemsCount: count,
      hasPhone,
      hasEmail,
      hasAddress,
      label: 'Incomplete',
      badgeClass: 'bg-light text-muted border'
    };
  }
}
