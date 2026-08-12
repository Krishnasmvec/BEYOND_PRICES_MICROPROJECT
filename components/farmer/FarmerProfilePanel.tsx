import React, { useEffect, useState } from 'react';
import { User, MapPin, Phone, Clock, LogOut } from 'lucide-react';
import { fetchMe, fetchMyAnalyses, logoutRequest } from '../../lib/api';
import type { FarmerProfile, SavedAnalysis } from '../../types';

interface FarmerProfilePanelProps {
  onClose?: () => void;
}

const FarmerProfilePanel: React.FC<FarmerProfilePanelProps> = ({ onClose }) => {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(({ farmer }) => {
        setFarmer(farmer);
        return fetchMyAnalyses();
      })
      .then(setAnalyses)
      .catch(() => {/* not authenticated */})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutRequest();
      setFarmer(null);
      setAnalyses([]);
    } catch {
      /* ignore */
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200">
          <User size={24} className="text-neutral-400" />
        </div>
        <p className="text-base font-black text-neutral-800 mb-2">Not signed in</p>
        <p className="text-sm font-medium text-neutral-500 leading-relaxed max-w-xs mx-auto">
          Sign in during stall booking to save analyses and access them across devices.
        </p>
      </div>
    );
  }

  const initials = farmer.name
    ? farmer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {/* Top identity bar */}
        <div className="px-6 sm:px-8 py-6 bg-gradient-to-br from-neutral-50 to-white border-b border-neutral-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-agri-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md">
              {initials}
            </div>
            <div>
              <p className="font-black text-lg text-neutral-900 leading-tight">{farmer.name}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mt-0.5">Farmer Profile</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-rose-600 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <LogOut size={13} /> {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>

        {/* Info rows */}
        <div className="px-6 sm:px-8 py-5 space-y-4">
          <ProfileRow icon={<Phone size={14} />} label="Phone" value={farmer.phone} />
          {farmer.village && (
            <ProfileRow icon={<MapPin size={14} />} label="Village" value={farmer.village} />
          )}
          {farmer.district && (
            <ProfileRow icon={<MapPin size={14} />} label="District" value={farmer.district} />
          )}
          {farmer.createdAt && (
            <ProfileRow
              icon={<Clock size={14} />}
              label="Member since"
              value={new Date(farmer.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            />
          )}
        </div>
      </div>

      {/* Recent analyses */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-neutral-100">
          <h4 className="font-bold text-base text-neutral-900">Recent Analyses</h4>
        </div>
        {analyses.length === 0 ? (
          <div className="px-6 sm:px-8 py-10 text-center">
            <p className="text-sm font-medium text-neutral-400">No saved analyses yet.</p>
            <p className="text-xs text-neutral-300 mt-1">Run an analysis and save it to track your history here.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {analyses.slice(0, 5).map((a) => (
              <div key={a.id} className="px-6 sm:px-8 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 truncate">{a.topMarketName}</p>
                  <p className="text-xs font-medium text-neutral-500 mt-0.5 truncate">
                    {a.input.products.slice(0, 2).map((p) => p.productName).join(', ')}
                    {a.input.products.length > 2 ? ` +${a.input.products.length - 2} more` : ''}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-300 mt-0.5">
                    {new Date(a.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-agri-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {a.topScore}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 text-neutral-500 mt-0.5">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="text-sm font-bold text-neutral-900 mt-0.5 truncate">{value}</p>
    </div>
  </div>
);

export default FarmerProfilePanel;


