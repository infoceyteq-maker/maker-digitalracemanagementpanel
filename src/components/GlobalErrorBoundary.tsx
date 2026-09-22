import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { CeyteqLogo } from './CeyteqLogo';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  incidentId: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    incidentId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      incidentId: `ERR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL: Caught unhandled error via GlobalErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    // In production, this posts to /api/security/audit-log or Sentry/Datadog
    try {
      fetch('/api/security/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'SYSTEM_ERROR_CAUGHT',
          severity: 'HIGH',
          details: `Component Error: ${error.message}`,
          stack: error.stack?.slice(0, 500),
          componentStack: errorInfo.componentStack?.slice(0, 500),
        }),
      }).catch(() => {});
    } catch {
      // ignore telemetry failure
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[450px] w-full flex items-center justify-center p-6 bg-slate-50/90 rounded-2xl border border-rose-200/80 my-4 shadow-sm">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <CeyteqLogo size="sm" variant="light" showSubtitle={false} />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">
              {this.props.fallbackTitle || 'Safe Fallback Activated'}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {this.props.fallbackSubtitle ||
                'A component encountered an issue. Ceyteq’s crash prevention architecture isolated this module so the rest of your dashboard remains operational.'}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-900 text-left font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
              <div className="text-rose-400 font-bold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Incident Ref: {this.state.incidentId}</span>
              </div>
              <div className="text-slate-200 break-words">
                {this.state.error?.message || 'Unknown runtime error'}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A3D9] hover:bg-[#008BB8] text-white text-xs font-bold transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recover Component</span>
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reset to Main</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
