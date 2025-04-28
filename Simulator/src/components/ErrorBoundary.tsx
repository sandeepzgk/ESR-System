import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Circuit analysis error:", error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 text-red-700">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">
            {this.state.error && this.state.error.message ?
              this.state.error.message :
              "An unknown error occurred in the circuit analysis."}
          </p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset Circuit Analysis
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;