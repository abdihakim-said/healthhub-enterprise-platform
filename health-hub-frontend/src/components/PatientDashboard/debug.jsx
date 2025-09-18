import React, { useState, useEffect } from "react";
import { patientService, appointmentService } from "../../services/api";

const PatientDashboardDebug = ({ userId = "patient-1" }) => {
  const [patient, setPatient] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      
      if (!userId) {
        setError("User ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Test the API call with detailed logging
        const patientResponse = await patientService.getPatient(userId);
        
        setDebugInfo({
          userId: userId,
          responseStatus: patientResponse.status,
          responseData: patientResponse.data,
          hasData: !!patientResponse.data,
          dataType: typeof patientResponse.data,
          dataKeys: patientResponse.data ? Object.keys(patientResponse.data) : []
        });

        if (patientResponse.data) {
          setPatient(patientResponse.data);
        } else {
          setError("No patient data received");
        }

        // Try to get appointments
        try {
          const appointmentsResponse = await appointmentService.getAppointments();
          
          // Filter appointments for this patient
          const patientAppointments = appointmentsResponse.data?.filter(
            apt => apt.patientId === userId && apt.status === "scheduled"
          ) || [];
          
          setUpcomingAppointments(patientAppointments);
        } catch (appointmentError) {
          // Don't fail the whole component for appointments
        }

        setIsLoading(false);
        
      } catch (error) {
        console.error("❌ DEBUG: Error fetching patient data:", error);
        console.error("❌ DEBUG: Error details:", {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data
        });
        
        setError(`Failed to load patient data: ${error.message}`);
        setDebugInfo({
          error: error.message,
          errorResponse: error.response?.data,
          errorStatus: error.response?.status
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        <div className="ml-4">
          <p>Loading patient data...</p>
          <p className="text-sm text-gray-600">User ID: {userId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-4">Debug Information</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Error:</strong> {error}</p>
          <p><strong>User ID:</strong> {userId}</p>
          <p><strong>Debug Info:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p>No patient data available</p>
        <p className="text-sm text-gray-600">User ID: {userId}</p>
        <pre className="bg-gray-100 p-2 rounded text-xs mt-2">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-green-800">✅ Success!</h3>
        <p className="text-sm text-green-700">Patient data loaded successfully</p>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800">
        Welcome, {patient.firstName}
      </h2>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Your Information</h3>
        <p>Name: {patient.firstName} {patient.lastName}</p>
        <p>Date of Birth: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
        <p>Contact: {patient.contactNumber}</p>
        <p>Email: {patient.email}</p>
        {patient.medicalHistory && patient.medicalHistory.length > 0 && (
          <p>Medical History: {patient.medicalHistory.length} conditions</p>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Upcoming Appointments</h3>
        {upcomingAppointments.length > 0 ? (
          <ul>
            {upcomingAppointments
              .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
              .map((appointment) => (
                <li key={appointment.id} className="mb-2">
                  {new Date(appointment.dateTime).toLocaleString()}
                </li>
              ))}
          </ul>
        ) : (
          <p>No upcoming appointments</p>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PatientDashboardDebug;
