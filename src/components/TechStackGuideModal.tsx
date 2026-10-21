import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, Cpu, Code2, Copy, Check, Server, Database, Globe } from 'lucide-react';

interface TechStackGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechStackGuideModal: React.FC<TechStackGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'apis' | 'antiblock' | 'boilerplate'>('stack');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Full-Stack Architecture & API Integration Strategy</h3>
              <p className="text-xs text-slate-500">Technical guide, anti-blocking strategies, and core boilerplate logic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'stack' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Recommended Tech Stack
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'apis' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Anti-Blocking APIs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('antiblock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'antiblock' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Stealth Scraping Strategy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('boilerplate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'boilerplate' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Core Boilerplate Code
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* TAB 1: Recommended Tech Stack */}
          {activeTab === 'stack' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                    <Globe className="w-4 h-4" />
                    <span>Frontend Layer</span>
                  </div>
                  <p className="text-slate-900 font-semibold">Angular 18+ or React 19 SPA</p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Provides reactive two-way binding, robust streaming for multi-agent progress, and native support for HTML5 Geolocation API, tabbed multi-mode search, and responsive mobile-first UI with Tailwind CSS.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <Server className="w-4 h-4" />
                    <span>Backend Scraping Engine</span>
                  </div>
                  <p className="text-slate-900 font-semibold">Node.js + Express / Fastify</p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Non-blocking asynchronous I/O handles concurrent scraping requests, worker queue management, rate-limited proxy dispatching, and rapid binary streaming for Spreadsheet and ZIP packaging.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-600 font-bold text-sm">
                    <Database className="w-4 h-4" />
                    <span>Data &amp; Export Layer</span>
                  </div>
                  <p className="text-slate-900 font-semibold">Spreadsheet + JSZip + SQLite/DuckDB</p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Lightweight in-process database stores leads temporarily before exporting. Multi-sheet workbooks with hyperlinked URLs, while JSZip bundles hundreds of individual .vcf files on the fly.
                  </p>
                </div>

              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-slate-900 mb-1">Architecture Summary</h4>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  The architecture divides responsibilities cleanly: the frontend orchestrates user input and renders real-time status; the backend runs live Places API queries; and the data layer cleans, normalizes phone numbers into E.164 WhatsApp links, builds category-specific Spreadsheet sheets, and structures vCard 3.0 specs.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Anti-Blocking APIs */}
          {activeTab === 'apis' && (
            <div className="space-y-4">
              <div className="space-y-3">
                
                {/* API 1: Google Places API */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">1. Google Places API (New Text Search & Details)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">100% Ban-Proof</span>
                  </div>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Official API directly from Google. Accepts road names (e.g., "Sevoke Road, Siliguri") and radius boundaries. Returns official business name, phone number, address, place_id, and coordinates without any scraping blocks or CAPTCHAs.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    Endpoint: POST https://places.googleapis.com/v1/places:searchText
                  </div>
                </div>

                {/* API 2: Outscraper */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">2. Outscraper (Google Maps Scraper API)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">Deep Enrichment</span>
                  </div>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Specialized B2B lead enrichment API that extracts public emails, phones, social handles (Instagram, Facebook), IndiaMART vendor profiles, and websites automatically. Handles proxy rotation and IP pools internally.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    Endpoint: GET https://api.app.outscraper.com/maps/search-v3
                  </div>
                </div>

                {/* API 3: Apify */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">3. Apify (compass/crawler-google-places)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-950 text-violet-300 border border-violet-800">Cloud Actor</span>
                  </div>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Enterprise-scale scraper that navigates Google Maps web UI using headless browsers with fingerprint injection, residential proxy pools, and automatic CAPTCHA solving.
                  </p>
                </div>

                {/* API 4: SerpApi */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">4. SerpApi (Google Local & SERP Engine)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">Fast SERP Queries</span>
                  </div>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Scrapes Google Local 3-Pack, SERP knowledge panels, and directory links (Justdial, TradeIndia, IndiaMART). Zero block risk.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Stealth Scraping Strategy */}
          {activeTab === 'antiblock' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>How to Scrape Directories (IndiaMART, TradeIndia, Justdial) Without Getting Blocked</span>
                </div>
                
                <ol className="list-decimal pl-5 space-y-2 text-[11px] text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-white">Residential Proxy Rotation:</strong> Use dynamic back-connect residential proxies (Bright Data, Smartproxy, or Webshare). Rotate IP on every 3-5 requests with sticky 5-minute sessions to appear like real local ISP users (Airtel, Jio, BSNL).
                  </li>
                  <li>
                    <strong className="text-white">Browser Fingerprint Obfuscation:</strong> Use <code className="text-cyan-300">puppeteer-extra-plugin-stealth</code> or Playwright with randomized Canvas, WebGL, AudioContext, and User-Agent headers matching modern Chrome browsers.
                  </li>
                  <li>
                    <strong className="text-white">Rate-Limiting & Jitter:</strong> Never send burst requests. Enforce token-bucket throttling with 800ms - 2400ms random delay (jitter) between queries.
                  </li>
                  <li>
                    <strong className="text-white">Header Mimicry:</strong> Include standard browser headers: <code className="text-slate-400">sec-ch-ua, sec-fetch-dest, sec-fetch-mode, accept-language: 'en-US,en;q=0.9'</code>.
                  </li>
                  <li>
                    <strong className="text-white">Server-Side Caching:</strong> Cache scraped place IDs and phone records in Redis/SQLite to avoid redundant outbound network requests for repeated queries.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: Core Boilerplate Code */}
          {activeTab === 'boilerplate' && (
            <div className="space-y-4">
              
              {/* VCF Mapping Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">VCF Field Mapping Logic (vCard 3.0 Specification)</span>
                  <button
                    type="button"
                    onClick={() => copyCode(vcfCodeSnippet, 'vcf')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedKey === 'vcf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'vcf' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-indigo-300 overflow-x-auto">
{vcfCodeSnippet}
                </pre>
              </div>

              {/* Spreadsheet Generator Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Multi-Sheet Spreadsheet Generator with Clickable Map Links</span>
                  <button
                    type="button"
                    onClick={() => copyCode(spreadsheetCodeSnippet, 'spreadsheet')}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedKey === 'spreadsheet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'spreadsheet' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto">
{spreadsheetCodeSnippet}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};

const vcfCodeSnippet = `// Strict Step 3 vCard 3.0 Mapping
function buildVCard(lead) {
  const firstName = lead.businessName;
  const middleName = lead.location; // Road/Street name, Area/Town/City
  const tag = lead.tag || "";
  const lastName = tag ? \`\${lead.category} - \${tag}\` : lead.category;

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    \`N:\${lastName};\${firstName};\${middleName};;\`,
    \`FN:\${firstName} \${middleName} \${lastName}\`,
    \`ORG:\${firstName}\`,
    \`TITLE:\${lastName}\`,
    \`TEL;TYPE=CELL,VOICE,PREF:\${lead.contactNumber}\`,
    lead.email ? \`EMAIL;TYPE=INTERNET,WORK:\${lead.email}\` : '',
    lead.address ? \`ADR;TYPE=WORK:;;\${lead.address};;;;\` : '',
    lead.website ? \`URL;TYPE=WORK:\${lead.website}\` : '',
    \`NOTE:\${tag}\`,
    \`CATEGORIES:\${lastName},\${tag}\`,
    'END:VCARD'
  ].filter(Boolean).join('\\r\\n') + '\\r\\n';
}`;

const spreadsheetCodeSnippet = `import * as Spreadsheet from 'spreadsheet';

// Multi-Sheet Spreadsheet Workbook Builder with Exact Columns
function exportSpreadsheetByCategories(leads) {
  const wb = Spreadsheet.utils.book_new();
  const categories = [...new Set(leads.map(l => l.category))];

  categories.forEach(cat => {
    const catLeads = leads.filter(l => l.category === cat);
    const rows = [
      ['Business Name', 'Address', 'Location', 'Google Map Location', 'Contact Number', 'Email', 'WhatsApp No']
    ];

    catLeads.forEach(item => {
      rows.push([
        item.businessName,
        item.address,
        item.location,
        item.googleMapLocation,
        item.contactNumber,
        item.email,
        item.whatsappNo
      ]);
    });

    const ws = Spreadsheet.utils.aoa_to_sheet(rows);
    // Add clickable hyperlinks to Column D (Google Map Location)
    for (let r = 1; r < rows.length; r++) {
      const cellRef = Spreadsheet.utils.encode_cell({ r, c: 3 });
      const url = rows[r][3];
      ws[cellRef] = { t: 's', v: url, l: { Target: url, Tooltip: 'Open Google Maps' } };
    }

    Spreadsheet.utils.book_append_sheet(wb, ws, cat.slice(0, 31));
  });

  Spreadsheet.writeFile(wb, 'B2B_Leads_Database.spreadsheet');
}`;
