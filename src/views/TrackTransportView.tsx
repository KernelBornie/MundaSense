import React, { useEffect, useState, useRef } from 'react';
import { Truck, MapPin, Clock, Phone, Gauge } from 'lucide-react';

const GOOGLE_MAPS_KEY = 'AIzaSyD6u5Uwcfn-wUUEMVSp0wP4kS6s5NZl-L8';

declare global {
  interface Window {
    __msInitTrackingMap?: () => void;
  }
}

interface TrackPoint {
  lat: number;
  lng: number;
  speed_kmh: number;
  timestamp: string;
}

export function TrackTransportView({ requestId = 42 }: { requestId?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const truckRef = useRef<any>(null);
  const pathRef = useRef<any>(null);
  const [data, setData] = useState<any>(null);

  // Poll tracking endpoint every 10s
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/transport/${requestId}/track`);
        if (r.ok && isMounted) {
          const d = await r.json();
          setData(d);
        }
      } catch (err) {
        console.warn('Transport track fetch error:', err);
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => {
      isMounted = false;
      clearInterval(t);
    };
  }, [requestId]);

  // Init map
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const init = () => {
      if (!ref.current || mapRef.current || !window.google?.maps) return;
      mapRef.current = new window.google.maps.Map(ref.current, {
        center: { lat: -14.5, lng: 30.5 },
        zoom: 7,
        mapTypeId: 'hybrid',
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControl: true,
      });
    };
    if (window.google?.maps) {
      init();
    } else {
      window.__msInitTrackingMap = init;
      if (!document.querySelector('script[data-ms-track]')) {
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=__msInitTrackingMap`;
        s.async = true;
        s.defer = true;
        s.dataset.msTrack = '1';
        document.head.appendChild(s);
      }
    }
  }, []);

  // Draw route
  useEffect(() => {
    const map = mapRef.current;
    const g = window.google?.maps;
    if (!map || !g || !data?.points?.length) return;

    const points = data.points;
    const path = points.map((p: TrackPoint) => ({ lat: p.lat, lng: p.lng }));

    if (pathRef.current) pathRef.current.setMap(null);
    pathRef.current = new g.Polyline({
      path,
      strokeColor: '#10b981',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      map,
    });

    // Origin + destination markers
    const origin = path[0];
    const dest = path[path.length - 1];
    new g.Marker({
      map,
      position: origin,
      icon: {
        path: g.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#22c55e',
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      title: 'Origin (Msekera Depot)',
    });
    new g.Marker({
      map,
      position: dest,
      icon: {
        path: g.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#f59e0b',
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      title: 'Destination (Lusaka Mill)',
    });

    // Live truck marker
    const latest = points[points.length - 1];
    if (!truckRef.current) {
      truckRef.current = new g.Marker({
        map,
        position: { lat: latest.lat, lng: latest.lng },
        icon: {
          url:
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
              <circle cx="24" cy="24" r="22" fill="#10b981" stroke="#fff" stroke-width="3"/>
              <text x="24" y="33" text-anchor="middle" font-size="26">🚚</text>
            </svg>`),
          scaledSize: new g.Size(48, 48),
          anchor: new g.Point(24, 24),
        },
        zIndex: 999,
      });
    } else {
      truckRef.current.setPosition({ lat: latest.lat, lng: latest.lng });
    }

    const bounds = new g.LatLngBounds();
    path.forEach((pt: { lat: number; lng: number }) => bounds.extend(pt));
    map.fitBounds(bounds);
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Transport Tracking</h2>
              <p className="text-xs text-gray-400">
                Request TR-{requestId} · ZamCargo Logistics · 3.5t Canter (Great East Road)
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Distance Remaining" value={`${data.distance_remaining_km} km`} icon={<MapPin className="w-4 h-4" />} />
          <Stat label="ETA" value={`${data.eta_hours} h`} icon={<Clock className="w-4 h-4" />} />
          <Stat label="Current Speed" value={`${data.latest?.speed_kmh || 0} km/h`} icon={<Gauge className="w-4 h-4" />} />
          <Stat label="Status" value={String(data.status).replace('_', ' ')} icon={<Truck className="w-4 h-4" />} highlight />
        </div>
      )}

      <div ref={ref} className="w-full h-[520px] rounded-2xl overflow-hidden border border-[#1e3623] bg-[#0a120c]" />

      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-400" /> Dispatch & Driver Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <a
            href="tel:+260970000005"
            className="p-3 bg-[#142318] border border-[#233f28] rounded-xl flex items-center gap-2 text-emerald-300 hover:bg-[#1a2d1f] transition"
          >
            📞 ZamCargo Driver (+260970000005)
          </a>
          <a
            href="tel:+260970000003"
            className="p-3 bg-[#142318] border border-[#233f28] rounded-xl flex items-center gap-2 text-emerald-300 hover:bg-[#1a2d1f] transition"
          >
            📞 Buyer / Milling Manager (+260970000003)
          </a>
        </div>
      </div>

      {data && (
        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-2">Position Telemetry Log ({data.points.length} points)</h3>
          <div className="max-h-48 overflow-y-auto text-[11px] font-mono space-y-1">
            {data.points
              .slice(-20)
              .reverse()
              .map((p: TrackPoint, i: number) => (
                <div key={i} className="flex justify-between border-b border-[#1a2d1f] py-1">
                  <span>
                    {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                  </span>
                  <span className="text-gray-500">
                    {p.speed_kmh} km/h · {new Date(p.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`bg-[#101b13] border rounded-xl p-3.5 ${highlight ? 'border-emerald-700' : 'border-[#1e3623]'}`}>
      <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
        <span>{label}</span>
        <span className="text-emerald-400">{icon}</span>
      </div>
      <div className="text-xl font-black text-white capitalize">{value}</div>
    </div>
  );
}
