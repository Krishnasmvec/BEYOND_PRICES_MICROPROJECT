import React from 'react';
import { Truck, Users, HelpCircle, Car, Info } from 'lucide-react';
import type { TransportPreference, OwnVehicleInfo } from '../../../shared/types.ts';

interface TransportPreferenceStepProps {
  preference: TransportPreference;
  ownVehicle: OwnVehicleInfo;
  onPreferenceChange: (p: TransportPreference) => void;
  onVehicleChange: (v: OwnVehicleInfo) => void;
}

const OPTIONS: {
  value: TransportPreference;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'own',
    label: 'Own vehicle',
    description: 'You will transport using your own vehicle.',
    icon: Car,
  },
  {
    value: 'shared',
    label: 'Shared transport',
    description: 'You plan to share transport with other farmers.',
    icon: Users,
  },
  {
    value: 'need',
    label: 'Need transport',
    description: 'You are looking for transport options near you.',
    icon: Truck,
  },
  {
    value: 'undecided',
    label: 'Not decided',
    description: 'You have not yet decided on transport.',
    icon: HelpCircle,
  },
];

const VEHICLE_TYPES = ['Two-wheeler', 'Mini truck', 'Pickup truck', 'Tractor-trailer', 'Large truck', 'Other'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];

const TransportPreferenceStep: React.FC<TransportPreferenceStepProps> = ({
  preference,
  ownVehicle,
  onPreferenceChange,
  onVehicleChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = preference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPreferenceChange(opt.value)}
              className={`border text-left px-5 py-5 rounded-xl transition-all group relative overflow-hidden ${
                active
                  ? 'border-agri-600 bg-agri-50 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-agri-300 hover:bg-agri-50/50 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                active ? 'bg-agri-600 text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-agri-100 group-hover:text-agri-700'
              }`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </div>
              <p className={`text-sm font-bold mb-1 transition-colors ${
                active ? 'text-agri-900' : 'text-neutral-800 group-hover:text-neutral-900'
              }`}>
                {opt.label}
              </p>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">{opt.description}</p>
              
              {active && (
                <div className="absolute top-0 right-0 w-2 h-full bg-agri-600"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Own vehicle details — UI-only, no DB persistence */}
      <div className={`transition-all overflow-hidden duration-300 ${
        preference === 'own' ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'
      }`}>
        <div className="border border-neutral-200 bg-white p-6 md:p-8 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h4 className="font-bold text-base text-neutral-900">Vehicle Details</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-neutral-100 text-neutral-500 rounded">Optional Reference</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="field-label block mb-2" htmlFor="vehicle-type">Vehicle type</label>
              <div className="relative shadow-sm rounded-md">
                <select
                  id="vehicle-type"
                  value={ownVehicle.vehicleType ?? ''}
                  onChange={(e) => onVehicleChange({ ...ownVehicle, vehicleType: e.target.value || undefined })}
                  className="field-input py-3 text-base w-full appearance-none pr-10"
                >
                  <option value="">Select...</option>
                  {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-neutral-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="field-label block mb-2" htmlFor="fuel-type">Fuel type</label>
              <div className="relative shadow-sm rounded-md">
                <select
                  id="fuel-type"
                  value={ownVehicle.fuelType ?? ''}
                  onChange={(e) => onVehicleChange({ ...ownVehicle, fuelType: e.target.value || undefined })}
                  className="field-input py-3 text-base w-full appearance-none pr-10"
                >
                  <option value="">Select...</option>
                  {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-neutral-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <Info size={16} className="text-neutral-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-neutral-500 leading-relaxed">
              Vehicle details are collected for your reference only. Transport costs shown in the 
              market analysis come directly from the regional logistics database.
            </p>
          </div>
        </div>
      </div>

      {/* Shared / Need transport context */}
      <div className={`transition-all overflow-hidden duration-300 ${
        (preference === 'shared' || preference === 'need') ? 'max-h-40 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'
      }`}>
        <div className="border border-agri-100 bg-agri-50 p-5 rounded-lg flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-agri-200 text-agri-800 flex items-center justify-center flex-shrink-0">
            <Info size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-agri-900 mb-1">Transport Pool Access</p>
            <p className="text-xs font-medium text-agri-800/70 leading-relaxed">
              Available transport pool entries for the recommended markets will be shown in the results. 
              The database currently tracks vehicle availability status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportPreferenceStep;
