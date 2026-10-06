import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { Lock, User, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, Cpu } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Loading animation state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Verifying Token...');
  const [progressPercent, setProgressPercent] = useState(0);

  // Time-based welcome message
  const getWelcomeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Welcome Back';
    if (hour < 17) return 'Good Afternoon, Welcome Back';
    return 'Good Evening, Welcome Back';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    // Start loading animation sequence
    setIsLoading(true);
    setProgressPercent(25);
    setLoadingStep('Authenticating with Supabase Auth...');

    const timer1 = setTimeout(() => {
      setProgressPercent(60);
      setLoadingStep('Verifying Access Control...');
    }, 350);

    const timer2 = setTimeout(() => {
      setProgressPercent(85);
      setLoadingStep('Loading Security Permissions...');
    }, 700);

    try {
      const result = await authService.login(username, password);
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (result.success) {
        setProgressPercent(100);
        setLoadingStep('Access Granted! Redirecting...');
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess();
        }, 300);
      } else {
        setIsLoading(false);
        setErrorMessage(result.message || 'Invalid username or password.');
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
      setErrorMessage(err?.message || 'Authentication error.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Tech Grids & Neon Pulses */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md bg-[#0e1420]/90 backdrop-blur-xl border border-tech-border rounded-3xl p-8 shadow-2xl shadow-cyan-950/40 relative z-10 space-y-6">
        
        {/* Branding Header & Time-Based Welcome */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-cyan-400/30 to-indigo-600/30 border border-cyan-400/40 shadow-lg shadow-cyan-500/20 mb-1">
            <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5 font-mono">
            IYER <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">TALENT OS</span>
          </h1>
          <p className="text-xs text-cyan-400 font-semibold tracking-wide flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{getWelcomeGreeting()}</span>
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Technology Influencer Operations & Commercial Workspace
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-red-300 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Username or Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter username or email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-100 placeholder-slate-600 rounded-xl pl-9 pr-3 py-2.5 focus:border-cyan-400 focus:outline-none transition-colors font-mono"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0b0f17] border border-tech-border text-slate-100 placeholder-slate-600 rounded-xl pl-9 pr-10 py-2.5 focus:border-cyan-400 focus:outline-none transition-colors font-mono"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50"
          >
            <span>Log In to Workspace</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="text-center text-[10px] text-slate-600 pt-2 border-t border-tech-border/40">
          IYER TALENT OS • Encrypted & Isolated Multi-Role Platform
        </div>
      </div>

      {/* TECH LOADING ANIMATION MODAL OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 bg-[#070a11]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1420] border border-cyan-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wider">
                IYER SECURITY AUTHENTICATION
              </h3>
              <p className="text-xs text-cyan-400 font-mono mt-1">{loadingStep}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#0b0f17] rounded-full h-2 overflow-hidden border border-tech-border">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Securing session tokens & initializing dashboard view...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
