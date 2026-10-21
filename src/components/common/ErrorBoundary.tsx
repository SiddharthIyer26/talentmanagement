import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut, Home, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[IYER TALENT OS] Uncaught runtime exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem('iyer_talent_os_auth_session_v2');
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/';
  };

  handleResetLocalDataAndReload = () => {
    try {
      localStorage.removeItem('talent_os_db_v1');
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070a11] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
          {/* Tech Grids */}
          <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

          <div className="w-full max-w-lg bg-[#0e1420]/95 backdrop-blur-xl border border-red-500/40 rounded-3xl p-8 shadow-2xl shadow-red-950/40 relative z-10 space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 p-2 shadow-lg shadow-red-500/20 mb-1">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-white font-mono">
                IYER <span className="text-red-400">TALENT OS</span> • SAFE MODE
              </h1>
              <p className="text-xs text-slate-300">
                A runtime exception occurred in the workspace. Your cloud database is safe and untouched.
              </p>
            </div>

            {/* Error Message Box */}
            <div className="bg-[#070a11] border border-tech-border rounded-xl p-3.5 text-left font-mono text-[11px] text-red-300 max-h-36 overflow-y-auto">
              <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Diagnostic Log:</div>
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 text-xs transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Workspace</span>
              </button>

              <button
                onClick={this.handleResetSession}
                className="w-full bg-tech-card hover:bg-slate-800 border border-tech-border text-slate-300 font-semibold py-2.5 rounded-xl flex items-center justify-center space-x-2 text-xs transition-all"
              >
                <LogOut className="w-4 h-4 text-cyan-400" />
                <span>Return to Login Screen</span>
              </button>

              <button
                onClick={this.handleResetLocalDataAndReload}
                className="w-full bg-transparent hover:bg-slate-900/50 border border-tech-border/40 text-slate-400 font-normal py-2 rounded-xl flex items-center justify-center space-x-2 text-[11px] transition-all"
              >
                <span>Re-sync Local Cache from Cloud</span>
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-500 border-t border-tech-border/40 pt-3">
              IYER TALENT OS Enterprise Resilience Subsystem
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
