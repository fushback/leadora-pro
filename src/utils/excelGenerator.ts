import * as XLSX from 'xlsx';
import { LeadItem } from '../types';
import { calculateDataIntegrity } from './dataIntegrity';
import { isAuthenticPlatformProfileUrl } from './formatters';

/**
 * Robust cross-browser blob download trigger that works reliably in all browsers and sandboxed iframes.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.setAttribute('download', filename);
  a.setAttribute('target', '_blank');
  document.body.appendChild(a);

  // Trigger click
  a.click();

  // Clean up with delay so download starts before revoke
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
 * Builds and downloads a multi-sheet Excel (.xlsx) workbook strictly matching required columns:
 * 1. Business Name
 * 2. Address
 * 3. Location
 * 4. Category
 * 5. Tag (applied across Excel, VCF Note & Name)
 * 6. Google Map Location (clickable hyperlink)
 * 7. Contact Number (authentic number from Google Maps)
 * 8. Email
 * 9. WhatsApp No
 * 10. Website
 * 11. Note
 */
export function generateExcelWorkbook(leads: LeadItem[], filename = 'B2B_Leads_Database.xlsx'): void {
  if (!leads || leads.length === 0) {
    throw new Error('No leads available to export.');
  }

  const workbook = XLSX.utils.book_new();

  // Group leads by category
  const categoriesMap: Record<string, LeadItem[]> = {};

  leads.forEach((lead) => {
    const cat = lead.category?.trim() || 'General';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push(lead);
  });

  const categoryNames = Object.keys(categoriesMap);

  // 1. All Leads Master Sheet
  appendSheetForLeads(workbook, 'All Leads', leads);

  // 2. Separate Sheet for each category found
  categoryNames.forEach((catName) => {
    const sanitizedSheetName = catName
      .replace(/[\\/?*[\]:]/g, ' ')
      .trim()
      .slice(0, 31) || 'Sheet';

    if (sanitizedSheetName !== 'All Leads') {
      appendSheetForLeads(workbook, sanitizedSheetName, categoriesMap[catName]);
    }
  });

  // Write workbook as array buffer
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });

  triggerBlobDownload(blob, filename);
}

function appendSheetForLeads(workbook: XLSX.WorkBook, sheetName: string, items: LeadItem[]) {
  const headers = [
    'Place ID',
    'Business Name',
    'Category',
    'Source',
    'Data Integrity',
    'Address',
    'Location',
    'Tag',
    'Google Map Location',
    'Contact Number',
    'Email',
    'WhatsApp No',
    'Website',
    'LinkedIn',
    'Instagram',
    'Facebook',
    'X / Twitter',
    'YouTube',
    'IndiaMART',
    'TradeIndia',
    'Justdial',
    'Amazon Store',
    'Flipkart Store',
    'Meesho Store',
    'Note'
  ];

  const rows: any[][] = [headers];

  items.forEach((item) => {
    const hasPlaceId = Boolean(item.id && !item.id.startsWith('lead_') && !item.id.startsWith('imp_'));
    const mapUrl = item.googleMapLocation || (hasPlaceId 
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.businessName)}&query_place_id=${encodeURIComponent(item.id)}`
      : `https://maps.google.com/?q=${encodeURIComponent(item.businessName + ' ' + item.address)}`);
    const tag = item.tag || item.note || '';
    const isGeminiSearch = item.discoverySource === 'Gemini AI Search' || 
      item.discoverySource === 'Gemini AI' || 
      Boolean(item.id && item.id.startsWith('lead_')) ||
      (Boolean(item.enrichedByGemini) && item.specificSource !== 'Google Maps' && item.source !== 'Google Maps');

    const specific = item.specificSource || (
      item.source && !item.source.toLowerCase().includes('gemini')
        ? item.source
        : (isGeminiSearch ? 'Web Directory' : 'Google Maps')
    );
    const sourceLabel = specific;
    const integrity = calculateDataIntegrity(item);

    rows.push([
      item.id || '',
      item.businessName || '',
      item.category || '',
      sourceLabel,
      `${integrity.score}% (${integrity.label})`,
      item.address || '',
      item.location || '',
      tag,
      mapUrl,
      item.contactNumber || '',
      item.email || '',
      item.whatsappNo || '',
      item.website || '',
      isAuthenticPlatformProfileUrl('linkedin', item.socialProfiles?.linkedin) ? item.socialProfiles!.linkedin! : '',
      isAuthenticPlatformProfileUrl('instagram', item.socialProfiles?.instagram) ? item.socialProfiles!.instagram! : '',
      isAuthenticPlatformProfileUrl('facebook', item.socialProfiles?.facebook) ? item.socialProfiles!.facebook! : '',
      isAuthenticPlatformProfileUrl('twitter', item.socialProfiles?.twitter) ? item.socialProfiles!.twitter! : '',
      isAuthenticPlatformProfileUrl('youtube', item.socialProfiles?.youtube) ? item.socialProfiles!.youtube! : '',
      isAuthenticPlatformProfileUrl('indiamart', item.socialProfiles?.indiamart) ? item.socialProfiles!.indiamart! : '',
      isAuthenticPlatformProfileUrl('tradeindia', item.socialProfiles?.tradeindia) ? item.socialProfiles!.tradeindia! : '',
      isAuthenticPlatformProfileUrl('justdial', item.socialProfiles?.justdial) ? item.socialProfiles!.justdial! : '',
      isAuthenticPlatformProfileUrl('amazon', item.socialProfiles?.amazon) ? item.socialProfiles!.amazon! : '',
      isAuthenticPlatformProfileUrl('flipkart', item.socialProfiles?.flipkart) ? item.socialProfiles!.flipkart! : '',
      isAuthenticPlatformProfileUrl('meesho', item.socialProfiles?.meesho) ? item.socialProfiles!.meesho! : '',
      item.note || tag
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 32 }, // Place ID
    { wch: 32 }, // Business Name
    { wch: 22 }, // Category
    { wch: 16 }, // Source
    { wch: 18 }, // Data Integrity
    { wch: 42 }, // Address
    { wch: 24 }, // Location
    { wch: 22 }, // Tag
    { wch: 40 }, // Google Map Location
    { wch: 18 }, // Contact Number
    { wch: 26 }, // Email
    { wch: 18 }, // WhatsApp No
    { wch: 28 }, // Website
    { wch: 26 }, // LinkedIn
    { wch: 26 }, // Instagram
    { wch: 26 }, // Facebook
    { wch: 24 }, // Twitter
    { wch: 24 }, // YouTube
    { wch: 26 }, // IndiaMART
    { wch: 26 }, // TradeIndia
    { wch: 26 }, // Justdial
    { wch: 26 }, // Amazon
    { wch: 26 }, // Flipkart
    { wch: 26 }, // Meesho
    { wch: 24 }  // Note
  ];

  // Make Map links and websites clickable in Excel
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Y1');
  for (let R = 1; R <= range.e.r; ++R) {
    const mapCellAddr = XLSX.utils.encode_cell({ r: R, c: 8 }); // Column I (index 8) is Google Map Location
    const mapCell = worksheet[mapCellAddr];
    if (mapCell && mapCell.v && typeof mapCell.v === 'string' && mapCell.v.startsWith('http')) {
      mapCell.l = { Target: mapCell.v, Tooltip: 'View on Google Maps' };
    }

    const webCellAddr = XLSX.utils.encode_cell({ r: R, c: 12 }); // Column M (index 12) is Website
    const webCell = worksheet[webCellAddr];
    if (webCell && webCell.v && typeof webCell.v === 'string' && webCell.v.startsWith('http')) {
      webCell.l = { Target: webCell.v, Tooltip: 'Open Website' };
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

/**
 * Exports leads strictly into a RFC-compliant CSV with UTF-8 BOM, including Place ID as first column.
 */
export function exportLeadsToCsv(leads: LeadItem[], filename = 'B2B_Leads_Database.csv'): void {
  if (!leads || leads.length === 0) {
    throw new Error('No leads available to export.');
  }

  const headers = [
    'Place ID',
    'Business Name',
    'Category',
    'Source',
    'Data Integrity',
    'Address',
    'Location',
    'Tag',
    'Google Map Location',
    'Contact Number',
    'Email',
    'WhatsApp No',
    'Website',
    'LinkedIn',
    'Instagram',
    'Facebook',
    'X / Twitter',
    'YouTube',
    'IndiaMART',
    'TradeIndia',
    'Justdial',
    'Amazon Store',
    'Flipkart Store',
    'Meesho Store',
    'Note'
  ];

  const escapeCsv = (val: any) => {
    const str = val !== undefined && val !== null ? String(val) : '';
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeCsv).join(',')];

  leads.forEach((item) => {
    const hasPlaceId = Boolean(item.id && !item.id.startsWith('lead_') && !item.id.startsWith('imp_'));
    const mapUrl = item.googleMapLocation || (hasPlaceId 
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.businessName)}&query_place_id=${encodeURIComponent(item.id)}`
      : `https://maps.google.com/?q=${encodeURIComponent(item.businessName + ' ' + item.address)}`);
    const tag = item.tag || item.note || '';
    const specific = item.specificSource || item.source || 'Google Maps';
    const integrity = calculateDataIntegrity(item);

    const row = [
      item.id || '',
      item.businessName || '',
      item.category || '',
      specific,
      `${integrity.score}% (${integrity.label})`,
      item.address || '',
      item.location || '',
      tag,
      mapUrl,
      item.contactNumber || '',
      item.email || '',
      item.whatsappNo || '',
      item.website || '',
      item.socialProfiles?.linkedin || '',
      item.socialProfiles?.instagram || '',
      item.socialProfiles?.facebook || '',
      item.socialProfiles?.twitter || '',
      item.socialProfiles?.youtube || '',
      item.socialProfiles?.indiamart || '',
      item.socialProfiles?.tradeindia || '',
      item.socialProfiles?.justdial || '',
      item.socialProfiles?.amazon || '',
      item.socialProfiles?.flipkart || '',
      item.socialProfiles?.meesho || '',
      item.note || tag
    ];

    lines.push(row.map(escapeCsv).join(','));
  });

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}

/**
 * Exports leads into structured JSON array with Place IDs and full metadata.
 */
export function exportLeadsToJson(leads: LeadItem[], filename = 'B2B_Leads_Database.json'): void {
  if (!leads || leads.length === 0) {
    throw new Error('No leads available to export.');
  }
  const jsonStr = JSON.stringify(leads, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}
