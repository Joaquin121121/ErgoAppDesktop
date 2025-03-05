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
    console.log("Resetting error boundary state");
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  // This ensures we reset the error state if props change
  // Useful when navigating between routes
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      console.log("Children changed, resetting error boundary");
      this.setState({ hasError: false, error: null });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      console.log("Rendering error boundary fallback");

      // If a fallback component was provided, use it and pass the error message
      if (this.props.fallback) {
        return React.cloneElement(this.props.fallback as React.ReactElement, {
          onReset: this.resetErrorBoundary,
          errorMessage: this.state.error?.message,
        });
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-white p-6">
          <img src="/error.png" alt="Error" className="w-32 h-32 mb-6" />
          <h1 className="text-3xl font-bold text-secondary mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            We've encountered an unexpected error: {this.state.error?.message}
          </p>
          <button
            className="px-6 py-3 bg-secondary text-white rounded-xl hover:bg-red-700 transition-colors"
            onClick={this.resetErrorBoundary}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
