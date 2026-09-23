import { useEffect, useState } from 'react';

export interface LiveSensor {
  hub_id: number;
  soil_15: number;
  soil_30: number;
  soil_60: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  battery_v: number;
  solar_v: number;
  signal_dbm: number;
  timestamp: string;
}

export function useLiveFarmData() {
  const [hubs, setHubs] = useState<Record<number, LiveSensor>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource('/api/live/stream');

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'snapshot' || data.type === 'update') {
          const map: Record<number, LiveSensor> = {};
          for (const h of data.hubs) map[h.hub_id] = h;
          setHubs(map);
          setLastUpdate(new Date());
        }
      } catch {}
    };

    return () => es.close();
  }, []);

  return { hubs, lastUpdate, connected };
}
