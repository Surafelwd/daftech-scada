import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    const props = (this as any).props as Props;
    if (this.state.hasError && props.resetKey && props.resetKey !== prevProps.resetKey) {
      (this as any).setState({ hasError: false, error: null });
    }
  }

  public render() {
    const { children } = (this as any).props;
    if (this.state.hasError) {
      let message = "An unexpected error occurred.";
      try {
        const errInfo = JSON.parse(this.state.error?.message || "{}");
        if (errInfo.error && errInfo.error.includes("Missing or insufficient permissions")) {
          message = "You do not have permission to perform this action.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-zinc-900 italic serif">System Error</h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw size={14} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
