import React, { useEffect, useState } from 'react';
import { Thermometer, Droplets, Wind, Cloud, AlertTriangle, RefreshCw, CloudSun } from 'lucide-react';
import { fetchClimateSummary } from '../../lib/api';
import type { MarketWeather } from '../../types';

interface ClimateSummaryPanelProps {
  location: string;
}

const ClimateSummaryPanel: React.FC<ClimateSummaryPanelProps> = ({ location }) => {
  const [weather, setWeather] = useState<MarketWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchClimateSummary(location);
      setWeather(res.weather);
    } catch {
      setError('Climate data unavailable for this location.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (!location.trim()) {
    return (
      <div className="py-14 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100">
          <CloudSun size={20} className="text-neutral-300" />
        </div>
        <p className="text-sm font-medium text-neutral-500">Enter your farm location above</p>
        <p className="text-xs text-neutral-400 mt-1">We need it to load regional climate data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-neutral-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-agri-50 text-agri-600 flex items-center justify-center flex-shrink-0 border border-agri-100">
            <CloudSun size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-900 leading-tight">Climate Conditions</h3>
            <p className="text-xs font-medium text-neutral-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agri-500"></span>
              {location}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-neutral-100 text-neutral-500 rounded border border-neutral-200">
            Reference Data
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-agri-600 hover:bg-agri-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-agri-500"
            aria-label="Refresh climate data"
            title="Refresh climate data"
          >
            <RefreshCw size={14} strokeWidth={2.5} className={loading ? 'animate-spin text-agri-500' : ''} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-600 text-sm font-medium animate-slide-in">
          <Cloud size={20} className="text-neutral-400 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !weather && (
        <div className="px-5 py-6 text-center bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-500 font-medium">
          Weather data is currently unavailable for this district.
        </div>
      )}

      {!loading && weather && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <ClimateCell
              icon={<Thermometer size={16} />}
              label="Temperature"
              value={weather.temperature != null ? `${weather.temperature}°C` : null}
            />
            <ClimateCell
              icon={<Droplets size={16} />}
              label="Humidity"
              value={weather.humidity != null ? `${weather.humidity}%` : null}
            />
            <ClimateCell
              icon={<Cloud size={16} />}
              label="Rainfall"
              value={weather.rainfall != null ? `${weather.rainfall} mm` : null}
            />
            <ClimateCell
              icon={<Wind size={16} />}
              label="Wind speed"
              value={weather.windSpeed != null ? `${weather.windSpeed} km/h` : null}
            />
            <ClimateCell
              icon={<CloudSun size={16} />}
              label="Condition"
              value={weather.weatherCondition ?? null}
            />
            <ClimateCell
              icon={<AlertTriangle size={16} />}
              label="Alert level"
              value={weather.alertLevel ?? null}
              alert={!!weather.alertLevel && weather.alertLevel.toLowerCase() !== 'none' && weather.alertLevel.toLowerCase() !== 'low'}
            />
          </div>

          {weather.updatedAt && (
            <div className="flex justify-end border-t border-neutral-100 pt-4 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <RefreshCw size={10} />
                Last updated: {new Date(weather.updatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ClimateCell: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | null;
  alert?: boolean;
}> = ({ icon, label, value, alert }) => (
  <div className={`p-4 rounded-lg border transition-colors ${
    alert 
      ? 'border-amber-200 bg-amber-50/80 shadow-sm' 
      : 'border-neutral-100 bg-neutral-50 hover:bg-neutral-100/50 hover:border-neutral-200'
  }`}>
    <div className={`flex items-center gap-2 mb-2 ${alert ? 'text-amber-600' : 'text-neutral-500'}`}>
      <span className={alert ? 'text-amber-500' : 'text-neutral-400'}>{icon}</span>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${alert ? 'text-amber-700/70' : 'text-neutral-500'}`}>{label}</span>
    </div>
    {value != null ? (
      <p className={`text-lg font-black tracking-tight ${alert ? 'text-amber-700' : 'text-neutral-900'}`}>{value}</p>
    ) : (
      <p className="text-xs font-medium text-neutral-400">Data unavailable</p>
    )}
  </div>
);

export default ClimateSummaryPanel;
