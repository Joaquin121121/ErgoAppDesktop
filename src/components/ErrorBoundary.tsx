import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ error: null, errorInfo: null });
  };

  // This ensures we reset the error state if props change
  // Useful when navigating between routes
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.children !== prevProps.children) {
      this.setState({ error: null, errorInfo: null });
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
          <button onClick={this.resetErrorBoundary}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
