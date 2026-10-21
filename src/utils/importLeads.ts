import * as XLSX from 'xlsx';
import { LeadItem, SocialProfiles } from '../types';

export interface ImportSummary {
  fileName: string;
  fileSize: number;
  totalRows: number;
  validLeads: LeadItem[];
  detectedCategories: string[];
  detectedLocation?: string;
  hasPlaceIdsCount: number;
  duplicateCount: number;
}

/**
 * Normalizes header keys to lowercase alphanumeric for robust matching
 */
function cleanKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Simple deterministic hash generator for leads missing explicit Place IDs
 */
function generateDeterministicId(name: string, location: string, address: string): string {
  const seed = `${name.toLowerCase().trim()}|${location.toLowerCase().trim()}|${address.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash).toString(36);
  return `imp_${positive}`;
}

/**
 * Extracts Place ID if embedded in a Google Maps URL (query_place_id, place_id, ChIJ, cid, etc.)
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  if (!url) return null;

  // 1. query_place_id or place_id query parameter
  const placeIdParam = url.match(/[?&](?:query_place_id|place_id)=([A-Za-z0-9_-]+)/i);
  if (placeIdParam && placeIdParam[1]) {
    return placeIdParam[1];
  }

  // 2. place_id:ChIJ... in search query
  const placeIdColon = url.match(/place_id:([A-Za-z0-9_-]+)/i);
  if (placeIdColon && placeIdColon[1]) {
    return placeIdColon[1];
  }

  // 3. Standard Google Maps ChIJ Place ID anywhere in URL
  const chijMatch = url.match(/(ChIJ[A-Za-z0-9_-]{16,})/);
  if (chijMatch && chijMatch[1]) {
    return chijMatch[1];
  }

  // 4. Hex feature ID in data=!1s0x...:0x...
  const hexMatch = url.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (hexMatch && hexMatch[1]) {
    return hexMatch[1];
  }

  // 5. cid= or /place/ path identifier
  const cidOrPlace = url.match(/(?:[?&]cid=|\/place\/)([A-Za-z0-9_-]{8,})/i);
  if (cidOrPlace && cidOrPlace[1]) {
    return cidOrPlace[1];
  }

  return null;
}

/**
 * Parses any uploaded spreadsheet (.xlsx, .xls, .csv) or JSON file into validated LeadItem[]
 */
export async function parseLeadsFromFile(file: File): Promise<ImportSummary> {
  const isJson = file.name.endsWith('.json');

  if (isJson) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rawList: any[] = Array.isArray(parsed) ? parsed : (parsed.leads || parsed.data || []);
    return processRawRows(rawList, file.name, file.size);
  }

  // Read binary workbook for .xlsx, .xls, or .csv
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Prioritize "All Leads" sheet if exported from this app, otherwise pick first non-empty sheet
  let targetSheetName = workbook.SheetNames[0];
  if (workbook.SheetNames.includes('All Leads')) {
    targetSheetName = 'All Leads';
  } else {
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      if (sheet && sheet['!ref']) {
        targetSheetName = name;
        break;
      }
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    throw new Error('No valid sheet found in the uploaded file.');
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return processRawRows(rawRows, file.name, file.size);
}

function processRawRows(rows: any[], fileName: string, fileSize: number): ImportSummary {
  if (!rows || rows.length === 0) {
    throw new Error('The uploaded file contains no data rows.');
  }

  const validLeads: LeadItem[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenPhones = new Set<string>();
  const categoriesSet = new Set<string>();
  const locationsCount: Record<string, number> = {};
  let hasPlaceIdsCount = 0;
  let duplicateCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (!row || typeof row !== 'object') continue;

    // Build a normalized lookup map of row keys
    const lookup: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      lookup[cleanKey(k)] = v !== undefined && v !== null ? String(v).trim() : '';
    }

    const findVal = (...aliases: string[]): string => {
      for (const alias of aliases) {
        const cleaned = cleanKey(alias);
        if (lookup[cleaned] !== undefined && lookup[cleaned] !== '') {
          return lookup[cleaned];
        }
      }
      return '';
    };

    // Business Name (required)
    const businessName = findVal(
      'Business Name', 'Name', 'Company', 'Business', 'Title', 'Store Name', 'Establishment', 'Firm'
    );
    if (!businessName) continue; // Skip empty row

    const normName = businessName.toLowerCase().trim();
    if (seenNames.has(normName)) {
      duplicateCount++;
      continue;
    }

    // Contact Number (Optional but used for deduplication)
    const contactNumber = findVal('Contact Number', 'Phone', 'Mobile', 'Phone Number', 'Telephone', 'Contact');
    const cleanPhone = contactNumber ? contactNumber.replace(/\D/g, '').slice(-10) : '';
    if (cleanPhone && cleanPhone.length >= 7 && seenPhones.has(cleanPhone)) {
      duplicateCount++;
      continue;
    }

    // Place ID extraction (Primary identifier for zero-duplicate re-searching)
    let id = findVal(
      'Place ID', 'Place ID / Unique ID', 'Google Place ID', 'ID', 'PlaceId', 'Place_Id', 'Lead ID', 'CID'
    );

    const mapLocation = findVal('Google Map Location', 'Map URL', 'Google Maps', 'Map', 'Maps URL');
    if (!id && mapLocation) {
      const extracted = extractPlaceIdFromUrl(mapLocation);
      if (extracted) id = extracted;
    }

    if (id && id.trim()) {
      id = id.trim();
      hasPlaceIdsCount++;
    } else {
      // Deterministic fallback ID
      const locationForId = findVal('Location', 'City', 'Area');
      const addressForId = findVal('Address', 'Full Address', 'Street');
      id = generateDeterministicId(businessName, locationForId, addressForId);
    }

    if (seenIds.has(id)) {
      duplicateCount++;
      continue;
    }

    seenIds.add(id);
    seenNames.add(normName);
    if (cleanPhone && cleanPhone.length >= 7) {
      seenPhones.add(cleanPhone);
    }

    // Category
    const category = findVal('Category', 'Sector', 'Industry', 'Type', 'Commercial Category') || 'Commercial';
    categoriesSet.add(category);

    // Address & Location
    const address = findVal('Address', 'Full Address', 'Street', 'Street Address', 'Location Details') || `${businessName}, India`;
    const location = findVal('Location', 'City', 'Area', 'Town', 'District') || 'Target Location';
    if (location && location !== 'Target Location') {
      locationsCount[location] = (locationsCount[location] || 0) + 1;
    }

    // Additional Contact & Profile Details
    const email = findVal('Email', 'E-mail', 'Mail', 'Email Address');
    const whatsappNo = findVal('WhatsApp No', 'WhatsApp', 'Whatsapp', 'WA');
    const website = findVal('Website', 'URL', 'Web', 'Site');
    const tag = findVal('Tag', 'Tags', 'Label');
    const note = findVal('Note', 'Notes', 'Remark', 'Remarks') || tag;
    const source = findVal('Source', 'Specific Source', 'Discovery Source') || 'Imported File';
    const rating = parseFloat(findVal('Rating', 'Stars')) || 0;
    const reviewsCount = parseInt(findVal('Reviews Count', 'Reviews', 'Review Count'), 10) || 0;

    // Social Profiles
    const socialProfiles: SocialProfiles = {
      linkedin: findVal('LinkedIn', 'Linkedin URL'),
      instagram: findVal('Instagram', 'Instagram URL'),
      facebook: findVal('Facebook', 'Facebook URL'),
      twitter: findVal('X / Twitter', 'Twitter', 'X', 'Twitter URL'),
      youtube: findVal('YouTube', 'Youtube URL'),
      indiamart: findVal('IndiaMART', 'Indiamart'),
      tradeindia: findVal('TradeIndia', 'Tradeindia'),
      justdial: findVal('Justdial', 'JustDial'),
      amazon: findVal('Amazon Store', 'Amazon'),
      flipkart: findVal('Flipkart Store', 'Flipkart'),
      meesho: findVal('Meesho Store', 'Meesho')
    };

    validLeads.push({
      id,
      businessName,
      category,
      tag,
      address,
      location,
      googleMapLocation: mapLocation || (website ? website : `https://maps.google.com/?q=${encodeURIComponent(`${businessName} ${location}`)}`),
      contactNumber,
      email,
      whatsappNo: whatsappNo || contactNumber,
      pincode: findVal('Pincode', 'Pin Code', 'Postal Code', 'ZIP'),
      website,
      socialProfiles,
      rating,
      reviewsCount,
      verified: true,
      note,
      scrapedAt: findVal('Scraped At', 'Date', 'Imported At') || new Date().toISOString(),
      source,
      specificSource: source,
      discoverySource: 'Imported File'
    });
  }

  // Determine dominant location if detected
  let detectedLocation: string | undefined = undefined;
  const locationEntries = Object.entries(locationsCount);
  if (locationEntries.length > 0) {
    locationEntries.sort((a, b) => b[1] - a[1]);
    detectedLocation = locationEntries[0][0];
  }

  return {
    fileName,
    fileSize,
    totalRows: rows.length,
    validLeads,
    detectedCategories: Array.from(categoriesSet),
    detectedLocation,
    hasPlaceIdsCount,
    duplicateCount
  };
}
