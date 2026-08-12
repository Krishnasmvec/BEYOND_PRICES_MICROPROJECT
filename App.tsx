
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { generatePrediction, generateConsumerInsights } from './services/geminiService';
import { fetchMarkets } from './lib/api';
import { UserInput, PredictionResult, UserRole, ConsumerPrediction } from './types';
import InputForm from './components/InputForm';
import RoleSelector from './components/RoleSelector';
import Logo from './components/Logo';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './i18n';
import { Info, MapPin, Loader2, ArrowLeft, Clock, TrendingUp } from 'lucide-react';

const RECENT_SEARCHES_KEY = 'hp_consumer_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// Dashboards pull in recharts (charting) and are only needed after a
// prediction succeeds — code-split so the initial bundle (role selector,
// input form) stays light on the slow/rural connections this app targets.
const Dashboard = lazy(() => import('./components/Dashboard'));
const ConsumerDashboard = lazy(() => import('./components/ConsumerDashboard'));

const DashboardFallback: React.FC = () => (
  <div className="py-32 flex items-center justify-center">
    <Loader2 className="animate-spin text-agri-600" size={32} />
  </div>
);

const App: React.FC = () => {
  const { t } = useTranslation();
  const [role, setRole] = useState<UserRole>(null);
  const [view, setView] = useState<'input' | 'dashboard'>('input');
  const [loading, setLoading] = useState(false);
  const [predictionData, setPredictionData] = useState<PredictionResult | null>(null);
  const [consumerData, setConsumerData] = useState<ConsumerPrediction | null>(null);
  const [lastInput, setLastInput] = useState<UserInput | null>(null);
  const [consumerLocation, setConsumerLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real seeded market regions, not invented city names — same data source
  // ConsumerDashboard uses for the actual market search itself.
  useEffect(() => {
    fetchMarkets()
      .then((markets) => {
        const uniqueLocations = Array.from(new Set(markets.map((m) => m.location)));
        setPopularSearches(uniqueLocations);
      })
      .catch(() => setPopularSearches([]));
  }, []);

  const rememberSearch = (loc: string) => {
    setRecentSearches((prev) => {
      const next = [loc, ...prev.filter((l) => l.toLowerCase() !== loc.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleFarmerSubmit = async (data: UserInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generatePrediction(data);
      setPredictionData(result);
      setLastInput(data);
      setView('dashboard');
    } catch (err: any) {
      setError(err.message || "Strategic analysis failed. Connection timeout or data inconsistency.");
    } finally {
      setLoading(false);
    }
  };

  const handleConsumerSearch = async (loc: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateConsumerInsights({ location: loc, preferences: [] });
      setConsumerData(result);
      setConsumerLocation(loc);
      setView('dashboard');
      rememberSearch(loc);
    } catch (err: any) {
      setError(err.message || "Market intelligence feed unavailable for this region.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setView('input');
    setPredictionData(null);
    setConsumerData(null);
    setError(null);
  };

  const handleBackToRoles = () => {
    setRole(null);
    handleReset();
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-agri-600/10 selection:text-agri-900">
      {/* Precision Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
          <div className="flex justify-between h-20 items-center">
            <div
              className="flex items-center gap-4 cursor-pointer group"
              onClick={handleBackToRoles}
            >
              <Logo className="w-10 h-10 transition-transform group-hover:scale-105" colorClass={role === 'consumer' ? 'text-navy-900' : 'text-agri-600'} />
              <div className="border-l border-neutral-200 pl-4">
                <h1 className="text-xl font-display font-black tracking-tighter uppercase leading-none">{t('common.appName')}</h1>
                <p className="mono-label text-[9px] text-neutral-400 mt-1">{t('common.tagline')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {role && (
                <div className="flex items-center gap-8">
                  <button
                    onClick={handleBackToRoles}
                    className="mono-label text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft size={14} /> {t('common.switchPortal')}
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${role === 'consumer' ? 'bg-blue-600' : 'bg-agri-600'}`}></span>
                    {t('common.systemActive')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-10">
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 text-red-800 flex items-center gap-3 animate-fade-in">
            <Info size={18} />
            <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
          </div>
        )}

        {!role ? (
          <RoleSelector onSelect={setRole} />
        ) : view === 'input' ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            {role === 'farmer' ? (
              <InputForm onSubmit={handleFarmerSubmit} isLoading={loading} />
            ) : (
              <div className="w-full max-w-xl bg-white border border-neutral-200 p-12 shadow-2xl">
                <div className="text-center mb-12">
                   <div className="bg-navy-900 w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <MapPin className="text-white w-10 h-10" />
                   </div>
                   <h2 className="text-3xl font-display font-black tracking-tight mb-2">{t('consumerEntry.title')}</h2>
                   <p className="text-neutral-400 uppercase text-[10px] font-black tracking-[0.2em]">{t('consumerEntry.subtitle')}</p>
                </div>
                <div className="space-y-6">
                  <input
                    type="text"
                    placeholder={t('consumerEntry.placeholder')}
                    className="w-full px-6 py-5 bg-neutral-50 border border-neutral-200 font-bold text-lg outline-none focus:border-navy-900 transition-colors uppercase placeholder:text-neutral-200"
                    value={consumerLocation}
                    onChange={(e) => setConsumerLocation(e.target.value)}
                  />
                  <button
                    onClick={() => handleConsumerSearch(consumerLocation)}
                    disabled={loading || !consumerLocation}
                    className="w-full py-5 bg-navy-900 text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : t('consumerEntry.submit')}
                  </button>
                </div>

                {recentSearches.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="flex items-center gap-1.5 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                      <Clock size={11} /> Recent Searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => { setConsumerLocation(loc); handleConsumerSearch(loc); }}
                          disabled={loading}
                          className="px-4 py-2 rounded-full border border-neutral-200 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:border-navy-900 hover:text-navy-900 transition-colors disabled:opacity-30"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {popularSearches.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="flex items-center gap-1.5 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                      <TrendingUp size={11} /> Popular Searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => { setConsumerLocation(loc); handleConsumerSearch(loc); }}
                          disabled={loading}
                          className="px-4 py-2 rounded-full bg-neutral-50 border border-neutral-100 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:border-agri-600 hover:text-agri-600 transition-colors disabled:opacity-30"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-8 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
                  {t('consumerEntry.hint')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <Suspense fallback={<DashboardFallback />}>
              {role === 'farmer' && predictionData && lastInput && (
                <Dashboard data={predictionData} input={lastInput} onReset={handleReset} />
              )}
              {role === 'consumer' && consumerData && (
                <ConsumerDashboard data={consumerData} location={consumerLocation} onReset={handleReset} />
              )}
            </Suspense>
          </div>
        )}
      </main>

      <footer className="mt-40 border-t border-neutral-200 py-16 px-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             <Logo className="w-6 h-6 grayscale opacity-30" colorClass="text-neutral-900" />
             <span className="mono-label text-neutral-300">{t('footer.brand')}</span>
          </div>
          <div className="flex gap-10">
             <a href="#" className="mono-label text-neutral-400 hover:text-neutral-900 transition-colors">{t('footer.documentation')}</a>
             <a href="#" className="mono-label text-neutral-400 hover:text-neutral-900 transition-colors">{t('footer.apiStatus')}</a>
             <a href="#" className="mono-label text-neutral-400 hover:text-neutral-900 transition-colors">{t('footer.privacyPolicy')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
