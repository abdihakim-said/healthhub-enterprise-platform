import React, { useState } from "react";
import { patientService } from "../services/api";
import { ApiErrorBoundary } from "./ErrorBoundary";

const ApiTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const testApiConnection = async () => {
    setIsLoading(true);
    const results = {};

    try {
      results.baseUrl = import.meta.env.VITE_API_BASE_URL;

      // Test 1: List all patients
      try {
        const patientsResponse = await patientService.getPatients();
        results.listPatients = {
          status: "SUCCESS",
          count: patientsResponse.data?.length || 0,
          data: patientsResponse.data
        };
      } catch (error) {
        console.error("❌ List patients failed:", error);
        results.listPatients = {
          status: "ERROR",
          error: error.message,
          details: error.response?.data
        };
      }

      // Test 2: Get specific patient
      try {
        const patientResponse = await patientService.getPatient("patient-1");
        results.getPatient = {
          status: "SUCCESS",
          patient: patientResponse.data
        };
      } catch (error) {
        console.error("❌ Get patient failed:", error);
        results.getPatient = {
          status: "ERROR",
          error: error.message,
          details: error.response?.data
        };
      }

      // Test 3: Direct fetch test
      try {
        const directResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/patient-1`);
        const directData = await directResponse.json();
        results.directFetch = {
          status: "SUCCESS",
          statusCode: directResponse.status,
          data: directData
        };
      } catch (error) {
        console.error("❌ Direct fetch failed:", error);
        results.directFetch = {
          status: "ERROR",
          error: error.message
        };
      }

    } catch (error) {
      console.error("❌ API test failed:", error);
      results.generalError = error.message;
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <ApiErrorBoundary onRetry={() => setTestResults({})}>
      <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="mb-6">
        <button
          onClick={testApiConnection}
          disabled={isLoading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test API Connection"}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">Configuration</h3>
            <p><strong>API Base URL:</strong> {testResults.baseUrl}</p>
          </div>

          {testResults.listPatients && (
            <div className={`p-4 rounded ${testResults.listPatients.status === 'SUCCESS' ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold mb-2">
                {testResults.listPatients.status === 'SUCCESS' ? '✅' : '❌'} List Patients Test
              </h3>
              {testResults.listPatients.status === 'SUCCESS' ? (
                <div>
                  <p><strong>Count:</strong> {testResults.listPatients.count}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer">View Data</summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(testResults.listPatients.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p><strong>Error:</strong> {testResults.listPatients.error}</p>
                  {testResults.listPatients.details && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(testResults.listPatients.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {testResults.getPatient && (
            <div className={`p-4 rounded ${testResults.getPatient.status === 'SUCCESS' ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold mb-2">
                {testResults.getPatient.status === 'SUCCESS' ? '✅' : '❌'} Get Patient Test
              </h3>
              {testResults.getPatient.status === 'SUCCESS' ? (
                <div>
                  <p><strong>Patient:</strong> {testResults.getPatient.patient?.firstName} {testResults.getPatient.patient?.lastName}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer">View Data</summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(testResults.getPatient.patient, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p><strong>Error:</strong> {testResults.getPatient.error}</p>
                  {testResults.getPatient.details && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(testResults.getPatient.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {testResults.directFetch && (
            <div className={`p-4 rounded ${testResults.directFetch.status === 'SUCCESS' ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold mb-2">
                {testResults.directFetch.status === 'SUCCESS' ? '✅' : '❌'} Direct Fetch Test
              </h3>
              {testResults.directFetch.status === 'SUCCESS' ? (
                <div>
                  <p><strong>Status Code:</strong> {testResults.directFetch.statusCode}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer">View Data</summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(testResults.directFetch.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p><strong>Error:</strong> {testResults.directFetch.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </ApiErrorBoundary>
  );
};

export default ApiTest;
