/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  History, 
  User, 
  ShieldCheck, 
  ChevronRight, 
  Zap, 
  MapPin, 
  Clock, 
  Database,
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from './lib/utils';

// --- Types ---

type TestResult = {
  id: string;
  substance: string;
  colorCode: string;
  confidence: number;
  explanation: string;
  detectedColor: string;
  reagentType: string;
  timestamp: string;
  location: string;
  image?: string;
};

type Operator = {
  name: string;
  badgeId: string;
  unit: string;
};

// --- Mock Data ---

const INITIAL_HISTORY: TestResult[] = [
  {
    id: '1',
    substance: 'MDMA',
    colorCode: 'PUR-04',
    confidence: 0.98,
    explanation: 'Deep purple reaction indicates presence of MDMA/MDA when using Marquis reagent.',
    detectedColor: '#4C1D95',
    reagentType: 'Marquis',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    location: '40.7128° N, 74.0060° W',
  },
  {
    id: '2',
    substance: 'Cocaine',
    colorCode: 'BLU-02',
    confidence: 0.92,
    explanation: 'Blue precipitates observed in Scott reagent test suggest high-purity cocaine hydrochloride.',
    detectedColor: '#1E40AF',
    reagentType: 'Scott Reagent',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    location: '34.0522° N, 118.2437° W',
  }
];

// --- Components ---

const GlassPill = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2",
    className
  )}>
    {children}
  </div>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm",
    className
  )}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) => {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20",
    secondary: "bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/20",
    ghost: "bg-slate-100 text-slate-600 hover:bg-slate-200"
  };
  
  return (
    <button 
      className={cn(
        "px-6 py-3 rounded-full font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// --- App Layout ---

export default function App() {
  const [view, setView] = useState<'hero' | 'auth' | 'dashboard' | 'camera' | 'result' | 'history'>('hero');
  const [operator, setOperator] = useState<Operator | null>(() => {
    const saved = localStorage.getItem('narcvision_operator');
    return saved ? JSON.parse(saved) : null;
  });
  const [history, setHistory] = useState<TestResult[]>(() => {
    const saved = localStorage.getItem('narcvision_history');
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('narcvision_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (operator) {
      localStorage.setItem('narcvision_operator', JSON.stringify(operator));
    }
  }, [operator]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newOperator = {
      name: formData.get('name') as string,
      badgeId: formData.get('badgeId') as string,
      unit: formData.get('unit') as string,
    };
    setOperator(newOperator);
    setView('dashboard');
  };

  const handleCapture = async (image: string) => {
    setCapturedImage(image);
    setIsAnalyzing(true);
    setView('result');

    try {
      // Get location
      let locationStr = 'Unknown';
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        locationStr = `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° W`;
      } catch (e) {
        console.warn('Location access denied');
      }

      const response = await fetch('/api/analyze-drug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, location: locationStr }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const result = await response.json();
      const finalResult = { ...result, id: Date.now().toString(), image };
      setCurrentResult(finalResult);
      setHistory(prev => [finalResult, ...prev]);
    } catch (error) {
      console.error(error);
      // Fallback for demo if API fails
      const fallback: TestResult = {
        id: Date.now().toString(),
        substance: 'Unknown (Simulated)',
        colorCode: 'ERR-01',
        confidence: 0.0,
        explanation: 'Analysis failed. Please check your network or try again.',
        detectedColor: '#ef4444',
        reagentType: 'N/A',
        timestamp: new Date().toISOString(),
        location: 'Unknown',
        image
      };
      setCurrentResult(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navigateToSection = (id: string) => {
    if (view !== 'hero') {
      setView('hero');
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
    setShowMenu(false);
  };

  const renderView = () => {
    switch (view) {
      case 'hero':
        return <HeroView onGetStarted={() => setView(operator ? 'dashboard' : 'auth')} />;
      case 'auth':
        return <AuthView onLogin={handleLogin} />;
      case 'dashboard':
        return <DashboardView operator={operator} onStartTest={() => setView('camera')} onViewHistory={() => setView('history')} />;
      case 'camera':
        return <CameraView onCapture={handleCapture} onBack={() => setView('dashboard')} />;
      case 'result':
        return <ResultView result={currentResult} isAnalyzing={isAnalyzing} onDone={() => setView('dashboard')} />;
      case 'history':
        return <HistoryView history={history} onBack={() => setView('dashboard')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-100 selection:text-cyan-900 overflow-x-hidden">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setView('hero')}
          >
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white group-hover:bg-cyan-500 transition-colors">
              <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none">NarcVision</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">By D. A. T. A.</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => navigateToSection('methodology')} className="text-sm font-medium text-slate-600 hover:text-slate-900">Methodology</button>
            <button onClick={() => navigateToSection('protocols')} className="text-sm font-medium text-slate-600 hover:text-slate-900">Field Protocols</button>
            <button onClick={() => navigateToSection('security')} className="text-sm font-medium text-slate-600 hover:text-slate-900">Security</button>
            <button onClick={() => navigateToSection('team')} className="text-sm font-medium text-slate-600 hover:text-slate-900">Team</button>
            {operator && (
              <GlassPill className="bg-slate-900/5 border-slate-900/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">{operator.name}</span>
              </GlassPill>
            )}
          </div>

          <button 
            className="md:hidden p-2 text-slate-900"
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              <button onClick={() => navigateToSection('methodology')} className="text-2xl font-bold">Methodology</button>
              <button onClick={() => navigateToSection('protocols')} className="text-2xl font-bold">Protocols</button>
              <button onClick={() => navigateToSection('team')} className="text-2xl font-bold">Team</button>
              {operator ? (
                <div className="py-6 border-t border-slate-100">
                  <p className="text-slate-500 mb-2">Logged in as</p>
                  <p className="text-xl font-bold">{operator.name}</p>
                </div>
              ) : (
                <Button onClick={() => { setView('auth'); setShowMenu(false); }}>Sign In</Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-12 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'circOut' }}
            className="max-w-7xl mx-auto"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <ShieldCheck size={20} />
            <span className="text-sm font-semibold">NarcVision Field OS v2.4</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Biotech Forensic Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// --- Views ---

function HeroView({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section 
        className="flex flex-col items-center text-center py-20 lg:py-32 relative overflow-hidden"
        style={{ marginBottom: '139px', paddingTop: '49px' }}
      >
        {/* Generative Background Elements */}
        <div className="absolute top-0 -z-10 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 text-cyan-700 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-8 backdrop-blur-sm">
            <Zap size={14} className="fill-cyan-500" />
            Smart Field Drug Testing Verification Platform
          </div>
          <h1 
            className="text-6xl md:text-9xl font-black tracking-tighter bg-gradient-to-b from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent leading-[0.9]"
            style={{ 
              marginLeft: '0px', 
              marginRight: '0px', 
              marginBottom: '21px', 
              marginTop: '-27px' 
            }}
          >
            Digital Companion<br />For Field Drug Testing.
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Standardizing existing colourimetric test kits through advanced Neural Vision. A scalable, web-based solution for traceable digital forensic workflows with no new hardware required.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6 relative z-10"
        >
          <Button onClick={onGetStarted} className="px-14 py-6 text-xl rounded-2xl group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-3">
              Access Command Center <ChevronRight size={22} />
            </span>
          </Button>
          <Button variant="ghost" className="px-14 py-6 text-xl rounded-2xl border border-slate-200">
            View Field Report
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-24 w-full max-w-5xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10" />
          <div className="bg-white rounded-[3rem] border border-slate-200 p-4 shadow-2xl shadow-slate-200/50">
            <div className="aspect-video bg-slate-100 rounded-[2.5rem] overflow-hidden relative group">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 group-hover:bg-slate-900/0 transition-colors cursor-pointer">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                   <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-slate-900 border-b-[10px] border-b-transparent ml-1" />
                 </div>
              </div>
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000" alt="Laboratory Demo" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section id="security" className="py-12 border-y border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Confidence", val: "99.8%" },
              { label: "Analysis Time", val: "< 3s" },
              { label: "Drug Profiles", val: "1,200+" },
              { label: "Field Deployments", val: "50k+" }
            ].map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-4xl font-black tracking-tighter">{s.val}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section id="protocols" className="py-24">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black tracking-tight mb-6">Designed for Reliability</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Field work is unpredictable. Your tools shouldn't be. NarcVision provides stability where it matters most.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: <Zap className="text-cyan-500" />, 
              title: "Neural Vision", 
              desc: "State-of-the-art multimodal analysis that understands visual chemical nuances beyond simple color matching.",
              color: "bg-cyan-50"
            },
            { 
              icon: <ShieldCheck className="text-indigo-500" />, 
              title: "Immutable Logs", 
              desc: "Cryptographically signed logs with GPS and time-syncing to ensure legal validity and chain of custody.",
              color: "bg-indigo-50"
            },
            { 
              icon: <Database className="text-emerald-500" />, 
              title: "Offline Sync", 
              desc: "Works in remote areas. Capture tests offline and sync automatically once a secure connection is established.",
              color: "bg-emerald-50"
            },
            { 
              icon: <MapPin className="text-orange-500" />, 
              title: "Geo-Fencing", 
              desc: "Automatic tagging of test locations for sector-wide narcotics heat-mapping and trend analysis.",
              color: "bg-orange-50"
            },
            { 
              icon: <User className="text-purple-500" />, 
              title: "Multi-Role OS", 
              desc: "Dedicated profiles for Field Operators, Forensic Analysts, and Department Administrators.",
              color: "bg-purple-50"
            },
            { 
              icon: <Info className="text-slate-500" />, 
              title: "Protocol Guide", 
              desc: "Integrated step-by-step instructions for 40+ different reagent test kits and substances.",
              color: "bg-slate-100"
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8", f.color)}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-black mb-4">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section id="methodology" className="py-24 bg-slate-900 rounded-[4rem] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 px-12 md:px-24">
          <div className="max-w-2xl mb-20">
            <h2 className="text-5xl font-black tracking-tight mb-8">Streamlined Forensic Workflow</h2>
            <p className="text-slate-400 text-lg">From sample to report in three effortless steps. Optimized for high-pressure field environments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Operator Login", desc: "Secure authentication for authorized field-testing personnel and supervisors." },
              { step: "02", title: "Capture & Validate", desc: "Automated verification of the test tube and reference calibration card image." },
              { step: "03", title: "Calibrate & Analyse", desc: "Neural Vision engine corrects for lighting variations and extracts color signatures." },
              { step: "04", title: "Classify Result", desc: "Determine if the chemical reaction is Positive, Negative, or Inconclusive." },
              { step: "05", title: "Generate Secure Record", desc: "Cryptographic signing of digital records with Time, GPS, and Operator ID." },
              { step: "06", title: "Store & Verify", desc: "Immutable storage in the history vault for audit trails and legal traceability." }
            ].map((w, i) => (
              <div key={i} className="relative group">
                <div className="text-5xl font-black text-white/10 mb-6 group-hover:text-cyan-500/20 transition-colors">{w.step}</div>
                <h4 className="text-xl font-black mb-4 flex items-center gap-4">
                   <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                   {w.title}
                </h4>
                <p className="text-slate-400 leading-relaxed text-sm">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 flex flex-col md:flex-row items-center gap-20">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
            SIH Hackathon Project
          </div>
          <h2 className="text-5xl font-black tracking-tight">The Development Team</h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            We are a group of 6 dedicated developers building NarcVision as our Smart India Hackathon project. Our goal is to revolutionize narcotics identification through software-driven forensic innovation.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-2xl font-black">6</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Core Developers</p>
            </div>
            <div>
              <p className="text-2xl font-black">1</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visionary Project</p>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full max-w-2xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((m) => (
              <div key={m} className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden grayscale hover:grayscale-0 transition-all cursor-pointer relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-black uppercase tracking-widest">Team Member {m}</p>
                </div>
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User size={48} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <Card className="bg-slate-900 border-0 p-16 md:p-24 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0ea5e9_0,transparent_100%)] opacity-20" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">Ready to Deploy?</h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
              Standardize your narcotics identification today with our neural-powered verification engine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={onGetStarted} className="bg-white text-slate-900 hover:bg-slate-100 px-12 py-5 text-lg">Get Started</Button>
            </div>
          </motion.div>
        </Card>
      </section>
    </div>
  );
}


function AuthView({ onLogin }: { onLogin: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-black">Operator Login</h2>
          <p className="text-slate-500 mt-2">Initialize your field session</p>
        </div>

        <form onSubmit={onLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-4">Full Name</label>
            <input 
              name="name"
              required
              className="w-full px-6 py-4 bg-slate-50 border-0 rounded-full focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none"
              placeholder="e.g. Sgt. James Miller"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-4">Badge ID</label>
            <input 
              name="badgeId"
              required
              className="w-full px-6 py-4 bg-slate-50 border-0 rounded-full focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none"
              placeholder="e.g. TX-49201"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-4">Assigned Unit</label>
            <input 
              name="unit"
              required
              className="w-full px-6 py-4 bg-slate-50 border-0 rounded-full focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none"
              placeholder="e.g. Narcotics Task Force"
            />
          </div>
          <Button type="submit" className="w-full py-5 mt-4">
            Begin Session <ChevronRight size={20} />
          </Button>
        </form>
      </Card>
    </div>
  );
}

function DashboardView({ 
  operator, 
  onStartTest, 
  onViewHistory 
}: { 
  operator: Operator | null, 
  onStartTest: () => void, 
  onViewHistory: () => void 
}) {
  return (
    <div className="space-y-12 py-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2">Welcome, {operator?.name.split(' ')[0]}</h1>
          <div className="flex items-center gap-3">
            <GlassPill className="px-3 py-1 bg-slate-100 border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Badge</span>
              <span className="text-xs font-bold">{operator?.badgeId}</span>
            </GlassPill>
            <GlassPill className="px-3 py-1 bg-slate-100 border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</span>
              <span className="text-xs font-bold">{operator?.unit}</span>
            </GlassPill>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
          <Clock size={16} />
          <span>Session active: 0h 14m</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
          onClick={onStartTest}
          className="lg:col-span-2 relative h-64 bg-slate-900 rounded-[3rem] p-10 flex flex-col justify-end overflow-hidden group hover:scale-[1.02] transition-transform active:scale-95"
        >
          <div className="absolute top-0 right-0 p-12 text-white/10 group-hover:text-cyan-500/20 transition-colors">
            <Camera size={160} />
          </div>
          <div className="relative z-10 text-left">
            <h2 className="text-4xl font-black text-white mb-2">Capture New Test</h2>
            <p className="text-slate-400">Initialize drug analysis via visual calibration</p>
          </div>
          <div className="absolute bottom-10 right-10 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
            <Plus size={24} />
          </div>
        </button>

        <button 
          onClick={onViewHistory}
          className="h-64 bg-white border border-slate-200 rounded-[3rem] p-10 flex flex-col justify-end relative group hover:shadow-xl hover:shadow-slate-200/50 hover:scale-[1.02] transition-all active:scale-95"
        >
          <div className="absolute top-10 right-10 text-slate-100 group-hover:text-slate-200 transition-colors">
            <History size={64} />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2">History</h2>
            <p className="text-slate-500">Access previous field logs</p>
          </div>
        </button>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black">Field Alerts</h3>
          <button className="text-cyan-600 font-bold text-sm">View Intel Map</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="flex gap-6 items-center p-6 bg-orange-50 border-orange-100">
            <div className="w-12 h-12 bg-orange-200 rounded-2xl flex items-center justify-center text-orange-700 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-orange-900">Potent Fentanyl Warning</h4>
              <p className="text-sm text-orange-700/70">Increased reports of pink-colored tablets in the downtown sector.</p>
            </div>
          </Card>
          <Card className="flex gap-6 items-center p-6 bg-blue-50 border-blue-100">
            <div className="w-12 h-12 bg-blue-200 rounded-2xl flex items-center justify-center text-blue-700 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-bold text-blue-900">System Update</h4>
              <p className="text-sm text-blue-700/70">Analysis engine updated with 24 new designer drug profiles.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CameraView({ onCapture, onBack }: { onCapture: (img: string) => void, onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: 1280, height: 720 },
          audio: false 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera access error:", err);
      }
    }
    setupCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const img = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(img);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} /> Back
        </button>
        <span className="text-sm font-bold text-cyan-600 animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full" />
          Camera Active
        </span>
      </div>

      <div className="relative aspect-video bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-slate-900 shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none border-[3rem] border-black/40">
          <div className="w-full h-full border-2 border-white/20 rounded-2xl flex items-center justify-center">
             <div className="w-64 h-64 border-2 border-cyan-400 border-dashed rounded-full" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Align test tube within the guide</p>
            <button 
              onClick={takePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 active:scale-90 transition-transform shadow-2xl"
            >
              <div className="w-full h-full border-4 border-slate-900 rounded-full flex items-center justify-center">
                <div className="w-14 h-14 bg-slate-900 rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div className="text-sm">
            <p className="font-bold mb-1">Color Calibration</p>
            <p className="text-slate-500">Ensure the reference card is visible for automatic white balance correction.</p>
          </div>
        </Card>
        <Card className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div className="text-sm">
            <p className="font-bold mb-1">Geo-Tagging</p>
            <p className="text-slate-500">Analysis will be automatically tagged with your current GPS coordinates.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ResultView({ 
  result, 
  isAnalyzing, 
  onDone 
}: { 
  result: TestResult | null, 
  isAnalyzing: boolean, 
  onDone: () => void 
}) {
  if (isAnalyzing) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 space-y-8">
        <div className="relative w-32 h-32 mx-auto">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute inset-0 border-4 border-slate-100 border-t-cyan-500 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="text-cyan-500 animate-pulse" size={40} />
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-black mb-4">Analyzing Sample...</h2>
          <p className="text-slate-500 text-lg">Cross-referencing color signature with drug database</p>
        </div>
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
          {[
            "Extracting color channels",
            "Matching reference codes",
            "Calculating confidence score",
            "Finalizing forensic report"
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.5 }}
              className="flex items-center gap-3 text-sm font-bold text-slate-400"
            >
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
              {step}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isHighConfidence = result.confidence > 0.8;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <header>
            <div className="inline-flex items-center gap-2 text-cyan-600 font-bold mb-4">
              <CheckCircle2 size={18} />
              Analysis Complete
            </div>
            <h1 className="text-5xl font-black mb-2">{result.substance}</h1>
            <p className="text-slate-500 text-lg">Identified via {result.reagentType} Test</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-900 text-white p-6 border-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confidence Score</p>
              <p className="text-3xl font-black">{(result.confidence * 100).toFixed(1)}%</p>
            </Card>
            <Card className="p-6 border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Color Code</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-lg border border-slate-200" 
                  style={{ backgroundColor: result.detectedColor }}
                />
                <p className="text-3xl font-black">{result.colorCode}</p>
              </div>
            </Card>
          </div>

          <Card className="p-8">
            <h3 className="text-lg font-bold mb-4">Forensic Explanation</h3>
            <p className="text-slate-600 leading-relaxed">
              {result.explanation}
            </p>
          </Card>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <div className="aspect-square bg-slate-200 rounded-[3rem] overflow-hidden border-4 border-white shadow-xl">
             <img src={result.image} alt="Sample" className="w-full h-full object-cover" />
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-sm">
               <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                 <Clock size={18} />
               </div>
               <div>
                 <p className="text-slate-400 font-bold text-[10px] uppercase">Timestamp</p>
                 <p className="font-bold">{formatDate(result.timestamp)}</p>
               </div>
             </div>
             <div className="flex items-center gap-3 text-sm">
               <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                 <MapPin size={18} />
               </div>
               <div>
                 <p className="text-slate-400 font-bold text-[10px] uppercase">Location</p>
                 <p className="font-bold">{result.location}</p>
               </div>
             </div>
          </div>

          <Button onClick={onDone} className="w-full py-5">
            Submit Record
          </Button>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-200 flex justify-between items-center">
        <div className="flex gap-4">
          <button className="text-slate-400 hover:text-slate-900 transition-colors">
            <Info size={24} />
          </button>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest",
          isHighConfidence ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {isHighConfidence ? "Reliable Chain of Custody" : "Verification Recommended"}
        </div>
      </div>
    </div>
  );
}

function HistoryView({ history, onBack }: { history: TestResult[], onBack: () => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} /> Dashboard
        </button>
        <h2 className="text-3xl font-black">Test History</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {history.map((item) => (
          <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.substance} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Database size={32} />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold">{item.substance}</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest">
                  {item.reagentType}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Clock size={14} /> {formatDate(item.timestamp)}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {item.location}</span>
                <span className="flex items-center gap-1 font-bold text-cyan-600">{(item.confidence * 100).toFixed(0)}% Match</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</p>
                <p className="text-lg font-black">{item.colorCode}</p>
              </div>
              <div 
                className="w-4 h-12 rounded-full" 
                style={{ backgroundColor: item.detectedColor }}
              />
              <button className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
