import { useEffect, useRef } from 'react';
import type { Farm, SensorHub } from '../types';

const GOOGLE_MAPS_KEY = 'AIzaSyD6u5Uwcfn-wUUEMVSp0wP4kS6s5NZl-L8';

const COLORS = { healthy: '#22c55e', watch: '#f59e0b', alert: '#ef4444' };

export const DEPOT_COLORS: Record<string, string> = {
  FRA_DEPOT: '#1e40af',
  COOPERATIVE: '#16a34a',
  AGRO_DEALER: '#d97706',
  MILLER_DEPOT: '#7c3aed',
  EXPORT_HUB: '#dc2626',
};

export const DEPOT_ICONS: Record<string, string> = {
  FRA_DEPOT: '🏛️',
  COOPERATIVE: '🤝',
  AGRO_DEALER: '🏪',
  MILLER_DEPOT: '🏭',
  EXPORT_HUB: '🚢',
};

export const DEPOT_TYPE_LABELS: Record<string, string> = {
  FRA_DEPOT: 'FRA Depot',
  COOPERATIVE: 'Cooperative',
  AGRO_DEALER: 'Agro Dealer',
  MILLER_DEPOT: 'Miller',
  EXPORT_HUB: 'Export Hub',
};

declare global {
  interface Window {
    google: any;
    __msInitGoogleMap?: () => void;
  }
}

interface Props {
  farms: Farm[];
  hubs: (SensorHub & { live?: any })[];
  depots?: any[];
  showDepots?: boolean;
  depotTypeFilter?: string;
  focusDistrict?: string;
  onFarmClick?: (farm: Farm) => void;
  tickCount?: number;
}

export function GoogleFarmMap({
  farms,
  hubs,
  depots = [],
  showDepots = true,
  depotTypeFilter = '',
  focusDistrict = '',
  onFarmClick,
  tickCount = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const boundariesRef = useRef<any[]>([]);

  // Load Google Maps API
  useEffect(() => {
    if (window.google?.maps) {
      initMap();
      return;
    }
    window.__msInitGoogleMap = () => initMap();
    if (!document.querySelector('script[data-ms-maps]')) {
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry&loading=async&callback=__msInitGoogleMap`;
      s.async = true;
      s.defer = true;
      s.dataset.msMaps = '1';
      document.head.appendChild(s);
    }
    // eslint-disable-next-line
  }, []);

  function initMap() {
    if (!ref.current || mapRef.current || !window.google?.maps) return;
    mapRef.current = new window.google.maps.Map(ref.current, {
      center: { lat: -13.5, lng: 28.0 },
      zoom: 6,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });
    drawAll();
  }

  // Handle focus changes (e.g. Lukulu)
  useEffect(() => {
    if (!mapRef.current) return;
    if (focusDistrict === 'Lukulu') {
      mapRef.current.setCenter({ lat: -14.3707, lng: 23.2425 });
      mapRef.current.setZoom(13);
    }
  }, [focusDistrict]);

  // Redraw on updates
  useEffect(() => {
    if (mapRef.current) drawAll();
    // eslint-disable-next-line
  }, [farms, hubs, depots, showDepots, depotTypeFilter, tickCount]);

  function drawAll() {
    const map = mapRef.current;
    const g = window.google?.maps;
    if (!map || !g) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap?.(null));
    boundariesRef.current.forEach((b) => b.setMap?.(null));
    markersRef.current = [];
    boundariesRef.current = [];

    const safeDepots = Array.isArray(depots) ? depots : [];
    const safeFarms = Array.isArray(farms) ? farms : [];
    const safeHubs = Array.isArray(hubs) ? hubs : [];

    // 1. Depots (rendered below farm pins: zIndex 100)
    if (showDepots && safeDepots.length > 0) {
      const filteredDepots = safeDepots.filter((d: any) => {
        if (depotTypeFilter && d.type !== depotTypeFilter) return false;
        return true;
      });

      filteredDepots.forEach((d: any) => {
        const lat = Number(d.lat ?? d.latitude);
        const lon = Number(d.lon ?? d.longitude);
        if (isNaN(lat) || isNaN(lon)) return;

        const color = DEPOT_COLORS[d.type] || '#16a34a';
        const icon = DEPOT_ICONS[d.type] || '📍';
        const label = DEPOT_TYPE_LABELS[d.type] || d.type;

        const marker = new g.Marker({
          map,
          position: { lat, lng: lon },
          icon: {
            url:
              'data:image/svg+xml;utf8,' +
              encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34">
                <circle cx="17" cy="17" r="15" fill="${color}" stroke="#fff" stroke-width="3"/>
                <text x="17" y="23" text-anchor="middle" font-size="16">${icon}</text>
              </svg>`),
            scaledSize: new g.Size(34, 34),
            anchor: new g.Point(17, 17),
          },
          title: `${d.name} (${label})`,
          zIndex: 100,
        });

        const popupHtml = `
          <div style="font-family:system-ui;min-width:280px;color:#111;">
            <div style="
              background:${color};color:white;
              padding:8px 12px;margin:-13px -20px 12px;
              border-radius:8px 8px 0 0;
              font-weight:800;font-size:14px;">
              ${icon} ${d.name}
            </div>
            <div style="font-size:12px;line-height:1.7;">
              <div style="margin-bottom:6px;">
                <span style="
                  background:${color};color:white;
                  padding:2px 8px;border-radius:12px;
                  font-size:10px;font-weight:700;text-transform:uppercase;">
                  ${label}
                </span>
              </div>
              <div><b>Location:</b> ${d.district} District, ${d.province} Province</div>
              <div><b>Operator:</b> ${d.operator}</div>
              <div><b>Capacity:</b> ${(d.capacity_tons || 0).toLocaleString()} tons</div>
              <div><b>Crops:</b> ${(Array.isArray(d.crops) ? d.crops : []).join(', ')}</div>
              <div style="margin-top:10px;padding-top:10px;border-top:1px solid #eee;">
                <a href="tel:${d.phone}" style="
                  display:block;padding:6px;margin-bottom:4px;
                  background:${color};color:white;
                  text-align:center;border-radius:6px;
                  text-decoration:none;font-weight:700;font-size:11px;">
                  📞 Call ${d.phone}
                </a>
                <a href="mailto:${d.email}" style="
                  display:block;padding:6px;
                  background:white;color:${color};
                  border:1.5px solid ${color};
                  text-align:center;border-radius:6px;
                  text-decoration:none;font-weight:700;font-size:11px;">
                  ✉️ Email
                </a>
              </div>
            </div>
          </div>
        `;

        const info = new g.InfoWindow({ content: popupHtml });
        marker.addListener('click', () => info.open(map, marker));
        markersRef.current.push(marker);
      });
    }

    // 2. Hubs with live sensor data
    safeHubs.forEach((h) => {
      if (!h.latitude || !h.longitude) return;
      const center = { lat: h.latitude, lng: h.longitude };

      // 8.5 km coverage ring
      const ring = new g.Circle({
        map,
        center,
        radius: 8500,
        strokeColor: '#ef4444',
        strokeOpacity: 0.7,
        strokeWeight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.06,
      });
      boundariesRef.current.push(ring);

      // Hub marker
      const marker = new g.Marker({
        map,
        position: center,
        icon: {
          url:
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42">
              <circle cx="21" cy="21" r="18" fill="#ef4444" stroke="#fff" stroke-width="3"/>
              <text x="21" y="28" text-anchor="middle" font-size="20">📡</text>
            </svg>`),
          scaledSize: new g.Size(42, 42),
          anchor: new g.Point(21, 21),
        },
        title: h.name,
        zIndex: 1000,
      });

      const live = h.live;
      const infoContent = `
        <div style="font-family:system-ui;min-width:240px;color:#111;">
          <div style="font-weight:800;color:#2e7d32;margin-bottom:6px;font-size:14px;">
            📡 ${h.name}
          </div>
          <div style="font-size:12px;line-height:1.7;">
            <div><b>Code:</b> ${h.hub_code}</div>
            <div><b>Province:</b> ${h.province}</div>
            <div><b>Coverage:</b> 8.5 km LoRaWAN</div>
            ${
              live
                ? `
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
                <div style="font-weight:700;color:#2e7d32;margin-bottom:4px;">Live Sensor Readings</div>
                <div><b>Soil 15cm:</b> ${live.soil_15}%</div>
                <div><b>Soil 30cm:</b> ${live.soil_30}%</div>
                <div><b>Soil 60cm:</b> ${live.soil_60}%</div>
                <div><b>Temp:</b> ${live.temperature}°C</div>
                <div><b>Humidity:</b> ${live.humidity}%</div>
                <div><b>Rainfall:</b> ${live.rainfall} mm</div>
                <div><b>Battery:</b> ${Number(live.battery_v).toFixed(1)}V</div>
                <div><b>Solar:</b> ${Number(live.solar_v).toFixed(1)}V</div>
                <div><b>Signal:</b> ${live.signal_dbm} dBm</div>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;

      const info = new g.InfoWindow({ content: infoContent });
      marker.addListener('click', () => info.open(map, marker));
      markersRef.current.push(marker);
    });

    // 2b. Lukulu District Landmark Pin
    const lukuluMarker = new g.Marker({
      map,
      position: { lat: -14.3707, lng: 23.2425 },
      title: '📍 Lukulu District, Western Province (4 Strategic Depots)',
      label: {
        text: '📍 Lukulu',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 'bold',
      },
      icon: {
        path: g.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#059669',
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: 9999,
    });
    const lukuluInfo = new g.InfoWindow({
      content: `
        <div style="font-family:system-ui;min-width:240px;color:#111;">
          <div style="font-weight:800;color:#059669;font-size:14px;margin-bottom:4px;">
            📍 Lukulu District Landmark
          </div>
          <div style="font-size:12px;line-height:1.6;color:#374151;">
            <div><b>Province:</b> Western Province</div>
            <div><b>Coordinates:</b> -14.3707°S, 23.2425°E</div>
            <div><b>Local Depots:</b> 4 Strategic Depots (Coop Union, FRA Depot, Rice Millers, Fisheries)</div>
          </div>
        </div>
      `,
    });
    lukuluMarker.addListener('click', () => lukuluInfo.open(map, lukuluMarker));
    markersRef.current.push(lukuluMarker);

    // 3. Farm markers (zIndex 500)
    safeFarms.forEach((f) => {
      if (!f.latitude || !f.longitude) return;
      const color = COLORS[f.health_status as keyof typeof COLORS] || '#666';

      const marker = new g.Marker({
        map,
        position: { lat: f.latitude, lng: f.longitude },
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
        title: `${f.name} · ${f.village}`,
        zIndex: 500,
      });

      const popupContent = `
        <div style="font-family:system-ui;min-width:260px;color:#111;">
          <div style="font-weight:800;color:#2e7d32;margin-bottom:6px;">🚜 ${f.name}</div>
          <div style="font-size:12px;line-height:1.7;">
            <div><b>Village:</b> ${f.village}, ${f.province}</div>
            <div><b>ZIAMIS:</b> ${f.ziamis_id}</div>
            <div><b>Phone:</b> <a href="tel:${f.phone}">${f.phone}</a></div>
            <div><b>Crop:</b> ${f.crop} (${f.crop_stage})</div>
            <div><b>Area:</b> ${f.area_hectares} ha</div>
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;">
              <div><b>Soil 30cm:</b> ${f.soil_moisture}%</div>
              <div><b>Health:</b> <span style="color:${color};font-weight:700;text-transform:uppercase;">${f.health_status}</span></div>
              <div><b>Disease Risk:</b> ${f.disease_risk}</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:6px;">
              <a href="tel:${f.phone}" style="flex:1;text-align:center;padding:6px;background:#2e7d32;color:white;border-radius:6px;text-decoration:none;font-weight:700;font-size:11px;">📞 Call</a>
              <a href="sms:${f.phone}" style="flex:1;text-align:center;padding:6px;background:white;border:1.5px solid #2e7d32;color:#2e7d32;border-radius:6px;text-decoration:none;font-weight:700;font-size:11px;">✉️ SMS</a>
            </div>
          </div>
        </div>
      `;

      const info = new g.InfoWindow({ content: popupContent });
      marker.addListener('click', () => {
        info.open(map, marker);
        onFarmClick?.(f);
      });
      markersRef.current.push(marker);
    });
  }

  return (
    <div
      ref={ref}
      className="w-full h-[600px] rounded-2xl overflow-hidden border border-[#1e3623] relative"
      style={{ background: '#0a120c' }}
    />
  );
}
