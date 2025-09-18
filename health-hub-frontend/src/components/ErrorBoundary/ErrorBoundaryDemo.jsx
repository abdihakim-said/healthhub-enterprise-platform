import React, { useState } from 'react';
import { ErrorBoundary, ApiErrorBoundary } from './index';

// Component that throws an error on demand
const BuggyComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a test error from BuggyComponent');
  }
  return <div className="p-4 bg-green-100 rounded">✅ Component working normally</div>;
};

// Component that simulates API error
const BuggyApiComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Network request failed');
  }
  return <div className="p-4 bg-blue-100 rounded">✅ API call successful</div>;
};

const ErrorBoundaryDemo = () => {
  const [throwError, setThrowError] = useState(false);
  const [throwApiError, setThrowApiError] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Error Boundary Demo</h1>
      
      {/* General Error Boundary Demo */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">General Error Boundary</h2>
        <button
          onClick={() => setThrowError(!throwError)}
          className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          {throwError ? 'Fix Error' : 'Trigger Error'}
        </button>
        
        <ErrorBoundary 
          title="Component Error"
          message="This component encountered an error."
        >
          <BuggyComponent shouldThrow={throwError} />
        </ErrorBoundary>
      </div>

      {/* API Error Boundary Demo */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">API Error Boundary</h2>
        <button
          onClick={() => setThrowApiError(!throwApiError)}
          className="mb-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          {throwApiError ? 'Fix API Error' : 'Trigger API Error'}
        </button>
        
        <ApiErrorBoundary onRetry={() => setThrowApiError(false)}>
          <BuggyApiComponent shouldThrow={throwApiError} />
        </ApiErrorBoundary>
      </div>
    </div>
  );
};

export default ErrorBoundaryDemo;
