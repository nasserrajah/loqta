import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console only — never log tokens/secrets.
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-light px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-dark mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8">
              An unexpected error occurred. You can try reloading the page or go back to the home page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-full font-bold hover:bg-primary-700 transition"
              >
                <RefreshCw className="w-5 h-5" />
                Reload page
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-50 transition"
              >
                <Home className="w-5 h-5" />
                Go to Home
              </a>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left bg-gray-100 p-4 rounded-xl text-xs overflow-auto">
                <summary className="cursor-pointer font-semibold">Error details (dev only)</summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
