import React from 'react';
import { Wifi, RefreshCw } from 'lucide-react';

class ApiErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error });
    
    // Log API errors
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Connection Error
              </h3>
              <p className="text-sm text-red-600 mt-1">
                Unable to connect to our servers. Please check your connection and try again.
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ApiErrorBoundary;
