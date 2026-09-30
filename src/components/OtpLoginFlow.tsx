import React, { useState } from 'react';
import { Phone, ShieldCheck, Loader2, ChevronRight, User, MapPin } from 'lucide-react';
import { requestOtp, verifyOtp, updateProfile } from '../lib/api';
import { FarmerProfile } from '../../shared/types.ts';

interface OtpLoginFlowProps {
  onSuccess: (farmer: FarmerProfile) => void;
}

const OtpLoginFlow: React.FC<OtpLoginFlowProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [requestId, setRequestId] = useState('');
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    setError(null);
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const { requestId } = await requestOtp(phone);
      setRequestId(requestId);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Could not send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { farmer } = await verifyOtp(requestId, code);
      setFarmer(farmer);
      if (!farmer.name || !farmer.village) {
        setStep('profile');
      } else {
        onSuccess(farmer);
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    setError(null);
    if (!name.trim() || !village.trim()) {
      setError('Name and village are required.');
      return;
    }
    setLoading(true);
    try {
      const { farmer: updated } = await updateProfile({ name: name.trim(), village: village.trim() });
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Could not save your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-agri-100 text-agri-600 rounded-full flex items-center justify-center mx-auto">
          {step === 'phone' && <Phone size={28} />}
          {step === 'otp' && <ShieldCheck size={28} />}
          {step === 'profile' && <User size={28} />}
        </div>
        <h3 className="text-xl font-display font-black uppercase tracking-tight">
          {step === 'phone' && 'Verify Your Number'}
          {step === 'otp' && 'Enter the Code'}
          {step === 'profile' && 'Complete Your Profile'}
        </h3>
        <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">
          {step === 'phone' && 'Required to reserve a real market stall'}
          {step === 'otp' && `Code sent to ${phone}`}
          {step === 'profile' && 'So markets know who is arriving'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-bold uppercase">{error}</div>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full px-6 py-5 bg-neutral-50 border border-neutral-200 text-lg font-black outline-none focus:border-agri-600 text-center tracking-widest"
          />
          <button
            onClick={handleRequestOtp}
            disabled={loading}
            className="w-full py-5 bg-agri-900 text-white font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Send Code <ChevronRight size={18} /></>}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-6 py-5 bg-neutral-50 border border-neutral-200 text-lg font-black outline-none focus:border-agri-600 text-center tracking-[0.5em]"
          />
          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full py-5 bg-agri-900 text-white font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Verify <ChevronRight size={18} /></>}
          </button>
          <button onClick={() => setStep('phone')} className="w-full text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-900">
            Change number
          </button>
        </div>
      )}

      {step === 'profile' && (
        <div className="space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-neutral-200 font-bold outline-none focus:border-agri-600"
            />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
            <input
              type="text"
              placeholder="Village / Town"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-neutral-200 font-bold outline-none focus:border-agri-600"
            />
          </div>
          <button
            onClick={handleCompleteProfile}
            disabled={loading}
            className="w-full py-5 bg-agri-600 text-white font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-agri-700 transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Continue <ChevronRight size={18} /></>}
          </button>
        </div>
      )}
    </div>
  );
};

export default OtpLoginFlow;
