import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { LeadItem, SearchConfig } from '../types';
import {
  MapPin,
  Maximize2,
  Minimize2,
  Compass,
  Phone,
  MessageSquare,
  Globe,
  ExternalLink,
  Layers,
  Star,
  CheckCircle2
} from 'lucide-react';

interface ContactsMapViewProps {
  leads: LeadItem[];
  searchConfig?: SearchConfig;
  selectedCategory?: string;
  onSelectLead?: (id: string) => void;
}

// Category color assignment map
const CATEGORY_COLORS = [
  '#4285F4', // Blue
  '#34A853', // Green
  '#FBBC05', // Amber
  '#EA4335', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899'  // Pink
];

// Helper to deterministic offset coordinates if exact lat/lng are missing
function getDeterministicOffsetCoords(
  baseLat: number,
  baseLng: number,
  seedString: string,
  radiusKm = 5
): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  // angle in radians [0, 2PI]
  const angle = (positiveHash % 360) * (Math.PI / 180);
  // distance fraction strictly within radius [0.15, 0.85]
  const distKm = (0.15 + ((positiveHash % 70) / 100)) * (radiusKm || 5);
  // approximate km to degrees (1 deg lat approx 111km, 1 deg lng approx 111 * cos(lat))
  const dLat = (distKm / 111.32) * Math.sin(angle);
  const dLng = (distKm / (111.32 * Math.cos((baseLat * Math.PI) / 180) || 1)) * Math.cos(angle);

  return {
    lat: Number((baseLat + dLat).toFixed(6)),
    lng: Number((baseLng + dLng).toFixed(6))
  };
}

export const ContactsMapView: React.FC<ContactsMapViewProps> = ({
  leads,
  searchConfig,
  selectedCategory = 'all',
  onSelectLead
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePinLead, setActivePinLead] = useState<LeadItem | null>(null);

  // Filter leads if a category filter is active
  const displayedLeads = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return leads;
    return leads.filter((l) => (l.category || '').toLowerCase() === selectedCategory.toLowerCase());
  }, [leads, selectedCategory]);

  // Center coordinate reference: from searchConfig or first available lead coords or default India center
  const centerCoords = useMemo(() => {
    if (searchConfig?.lat && searchConfig?.lng) {
      return { lat: searchConfig.lat, lng: searchConfig.lng };
    }
    const leadWithCoords = leads.find((l) => l.lat && l.lng);
    if (leadWithCoords && leadWithCoords.lat && leadWithCoords.lng) {
      return { lat: leadWithCoords.lat, lng: leadWithCoords.lng };
    }
    return { lat: 28.6139, lng: 77.2090 }; // Default center
  }, [searchConfig, leads]);

  // Unique categories for color mapping
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const unique = Array.from(new Set(leads.map((l) => l.category || 'General')));
    unique.forEach((cat, idx) => {
      map.set(cat, CATEGORY_COLORS[idx % CATEGORY_COLORS.length]);
    });
    return map;
  }, [leads]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerCoords.lat, centerCoords.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // Add OpenStreetMap tile layer (Crisp, high reliability)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>')
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        circleLayerRef.current = null;
      }
    };
  }, []);

  // Synchronize Radius Circle with strict radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (circleLayerRef.current) {
      circleLayerRef.current.remove();
      circleLayerRef.current = null;
    }

    const radiusMeters = (searchConfig?.radiusKm || 5) * 1000;
    const circle = L.circle([centerCoords.lat, centerCoords.lng], {
      radius: radiusMeters,
      color: '#1A73E8',
      weight: 1.5,
      dashArray: '5, 5',
      fillColor: '#4285F4',
      fillOpacity: 0.08
    }).addTo(map);

    circleLayerRef.current = circle;
  }, [centerCoords, searchConfig?.radiusKm]);

  // Update Markers whenever displayedLeads or centerCoords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (displayedLeads.length === 0) return;

    const latLngBounds = L.latLngBounds([]);

    displayedLeads.forEach((item, index) => {
      // Determine coordinates
      let itemLat = item.lat;
      let itemLng = item.lng;

      if (!itemLat || !itemLng || !Number.isFinite(itemLat) || !Number.isFinite(itemLng)) {
        const offset = getDeterministicOffsetCoords(
          centerCoords.lat,
          centerCoords.lng,
          item.id || item.businessName || `${index}`,
          searchConfig?.radiusKm || 5
        );
        itemLat = offset.lat;
        itemLng = offset.lng;
      }

      const pinColor = categoryColorMap.get(item.category || 'General') || '#4285F4';

      // Create Custom SVG Map Pin Marker
      const pinSvg = `
        <div class="custom-contact-marker" style="width: 32px; height: 38px;">
          <svg viewBox="0 0 32 40" width="32" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 13.5 22.8 15.2 24.3a1.2 1.2 0 0 0 1.6 0C18.5 38.8 32 26.5 32 16 32 7.163 24.837 0 16 0z" fill="${pinColor}"/>
            <circle cx="16" cy="15" r="7" fill="#FFFFFF"/>
            <circle cx="16" cy="15" r="3.5" fill="${pinColor}"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinSvg,
        className: 'custom-pin-container',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([itemLat, itemLng], { icon: customIcon });

      // Build rich popup HTML
      const waNumber = item.whatsappNo || item.contactNumber?.replace(/[^0-9+]/g, '');
      const waUrl = waNumber ? `https://wa.me/${waNumber.replace('+', '')}?text=${encodeURIComponent(`Hi ${item.businessName}, checking your commercial services.`)}` : '';
      const mapDirectionsUrl = item.googleMapLocation || `https://maps.google.com/?q=${encodeURIComponent(item.businessName + ' ' + item.address)}`;

      const popupHtml = `
        <div style="width: 250px; font-family: system-ui, -apple-system, sans-serif; padding: 12px 14px; background: #ffffff;">
          <div style="font-weight: 700; font-size: 0.9rem; color: #0F172A; margin-bottom: 3px; line-height: 1.25;">
            ${item.businessName}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 0.68rem; font-weight: 600; padding: 2px 7px; border-radius: 9999px; background-color: ${pinColor}18; color: ${pinColor}; border: 1px solid ${pinColor}40;">
              ${item.category || 'Commercial'}
            </span>
            ${item.rating ? `<span style="font-size: 0.7rem; color: #D97706; font-weight: 600;">★ ${item.rating}</span>` : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #1e8e3e; font-weight: 600; margin-bottom: 6px;">
            <span>📍 ${item.distanceKm !== undefined ? `${item.distanceKm} km from center` : 'Within radius'}</span>
            <span style="color: #64748B; font-weight: normal;">(Radius: ≤ ${searchConfig?.radiusKm || 5} km)</span>
          </div>

          <div style="font-size: 0.74rem; color: #475569; margin-bottom: 8px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${item.address || item.location || 'Location verified'}
          </div>

          <div style="display: flex; gap: 6px; margin-top: 10px; border-top: 1px solid #F1F5F9; padding-top: 8px;">
            ${item.contactNumber ? `
              <a href="tel:${item.contactNumber}" style="flex: 1; text-align: center; font-size: 0.72rem; font-weight: 600; text-decoration: none; padding: 5px 8px; border-radius: 6px; background-color: #F1F5F9; color: #0F172A; border: 1px solid #E2E8F0;">
                📞 Call
              </a>
            ` : ''}
            ${waUrl ? `
              <a href="${waUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; font-size: 0.72rem; font-weight: 600; text-decoration: none; padding: 5px 8px; border-radius: 6px; background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0;">
                💬 WhatsApp
              </a>
            ` : ''}
            <a href="${mapDirectionsUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; font-size: 0.72rem; font-weight: 600; text-decoration: none; padding: 5px 8px; border-radius: 6px; background-color: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;">
              🗺️ Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setActivePinLead(item);
        if (onSelectLead) {
          onSelectLead(item.id);
        }
      });

      markersGroup.addLayer(marker);
      latLngBounds.extend([itemLat, itemLng]);
    });

    // Fit map bounds to show all pins nicely
    if (latLngBounds.isValid()) {
      map.fitBounds(latLngBounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [displayedLeads, centerCoords, categoryColorMap, searchConfig]);

  // Center & Fit Bounds handler
  const handleFitAllPins = () => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    const layers = markersGroup.getLayers();
    if (layers.length === 0) return;

    const bounds = L.latLngBounds([]);
    layers.forEach((layer) => {
      if (layer instanceof L.Marker) {
        bounds.extend(layer.getLatLng());
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
    }
  };

  const mapHeight = isExpanded ? '520px' : '360px';

  return (
    <div className="contacts-map-wrapper mt-3">
      {/* Map Header Toolbar */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2.5 bg-light border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle p-1.5 shadow-2xs"
            style={{ backgroundColor: '#EBF2FE', color: '#1A73E8' }}
          >
            <MapPin size={16} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark" style={{ fontSize: '0.88rem', letterSpacing: '-0.2px' }}>
                Discovered Contacts Map
              </span>
              <span
                className="badge rounded-pill fw-bold"
                style={{ backgroundColor: '#1E293B', color: '#FFFFFF', fontSize: '0.68rem', padding: '3px 8px' }}
              >
                📍 {displayedLeads.length} {displayedLeads.length === 1 ? 'Contact Pinned' : 'Contacts Pinned'}
              </span>
            </div>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Interactive geographic pins for all discovered businesses across {searchConfig?.manualLocation || 'the target radius'}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Fit all pins button */}
          <button
            type="button"
            onClick={handleFitAllPins}
            className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1.5 py-1 px-2.5 shadow-2xs rounded-pill"
            style={{ fontSize: '0.74rem' }}
            title="Zoom and center to fit all pins"
          >
            <Compass size={13} className="text-primary" />
            <span>Fit All Pins</span>
          </button>

          {/* Expand / Minimize Height */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(!isExpanded);
              setTimeout(() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.invalidateSize();
                }
              }, 150);
            }}
            className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1 py-1 px-2 shadow-2xs rounded-circle"
            style={{ width: '28px', height: '28px' }}
            title={isExpanded ? 'Compact map view' : 'Expand map view'}
            aria-label="Toggle map size"
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Map View Canvas */}
      <div className="position-relative w-100" style={{ height: mapHeight, transition: 'height 0.25s ease' }}>
        <div ref={mapContainerRef} className="w-100 h-100" />

        {/* Floating Quick Stats Legend Overlay at Top Left */}
        <div
          className="position-absolute top-0 start-0 m-2.5 p-2 rounded-3 border bg-white shadow-sm d-none d-sm-flex align-items-center gap-2"
          style={{ zIndex: 1000, fontSize: '0.73rem', backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
        >
          <div className="d-flex align-items-center gap-1.5">
            <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#34A853' }} />
            <span className="text-secondary">Click pin to view contact &amp; call/WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
};
