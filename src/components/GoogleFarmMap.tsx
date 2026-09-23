import { useEffect, useRef } from 'react';
import type { Farm, SensorHub } from '../types';

const GOOGLE_MAPS_KEY = 'AIzaSyD6u5Uwcfn-wUUEMVSp0wP4kS6s5NZl-L8';

const COLORS = { healthy: '#22c55e', watch: '#f59e0b', alert: '#ef4444' };

declare global {
  interface Window {
    google: any;
    __msInitGoogleMap?: () => void;
  }
}

interface Props {
  farms: Farm[];
  hubs: (SensorHub & { live?: any })[];
  onFarmClick?: (farm: Farm) => void;
  tickCount?: number;
}

export function GoogleFarmMap({ farms, hubs, onFarmClick, tickCount = 0 }: Props) {
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
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry&callback=__msInitGoogleMap`;
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
      center: { lat: -14.5, lng: 30.5 },
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

  // Redraw on updates
  useEffect(() => {
    if (mapRef.current) drawAll();
    // eslint-disable-next-line
  }, [farms, hubs, tickCount]);

  function drawAll() {
    const map = mapRef.current;
    const g = window.google?.maps;
    if (!map || !g) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap?.(null));
    boundariesRef.current.forEach((b) => b.setMap?.(null));
    markersRef.current = [];
    boundariesRef.current = [];

    // Hubs with live sensor data
    hubs.forEach((h) => {
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

    // Farm markers
    farms.forEach((f) => {
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
