import React from 'react';
import { Thermometer, Droplets, CloudRain, Wind, AlertTriangle } from 'lucide-react';
import { MarketWeather } from '../types';
import { formatRelativeTime } from '../lib/format';

interface MarketWeatherSnapshotProps {
  weather: MarketWeather;
}

// Real values only — the caller (ConsumerDashboard) simply doesn't render
// this component when weather is null, so every field reaching here comes
// straight from the `weather` table. Individual stat tiles are still
// skipped one-by-one when their own value is null (a row can have a
// condition but no rainfall reading, etc.) rather than showing a fabricated
// placeholder.
const NORMAL_ALERT_LEVELS = new Set(['normal', 'low', 'none', 'clear', 'safe']);

const MarketWeatherSnapshot: React.FC<MarketWeatherSnapshotProps> = ({ weather }) => {
  const hasAlert = weather.alertLevel && !NORMAL_ALERT_LEVELS.has(weather.alertLevel.trim().toLowerCase());

  const stats: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (weather.temperature !== null) stats.push({ icon: <Thermometer size={14} />, label: 'Temp', value: `${weather.temperature}°C` });
  if (weather.humidity !== null) stats.push({ icon: <Droplets size={14} />, label: 'Humidity', value: `${weather.humidity}%` });
  if (weather.rainfall !== null) stats.push({ icon: <CloudRain size={14} />, label: 'Rainfall', value: `${weather.rainfall} mm` });
  if (weather.windSpeed !== null) stats.push({ icon: <Wind size={14} />, label: 'Wind', value: `${weather.windSpeed} km/h` });

  if (stats.length === 0 && !weather.weatherCondition && !hasAlert) return null;

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="mono-label text-neutral-400">Local Weather</span>
        {weather.updatedAt && (
          <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">Updated {formatRelativeTime(weather.updatedAt)}</span>
        )}
      </div>

      {weather.weatherCondition && (
        <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">{weather.weatherCondition}</p>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 text-neutral-500">
              {stat.icon}
              <div>
                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xs font-black text-neutral-900 number-tabular">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasAlert && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-2 rounded-full w-fit">
          <AlertTriangle size={12} />
          <span className="text-[9px] font-black uppercase tracking-widest">{weather.alertLevel}</span>
        </div>
      )}
    </div>
  );
};

export default MarketWeatherSnapshot;
