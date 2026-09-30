import React, { useState } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import { reverseGeocode } from '../../lib/api';

interface FarmLocationStepProps {
  location: string;
  onChange: (location: string) => void;
}

const FarmLocationStep: React.FC<FarmLocationStepProps> = ({ location, onChange }) => {
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      setDetectError('Geolocation is not supported by your browser. Enter your location manually.');
      return;
    }
    setDetecting(true);
    setDetectError(null);
    setDetected(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { location: resolved } = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          onChange(resolved);
          setDetected(true);
        } catch {
          setDetectError('Could not resolve your coordinates to a location name. Enter manually.');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setDetectError('Location access denied. Enter your location manually below.');
        } else {
          setDetectError('Location detection failed. Enter your location manually below.');
        }
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Auto detect */}
      <button
        type="button"
        onClick={detectLocation}
        disabled={detecting}
        className={`w-full border-2 border-dashed rounded-xl py-10 px-6 flex flex-col items-center gap-4 transition-all group ${
          detected
            ? 'border-agri-600 bg-agri-50/50 shadow-sm'
            : detectError
            ? 'border-red-200 bg-red-50'
            : 'border-neutral-200 hover:border-agri-300 hover:bg-agri-50/30'
        }`}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm ${
          detected ? 'bg-agri-600 text-white' : 'bg-white border border-neutral-100 text-neutral-400 group-hover:text-agri-600 group-hover:border-agri-200'
        }`}>
          {detecting ? (
            <Loader2 size={24} className="animate-spin text-agri-600" />
          ) : detected ? (
            <CheckCircle size={24} />
          ) : (
            <Navigation size={24} />
          )}
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold tracking-wide ${
            detected ? 'text-agri-800' : detectError ? 'text-red-600' : 'text-neutral-800'
          }`}>
            {detecting
              ? 'Detecting location...'
              : detected
              ? 'Location detected successfully'
              : 'Use my current location'}
          </p>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {detected ? 'We found your coordinates' : 'Requires browser location permission'}
          </p>
        </div>
      </button>

      {/* Detect error */}
      {detectError && (
        <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-lg text-red-800 text-sm font-medium animate-slide-in">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
          {detectError}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="h-px bg-neutral-200 flex-1"></div>
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">OR</span>
        <div className="h-px bg-neutral-200 flex-1"></div>
      </div>

      {/* Manual input */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 shadow-sm">
        <label className="field-label block mb-2" htmlFor="farm-location-input">
          Search location manually
        </label>
        <div className="relative shadow-sm rounded-md overflow-hidden">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="farm-location-input"
            type="text"
            value={location}
            onChange={(e) => { onChange(e.target.value); setDetected(false); }}
            placeholder="e.g. Villianur, Pondicherry"
            className="field-input pl-11 py-3.5 text-base w-full border-neutral-300 focus:border-agri-500 focus:ring-agri-500"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-neutral-500 mt-3 font-medium">
          Enter the district or area closest to your farm. This is used to calculate logistics and weather impact.
        </p>

        {/* Confirmed location display */}
        {location.trim() && (
          <div className="mt-6 flex items-center gap-4 px-5 py-4 bg-agri-50 border border-agri-100 rounded-lg animate-slide-in">
            <div className="w-8 h-8 rounded-full bg-agri-200 flex items-center justify-center flex-shrink-0 text-agri-800">
              <MapPin size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-agri-600 mb-0.5">Active Location</p>
              <p className="text-base font-bold text-neutral-900">{location}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmLocationStep;
