
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, X, MessageSquare, Loader2 } from 'lucide-react';
import { PredictionResult } from '../../shared/types.ts';

interface VoiceAdvisorProps {
  data: PredictionResult;
}

// Helper functions for Base64 and Audio
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAdvisor: React.FC<VoiceAdvisorProps> = ({ data }) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const toggleSession = async () => {
    if (isActive) {
      closeSession();
    } else {
      startSession();
    }
  };

  const startSession = async () => {
    setLoading(true);
    setPermissionError(null);
    try {
      // The client never holds a real Gemini API key: it fetches a
      // short-lived, single-use token from the server, which locks the
      // model/voice/system-instruction into the token itself — this session
      // can't be reconfigured client-side, and the token is useless after
      // one connection or ~10 minutes.
      const tokenResponse = await fetch('/api/voice/ephemeral-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!tokenResponse.ok) {
        const payload = await tokenResponse.json().catch(() => null);
        throw new Error(payload?.message || 'Could not start voice advisor.');
      }
      const { token } = await tokenResponse.json();

      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Model/voice/system-instruction are already locked into the token
      // server-side (see server/services/geminiLiveTokenService.ts) — the
      // config below is intentionally minimal since Gemini enforces the
      // locked constraints regardless of what's passed here.
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setLoading(false);
            setIsListening(true);
            
            // Stream microphone to AI
            const source = inputContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContextRef.current!.destination);
            (sessionRef.current as any) = { stream, scriptProcessor };
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            
            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current.values()) {
                try { s.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => closeSession(),
          onerror: (e) => {
            console.error("Live API Error:", e);
            closeSession();
          }
        }
      });
      
    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError("Microphone access was denied. Please check your browser settings.");
      } else {
        setPermissionError("Could not access microphone. Please try again.");
      }
      setLoading(false);
    }
  };

  const closeSession = () => {
    if (sessionRef.current) {
      sessionRef.current.stream.getTracks().forEach((t: any) => t.stop());
      sessionRef.current.scriptProcessor.disconnect();
    }
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setLoading(false);
    nextStartTimeRef.current = 0;
    sourcesRef.current.clear();
  };

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4">
      {isActive && (
        <div className="bg-neutral-900 border-2 border-agri-600 p-8 shadow-2xl animate-fade-in w-80 space-y-6">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-agri-600 animate-pulse"></div>
                 <span className="mono-label text-white/50">Tactical Voice Link</span>
              </div>
              <button onClick={closeSession} className="text-white/40 hover:text-white transition-colors"><X size={16} /></button>
           </div>
           
           <div className="flex flex-col items-center justify-center py-6 gap-6">
              <div className="relative">
                 {/* Voice Orb Visualization */}
                 <div className={`w-20 h-20 rounded-full bg-agri-600/20 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-125' : 'scale-100'}`}>
                    <div className={`w-12 h-12 rounded-full bg-agri-600 flex items-center justify-center shadow-[0_0_30px_rgba(22,101,52,0.6)] ${isSpeaking ? 'animate-pulse' : ''}`}>
                       {isSpeaking ? <Volume2 size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
                    </div>
                 </div>
                 {isListening && !isSpeaking && (
                   <div className="absolute -inset-2 border-2 border-agri-600 rounded-full animate-ping opacity-20"></div>
                 )}
              </div>
              <p className="text-[10px] font-black uppercase text-center tracking-[0.2em] text-agri-400">
                 {isSpeaking ? 'Advisor Speaking...' : 'Advisor Listening...'}
              </p>
           </div>

           <p className="text-[11px] font-medium text-neutral-400 text-center italic border-t border-white/10 pt-4">
             "Ask me about community savings or transport sharing."
           </p>
        </div>
      )}

      {permissionError && (
        <div className="bg-red-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest animate-fade-in shadow-xl mb-2">
          {permissionError}
        </div>
      )}

      <button
        onClick={toggleSession}
        disabled={loading}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all group ${
          isActive ? 'bg-red-600 rotate-90' : 'bg-agri-900 hover:scale-110'
        }`}
      >
        {loading ? (
          <Loader2 className="animate-spin text-white" size={24} />
        ) : isActive ? (
          <X className="text-white" size={24} />
        ) : (
          <div className="relative">
             <MessageSquare className="text-white" size={24} />
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-agri-600 rounded-full border-2 border-agri-900"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default VoiceAdvisor;
