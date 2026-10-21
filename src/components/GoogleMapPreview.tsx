import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface GoogleMapPreviewProps {
  lat?: number;
  lng?: number;
  radiusKm: number;
  locationName: string;
  onLocationSelect?: (locationName: string, lat: number, lng: number) => void;
  onCoordinatesResolved?: (lat: number, lng: number) => void;
}

// Default fallback coordinates (center of India - New Delhi)
const DEFAULT_CENTER: [number, number] = [28.6139, 77.2090];

export const GoogleMapPreview: React.FC<GoogleMapPreviewProps> = ({
  lat,
  lng,
  radiusKm,
  locationName,
  onLocationSelect,
  onCoordinatesResolved
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);
  const geocodeTimeoutRef = useRef<any>(null);

  // Helper to reverse geocode clicked/dragged coordinates to address name
  const reverseGeocode = async (targetLat: number, targetLng: number) => {
    try {
      const res = await fetch(`/api/geocode?lat=${targetLat}&lng=${targetLng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.displayName) {
          const addr = data.address || {};
          const cleanParts = [
            addr.suburb || addr.neighbourhood || addr.road,
            addr.city || addr.town || addr.village || addr.county,
            addr.state
          ].filter(Boolean);

          const formatted = cleanParts.length > 0
            ? cleanParts.slice(0, 3).join(', ')
            : data.displayName.split(',').slice(0, 3).map((s: string) => s.trim()).join(', ');

          isInternalUpdateRef.current = true;
          if (onLocationSelect) {
            onLocationSelect(formatted || data.displayName, targetLat, targetLng);
          } else if (onCoordinatesResolved) {
            onCoordinatesResolved(targetLat, targetLng);
          }
          setTimeout(() => {
            isInternalUpdateRef.current = false;
          }, 800);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Fallback if reverse geocode service is offline
    const fallback = `${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}`;
    isInternalUpdateRef.current = true;
    if (onLocationSelect) {
      onLocationSelect(fallback, targetLat, targetLng);
    } else if (onCoordinatesResolved) {
      onCoordinatesResolved(targetLat, targetLng);
    }
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 800);
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const initialLat = (lat && Number.isFinite(lat)) ? lat : DEFAULT_CENTER[0];
    const initialLng = (lng && Number.isFinite(lng)) ? lng : DEFAULT_CENTER[1];

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Clean OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Zoom control in bottom-right corner
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom SVG Pin Icon
    const pinSvg = `
      <div style="cursor: grab; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); transform: translateY(-4px);">
        <svg viewBox="0 0 32 42" width="30" height="39" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 13.5 24 15.2 25.5a1.2 1.2 0 0 0 1.6 0C18.5 40 32 26.5 32 16 32 7.163 24.837 0 16 0z" fill="#EA4335"/>
          <circle cx="16" cy="15" r="6" fill="#FFFFFF"/>
          <circle cx="16" cy="15" r="3.2" fill="#EA4335"/>
        </svg>
      </div>
    `;

    const customIcon = L.divIcon({
      html: pinSvg,
      className: 'map-location-picker-pin',
      iconSize: [30, 39],
      iconAnchor: [15, 39]
    });

    // Draggable Marker
    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    // Coverage Radius Circle
    const circle = L.circle([initialLat, initialLng], {
      radius: (radiusKm || 5) * 1000,
      color: '#1A73E8',
      weight: 1.5,
      dashArray: '5, 5',
      fillColor: '#4285F4',
      fillOpacity: 0.12
    }).addTo(map);

    markerRef.current = marker;
    circleRef.current = circle;
    mapInstanceRef.current = map;

    // Map Click: Move marker and circle, then reverse geocode
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;
      marker.setLatLng([clickLat, clickLng]);
      circle.setLatLng([clickLat, clickLng]);
      reverseGeocode(clickLat, clickLng);
    });

    // Marker Dragend: Update circle, then reverse geocode
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      circle.setLatLng(pos);
      reverseGeocode(pos.lat, pos.lng);
    });

    // Invalidate size to guarantee tile rendering without grey edges
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  // 2. Synchronize Radius changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius((radiusKm || 5) * 1000);
    }
  }, [radiusKm]);

  // 3. Synchronize Coordinates when updated from Search Box / GPS / Autocomplete
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    if (isInternalUpdateRef.current) return;

    if (lat && lng && Number.isFinite(lat) && Number.isFinite(lng)) {
      const currentPos = markerRef.current.getLatLng();
      const dist = Math.hypot(currentPos.lat - lat, currentPos.lng - lng);

      // Only flyTo if the coordinates actually shifted
      if (dist > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        circleRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.flyTo([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 13), {
          duration: 0.6
        });
      }
    }
  }, [lat, lng]);

  // 4. Synchronize when user types text in search box without selecting an autocomplete option
  useEffect(() => {
    if (isInternalUpdateRef.current) return;
    const loc = (locationName || '').trim();
    if (!loc || loc.length < 3) return;

    // If coordinates are already matched to this location, avoid forward-geocoding
    if (lat && lng && Number.isFinite(lat) && Number.isFinite(lng)) return;

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(loc)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.lat && data.lng && mapInstanceRef.current && markerRef.current && circleRef.current) {
            markerRef.current.setLatLng([data.lat, data.lng]);
            circleRef.current.setLatLng([data.lat, data.lng]);
            mapInstanceRef.current.flyTo([data.lat, data.lng], 13, { duration: 0.6 });
            if (onCoordinatesResolved) {
              onCoordinatesResolved(data.lat, data.lng);
            }
          }
        }
      } catch {
        // ignore
      }
    }, 500);

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [locationName, lat, lng, onCoordinatesResolved]);

  return (
    <div
      className="position-relative w-100 rounded-3 overflow-hidden border shadow-xs"
      style={{
        height: '210px',
        maxHeight: '26vh',
        minHeight: '180px',
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC'
      }}
    >
      {/* Pure Map Viewport (Clean, draggable, zoomable, click to pick location) */}
      <div
        ref={containerRef}
        className="w-100 h-100"
        style={{ cursor: 'crosshair' }}
      />
    </div>
  );
};
