import JSZip from 'jszip';
import { LeadItem } from '../types';
import { hasValidPhone, slugify } from './formatters';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.setAttribute('download', filename);
  a.setAttribute('target', '_blank');
  document.body.appendChild(a);

  a.click();

  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }
  }, 3000);
}

/**
 * Builds a single vCard (vCard 3.0 standard) string adhering strictly to the user specification:
 * - First Name: [Business Name]
 * - Middle Name: [Google Map short location: Road/Street name, Area/Town/City, State/District]
 * - Last Name: [Category or Nature of Business] - [Tag]
 * - Phone: [Public Number]
 * - Email: [Email Address]
 * - Address: [Full Google Map Address]
 * - Website: [Website URL or Social/IndiaMART link]
 * - Note: [Tag] into the note section of every generated contact.
 * - Tag: [Tag] into the note section and X-TAG of every generated contact.
 */
export function buildVCardString(lead: LeadItem, overrideTag?: string): string {
  const tag = (overrideTag !== undefined ? overrideTag : (lead.tag || lead.note || '')).trim();
  
  const firstName = escapeVCardValue(lead.businessName || 'Business');
  const middleName = escapeVCardValue(lead.location || '');
  const category = lead.category || 'General';
  const lastName = escapeVCardValue(tag ? `${category} - ${tag}` : category);

  const phone = (lead.contactNumber || '').trim();
  const email = (lead.email || '').trim();
  const address = escapeVCardValue(lead.address || '');
  const website = (lead.website || lead.googleMapLocation || '').trim();

  // FN: Display Name e.g. "Business Name Indiranagar Retail - Sitori and simplgood"
  const formattedName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};${middleName};;`,
    `FN:${formattedName}`,
    `ORG:${firstName}`,
    `TITLE:${category}`
  ];

  if (phone) {
    lines.push(`TEL;TYPE=CELL,VOICE,PREF:${phone}`);
  }

  if (lead.whatsappNo && lead.whatsappNo !== phone) {
    lines.push(`TEL;TYPE=X-WHATSAPP:${lead.whatsappNo}`);
  }

  if (email) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${email}`);
  }

  if (address) {
    lines.push(`ADR;TYPE=WORK:;;${address};;;;`);
    lines.push(`LABEL;TYPE=WORK:${address}`);
  }

  if (website) {
    lines.push(`URL;TYPE=WORK:${website}`);
  }

  // Note: [Tag] into the note section of every generated contact.
  if (tag) {
    lines.push(`NOTE:${escapeVCardValue(tag)}`);
    lines.push(`X-TAG:${escapeVCardValue(tag)}`);
    lines.push(`CATEGORIES:${escapeVCardValue(category)},${escapeVCardValue(tag)}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n') + '\r\n';
}

function escapeVCardValue(val: string): string {
  if (!val) return '';
  return val
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Step 3 Agent: Filters leads to those with valid phone numbers,
 * generates individual .vcf files, and packages them into a single ZIP file.
 */
export async function generateVcfZip(
  leads: LeadItem[],
  zipFilename = 'B2B_Contacts_VCF_Package.zip',
  overrideTag?: string
): Promise<{ total: number; valid: number; skipped: number }> {
  const validLeads = leads.filter((lead) => hasValidPhone(lead.contactNumber));

  if (validLeads.length === 0) {
    throw new Error('No contacts found with a valid phone number. Cannot generate VCF files.');
  }

  const zip = new JSZip();
  const folder = zip.folder('contacts') || zip;
  const usedNames = new Set<string>();

  validLeads.forEach((lead, index) => {
    const vcardContent = buildVCardString(lead, overrideTag);

    const bName = slugify(lead.businessName) || `contact_${index + 1}`;
    let finalFileName = `${bName}.vcf`;
    let counter = 1;
    while (usedNames.has(finalFileName)) {
      finalFileName = `${bName}_${counter++}.vcf`;
    }
    usedNames.add(finalFileName);

    folder.file(finalFileName, vcardContent);
  });

  // Also include a combined all-in-one .vcf inside the zip
  const combinedVcf = validLeads.map((l) => buildVCardString(l, overrideTag)).join('\r\n');
  zip.file('00_ALL_CONTACTS_IMPORT.vcf', combinedVcf);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerBlobDownload(blob, zipFilename);

  return {
    total: leads.length,
    valid: validLeads.length,
    skipped: leads.length - validLeads.length
  };
}

/**
 * Direct download of single combined .vcf file (great for 1-tap mobile phone import)
 */
export function downloadCombinedVcf(
  leads: LeadItem[], 
  filename = 'All_Leads_Contacts.vcf',
  overrideTag?: string
): number {
  const validLeads = leads.filter((lead) => hasValidPhone(lead.contactNumber));
  if (validLeads.length === 0) {
    throw new Error('No contacts have a valid phone number to export.');
  }

  const combined = validLeads.map((l) => buildVCardString(l, overrideTag)).join('\r\n');
  const blob = new Blob([combined], { type: 'text/vcard;charset=utf-8' });
  triggerBlobDownload(blob, filename);

  return validLeads.length;
}
