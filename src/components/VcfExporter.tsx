import React, { useState, useMemo } from 'react';
import { 
  Contact, 
  Archive, 
  Smartphone, 
  Copy, 
  Check, 
  Loader2,
  UserCheck,
  Tag,
  Globe,
  Sparkles
} from 'lucide-react';
import { LeadItem } from '../types';
import { generateVcfZip, downloadCombinedVcf, buildVCardString } from '../utils/vcfGenerator';
import { hasValidPhone } from '../utils/formatters';

interface VcfExporterProps {
  leads: LeadItem[];
}

export const VcfExporter: React.FC<VcfExporterProps> = ({ leads }) => {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);

  // Initialize tag from first lead or empty
  const defaultTag = leads[0]?.tag || leads[0]?.note || '';
  const [tagValue, setTagValue] = useState<string>(defaultTag);

  // Filter: Strictly leads with authentic phone numbers
  const validLeads = useMemo(() => {
    return leads.filter((item) => hasValidPhone(item.contactNumber));
  }, [leads]);

  const currentLead = validLeads[selectedLeadIndex] || validLeads[0];

  // Guaranteed Dual-Path VCF ZIP Download
  const handleDownloadZip = async () => {
    if (validLeads.length === 0) return;
    setIsGeneratingZip(true);

    try {
      const zipName = `B2B_Contacts_VCF_${new Date().toISOString().slice(0, 10)}.zip`;
      await generateVcfZip(validLeads, zipName, tagValue);
    } catch (clientErr: any) {
      console.warn('Client ZIP fallback to server API:', clientErr);
      try {
        const response = await fetch('/api/export/vcf-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads: validLeads, tag: tagValue })
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `B2B_Contacts_VCF_${new Date().toISOString().slice(0, 10)}.zip`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 2000);
        } else {
          alert('Could not package VCF ZIP.');
        }
      } catch (serverErr: any) {
        alert(`ZIP error: ${serverErr.message}`);
      }
    } finally {
      setTimeout(() => setIsGeneratingZip(false), 500);
    }
  };

  const handleDownloadCombined = () => {
    try {
      const vcfName = `All_Contacts_${new Date().toISOString().slice(0, 10)}.vcf`;
      downloadCombinedVcf(validLeads, vcfName, tagValue);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleCopyVcf = () => {
    if (!currentLead) return;
    navigator.clipboard.writeText(buildVCardString(currentLead, tagValue));
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <div className="g-card p-3 p-sm-4 mb-3 mb-md-4">
      {/* Header */}
      <div className="d-flex align-items-sm-center justify-content-between flex-column flex-sm-row gap-2.5 pb-2.5 mb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 className="fs-5 fw-bold text-dark mb-0">VCF Export</h2>
            <span className="badge badge-g-red rounded-pill fw-bold d-inline-flex align-items-center justify-content-center" style={{ fontSize: '0.68rem', height: '20px', padding: '0 8px', lineHeight: 1 }}>
              Step 3
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-sm-auto">
          {/* 1-Tap Mobile */}
          <button
            type="button"
            onClick={handleDownloadCombined}
            disabled={validLeads.length === 0}
            className="btn btn-g-blue btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 flex-fill flex-sm-grow-0 rounded-pill shadow-sm"
            title="Import all contacts in 1 tap on Android / iOS phone"
          >
            <Smartphone size={14} />
            <span>Single File (All Contacts)</span>
          </button>

          {/* VCF Zip */}
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={validLeads.length === 0 || isGeneratingZip}
            className="btn btn-g-green btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 flex-fill flex-sm-grow-0 rounded-pill shadow-sm"
            title="Download folder of individual .vcf files in a zip package"
          >
            {isGeneratingZip ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
            <span>Download VCF (.zip)</span>
          </button>
        </div>
      </div>

      {/* Tag Customization Toolbar with Warm Amber Yellow #FBBC05 */}
      <div 
        className="p-2.5 p-sm-3 rounded-3 border mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2.5"
        style={{ 
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          boxShadow: '0 1px 4px rgba(251, 188, 5, 0.08)' 
        }}
      >
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '460px' }}>
          <Tag size={15} style={{ color: 'var(--g-yellow-text)' }} className="flex-shrink-0 ms-1" />
          <span className="small fw-bold text-dark text-nowrap" style={{ fontSize: '0.82rem' }}>
            Active Tag:
          </span>
          <input
            type="text"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            placeholder="Enter tag (optional)..."
            className="form-control form-control-sm bg-white"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
      </div>

      {validLeads.length === 0 ? (
        <div className="text-center py-5 border rounded-3 bg-light">
          <Contact size={36} className="text-muted mb-2 mx-auto" />
          <h6 className="fw-semibold text-dark">No Phone Numbers Found</h6>
          <small className="text-muted">
            Contacts require authentic telephone numbers for vCard mobile import.
          </small>
        </div>
      ) : (
        <div className="row g-3">
          {/* Left: Contact Selector */}
          <div className="col-12 col-md-5">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Verified Contacts ({validLeads.length})
              </span>
              <span className="badge badge-g-blue py-0.5 px-2 rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>
                Phone Verified
              </span>
            </div>

            <div className="list-group rounded-3 border bg-white" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {validLeads.map((item, idx) => (
                <button
                  key={item.id ? `${item.id}-${idx}` : `vcf-lead-${idx}`}
                  type="button"
                  onClick={() => setSelectedLeadIndex(idx)}
                  className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 border-0 border-bottom ${
                    selectedLeadIndex === idx ? 'bg-primary-subtle fw-bold text-primary' : 'text-dark'
                  }`}
                  style={{ fontSize: '0.8rem', transition: 'background-color 0.15s ease' }}
                >
                  <span className="text-truncate me-2">{item.businessName}</span>
                  <span className="font-monospace text-muted small flex-shrink-0" style={{ fontSize: '0.72rem' }}>
                    {item.contactNumber}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Flat vCard Field Preview Card */}
          {currentLead && (
            <div className="col-12 col-md-7">
              <div 
                className="border rounded-3 p-3 p-md-3.5 bg-white shadow-xs position-relative"
                style={{ borderColor: '#E2E8F0' }}
              >
                <div className="d-flex align-items-center justify-content-between pb-2 mb-2.5 border-bottom">
                  <div className="d-flex align-items-center gap-1.5">
                    <UserCheck size={16} className="text-success" />
                    <span className="fw-bold small text-dark">vCard 3.0 Field Mapping Preview</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyVcf}
                    className="btn btn-sm btn-link text-decoration-none text-primary p-0 d-flex align-items-center gap-1"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {copiedStatus ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    <span>{copiedStatus ? 'Copied VCF!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="d-flex flex-column gap-2" style={{ fontSize: '0.8rem' }}>
                  {/* First Name: [Business Name] */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">First Name:</span>
                    <span className="fw-bold text-dark text-truncate ms-2" style={{ maxWidth: '280px' }}>
                      {currentLead.businessName}
                    </span>
                  </div>

                  {/* Middle Name: [Google Map short location: Road/Street name, Area/Town/City, State/District] */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">Middle Name:</span>
                    <span className="text-secondary text-truncate ms-2" style={{ maxWidth: '280px' }} title={currentLead.location}>
                      {currentLead.location || '—'}
                    </span>
                  </div>

                  {/* Last Name: [Category or Nature of Business] - [Tag] */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">Last Name:</span>
                    <span className="fw-semibold text-primary ms-2">
                      {currentLead.category}{tagValue ? ` - ${tagValue}` : ''}
                    </span>
                  </div>

                  {/* Phone: [Public Number] */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">Phone:</span>
                    <span className="font-monospace fw-bold text-success ms-2">{currentLead.contactNumber}</span>
                  </div>

                  {/* Email: [Email Address] */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">Email:</span>
                    <span className="font-monospace text-secondary ms-2" style={{ fontSize: '0.75rem' }}>
                      {currentLead.email || '—'}
                    </span>
                  </div>

                  {/* Address: [Full Google Map Address] */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">Address:</span>
                    <span className="text-secondary text-end text-truncate ms-2" style={{ maxWidth: '280px' }} title={currentLead.address}>
                      {currentLead.address}
                    </span>
                  </div>

                  {/* Website: [Website URL or Social/IndiaMART link] */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">Website:</span>
                    <span className="text-secondary text-truncate ms-2" style={{ maxWidth: '280px' }}>
                      {currentLead.website || currentLead.googleMapLocation || '—'}
                    </span>
                  </div>

                  {/* Note: [Tag] into the note section of every generated contact */}
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted fw-medium">Note:</span>
                    <span className="badge badge-g-yellow font-monospace fw-bold ms-2" style={{ fontSize: '0.72rem' }}>
                      {tagValue || '—'}
                    </span>
                  </div>

                  {/* Tag: [Tag] into the note section of every generated contact */}
                  <div className="d-flex justify-content-between align-items-center pt-0.5">
                    <span className="text-muted fw-medium">Tag:</span>
                    <span className="badge bg-primary text-white font-monospace ms-2" style={{ fontSize: '0.72rem' }}>
                      {tagValue || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
