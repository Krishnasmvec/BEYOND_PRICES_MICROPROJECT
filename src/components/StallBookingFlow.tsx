import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  ChevronRight,
  Calendar,
  MapPin,
  Info,
  Timer
} from 'lucide-react';
import { fetchStalls, createBooking, fetchMe } from '../lib/api';
import { formatINR } from '../lib/format';
import OtpLoginFlow from './OtpLoginFlow';
import { MarketStall, StallBooking, PredictionResult, UserInput, MarketNode, FarmerProfile } from '../../shared/types.ts';

interface StallBookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  predictionData: PredictionResult;
  userInput: UserInput;
  preLoadedMarketId?: string | null;
  preLoadedOccupancy?: { available: number; total: number; rate: number };
}

const StallBookingFlow: React.FC<StallBookingFlowProps> = ({
  isOpen,
  onClose,
  predictionData,
  userInput,
  preLoadedMarketId,
  preLoadedOccupancy
}) => {
  const [step, setStep] = useState<'auth' | 'scan' | 'selection' | 'form' | 'confirmation'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stalls, setStalls] = useState<MarketStall[]>([]);
  const [selectedStall, setSelectedStall] = useState<MarketStall | null>(null);
  const [booking, setBooking] = useState<StallBooking | null>(null);
  const [marketId, setMarketId] = useState<string | null>(preLoadedMarketId || null);
  const [occupancy, setOccupancy] = useState(preLoadedOccupancy?.rate || 0);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCheckingAuth(true);

    fetchMe()
      .then(({ farmer }) => {
        setFarmer(farmer);
        proceedAfterAuth();
      })
      .catch(() => {
        setStep('auth');
      })
      .finally(() => setCheckingAuth(false));
  }, [isOpen]);

  const proceedAfterAuth = () => {
    if (preLoadedMarketId) {
      setMarketId(preLoadedMarketId);
      setOccupancy(preLoadedOccupancy?.rate ?? 0);
      loadStalls(preLoadedMarketId);
    } else {
      setError('No market selected yet.');
      setStep('selection');
    }
  };

  const handleAuthSuccess = (authedFarmer: FarmerProfile) => {
    setFarmer(authedFarmer);
    proceedAfterAuth();
  };

  const loadStalls = async (mId: string) => {
    setStep('scan');
    setLoading(true);
    setError(null);
    try {
      const available = await fetchStalls(mId, 'available');
      setStalls(available);
      setStep('selection');
    } catch (err: any) {
      setError('Market synchronization failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookStall = async () => {
    if (!selectedStall || !marketId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await createBooking({
        marketId,
        stallId: selectedStall.id,
        cropType: userInput.cropType,
        quantity: userInput.quantity,
      });
      setBooking(result);
      setStep('confirmation');
    } catch (err: any) {
      // A 409 here means someone else claimed this stall first — refresh the list.
      setError(err.message || 'Booking failed. The stall may have just been taken.');
      if (marketId) loadStalls(marketId);
      setStep('selection');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-agri-600 text-white flex items-center justify-center rounded shadow-md">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-xl font-display font-black uppercase tracking-tight text-neutral-900">
                Market Stall Reservation
              </h3>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                {predictionData.best_market} • Secure your spot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {checkingAuth && (
            <div className="py-20 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!checkingAuth && step === 'auth' && (
            <OtpLoginFlow onSuccess={handleAuthSuccess} />
          )}

          {!checkingAuth && step === 'scan' && (
            <div className="py-20 flex flex-col items-center justify-center gap-6 animate-pulse">
              <div className="w-16 h-16 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center space-y-2">
                <h4 className="text-xl font-display font-black uppercase tracking-tight text-neutral-900">Synchronizing Market Grid</h4>
                <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest leading-relaxed">
                  Querying real-time stall availability for {predictionData.best_market}...
                </p>
              </div>
            </div>
          )}

          {step === 'selection' && (
            <div className="space-y-8 animate-slide-up">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-agri-50 border border-agri-100 space-y-2">
                  <p className="mono-label text-agri-600 text-[10px] uppercase tracking-widest">Recommended Arrival</p>
                  <p className="text-2xl font-black text-agri-900">{predictionData.logistics.estimated_arrival}</p>
                </div>
                <div className="p-6 bg-neutral-50 border border-neutral-200 space-y-2">
                  <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Current Occupancy</p>
                  <p className="text-2xl font-black text-neutral-900">{occupancy}%</p>
                </div>
                <div className="p-6 bg-neutral-50 border border-neutral-200 space-y-2">
                  <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Available Stalls</p>
                  <p className="text-2xl font-black text-neutral-900">{stalls.length}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <Info size={14} /> Select an Available Stall
                </h4>

                {error ? (
                  <div className="p-12 border border-red-100 bg-red-50 text-center space-y-4">
                    <AlertCircle size={40} className="mx-auto text-red-600" />
                    <p className="text-red-600 font-bold">{error}</p>
                    <button
                      onClick={() => marketId && loadStalls(marketId)}
                      className="px-6 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest"
                    >
                      Retry
                    </button>
                  </div>
                ) : stalls.length === 0 ? (
                  <div className="p-12 border border-neutral-200 bg-neutral-50 text-center space-y-4">
                    <Store size={40} className="mx-auto text-neutral-300" />
                    <p className="text-neutral-500 font-bold uppercase text-xs">No stalls available for the selected criteria.</p>
                  </div>
                ) : (
                  <div className="border border-neutral-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest">
                          <th className="p-4">Stall ID</th>
                          <th className="p-4">Slot</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Daily Fee</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {stalls.map((stall) => (
                          <tr
                            key={stall.id}
                            className={`hover:bg-neutral-50 transition-colors cursor-pointer ${selectedStall?.id === stall.id ? 'bg-agri-50' : ''}`}
                            onClick={() => setSelectedStall(stall)}
                          >
                            <td className="p-4 font-mono text-sm font-bold text-neutral-900">{stall.number}</td>
                            <td className="p-4 font-bold text-agri-600 text-xs">{stall.slotTime.start} – {stall.slotTime.end}</td>
                            <td className="p-4 text-[11px] font-bold text-neutral-500 uppercase">{stall.type}</td>
                            <td className="p-4 font-black text-neutral-900">{formatINR(stall.pricePerDay)}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedStall(stall);
                                  setStep('form');
                                }}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                  selectedStall?.id === stall.id
                                    ? 'bg-agri-600 text-white'
                                    : 'border border-neutral-200 text-neutral-400 hover:border-neutral-900 hover:text-neutral-900'
                                }`}
                              >
                                {selectedStall?.id === stall.id ? 'Selected' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'form' && selectedStall && (
            <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-neutral-50 border border-neutral-200 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">Farmer Details (Verified)</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Farmer Name</p>
                      <p className="font-black text-neutral-900">{farmer?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Phone</p>
                      <p className="font-black text-neutral-900">+91 {farmer?.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Village</p>
                      <p className="font-black text-neutral-900">{farmer?.village}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-agri-50 border border-agri-100 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-agri-600">Booking Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-neutral-400">Crop Type</label>
                      <p className="w-full bg-white border border-agri-200 p-2 text-sm font-bold text-neutral-900">{userInput.cropType}</p>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-neutral-400">Quantity ({userInput.quantityUnit})</label>
                      <p className="w-full bg-white border border-agri-200 p-2 text-sm font-bold text-neutral-900">{userInput.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border border-neutral-200 bg-white space-y-6 shadow-sm">
                <h4 className="text-lg font-black uppercase tracking-tight border-b border-neutral-200 pb-4">
                  Final Reservation Summary
                </h4>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Market Node</p>
                    <p className="font-bold text-neutral-900">{predictionData.best_market}</p>
                  </div>
                   <div className="space-y-1">
                    <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Stall & Slot</p>
                    <p className="font-bold text-neutral-900">#{selectedStall.number} | {selectedStall.slotTime.start}–{selectedStall.slotTime.end}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Daily Fee</p>
                    <p className="text-xl font-black text-agri-600">{formatINR(selectedStall.pricePerDay)}</p>
                  </div>
                   <div className="space-y-1">
                    <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Security Deposit</p>
                    <p className="font-bold text-neutral-900">₹0 (Zero for Demo)</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-bold uppercase">
                  {error}
                </div>
              )}

              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 flex gap-4">
                <AlertCircle className="text-amber-600 shrink-0" size={24} />
                <p className="text-xs font-bold text-amber-800 uppercase leading-relaxed">
                  By confirming, you agree to arrive at the market by {selectedStall.slotTime.start}.
                  Unclaimed stalls may be released after 2 hours of scheduled arrival.
                </p>
              </div>
            </div>
          )}

          {step === 'confirmation' && booking && (
            <div className="py-12 text-center space-y-8 animate-slide-up">
              <div className="w-24 h-24 bg-agri-100 text-agri-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-display font-black uppercase tracking-tight text-neutral-900">
                  Booking Confirmed
                </h3>
                <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Reservation ID: {booking.id}</p>
              </div>

              <div className="max-w-md mx-auto p-8 border border-neutral-200 bg-white shadow-lg space-y-6">
                <div className="flex items-center justify-center gap-2 text-agri-600 font-black uppercase text-xs tracking-widest">
                  <Calendar size={14} /> {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="grid grid-cols-2 divide-x divide-neutral-100">
                  <div className="px-4 space-y-1">
                    <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Stall</p>
                    <p className="text-4xl font-black text-neutral-900">{selectedStall?.number}</p>
                  </div>
                  <div className="px-4 space-y-1">
                    <p className="mono-label text-neutral-400 text-[10px] uppercase tracking-widest">Arrival Window</p>
                    <p className="text-xl font-black text-agri-600">
                      {(() => {
                        const start = booking.slotTime.start;
                        const [h, m] = start.split(':').map(Number);
                        const d = new Date(); d.setHours(h); d.setMinutes(m);
                        const winStart = new Date(d.getTime() - 15 * 60000);
                        const winEnd = new Date(d.getTime() + 15 * 60000);
                        return `${winStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${winEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t border-neutral-100 flex items-center justify-center gap-2 text-neutral-500 font-bold uppercase text-[10px] tracking-widest">
                  <MapPin size={12} /> Sector B, Main Mandi Gate
                </div>
              </div>

              <p className="text-xs font-bold text-neutral-500 uppercase max-w-sm mx-auto leading-relaxed">
                This reservation is saved on the server and will be visible under "My Records" for this device.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-between items-center">
          {(step === 'scan' || step === 'selection') && (
            <>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                {step === 'scan' ? 'Synchronizing Archive...' : 'Step 1 of 2: Select Stall'}
              </p>
              <button
                disabled={step === 'scan' || !selectedStall}
                onClick={() => setStep('form')}
                className={`px-10 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${
                  !loading && selectedStall
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                Continue to Booking <ChevronRight size={16} />
              </button>
            </>
          )}

          {step === 'form' && (
            <>
              <button
                onClick={() => setStep('selection')}
                className="px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Back
              </button>
              <button
                disabled={loading}
                onClick={handleBookStall}
                className="bg-agri-600 text-white px-12 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-agri-700 shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Reservation'} <CheckCircle2 size={16} />
              </button>
            </>
          )}

          {step === 'confirmation' && (
            <button
              onClick={onClose}
              className="w-full bg-neutral-900 text-white py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StallBookingFlow;
