import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let details = null;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore ${parsed.operationType} error: ${parsed.error}`;
            details = parsed;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {errorMessage}
            </p>
            
            {details && (
              <div className="mb-8 p-4 bg-gray-50 rounded-2xl text-left overflow-hidden">
                <p className="text-[10px] font-mono text-gray-400 uppercase mb-2">Error Details</p>
                <pre className="text-[10px] font-mono text-gray-600 overflow-x-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
