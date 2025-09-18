import { Calendar, FileText, Home, MessageSquare, LogOut, User } from "lucide-react";
import React, { useState } from "react";
import Appointment from "../Appointment";
import MedicalRecords from "../MedicalRecords";
import PatientDashboard from "../PatientDashboard";
import VirtualAssistant from "../VirtualAssistant";

const MenuItem = ({ icon: Icon, label, active, onClick }) => (
  <div
    className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
      active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-blue-100"
    }`}
    onClick={onClick}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </div>
);

const PatientView = ({ userId, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <PatientDashboard userId={userId} />;
      case "medicalRecords":
        return <MedicalRecords userId={userId} />;
      case "appointments":
        return <Appointment userId={userId} />;
      case "virtualAssistant":
        return <VirtualAssistant userId={userId} />;
      default:
        return <PatientDashboard userId={userId} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">HealthHub - Patient Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{userId}</span>
              </div>
              <button
                onClick={() => {
                  if (onLogout && typeof onLogout === 'function') {
                    onLogout();
                  }
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="w-64 bg-white shadow-lg p-4 mt-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600">HealthHub</h1>
          <p className="text-sm text-gray-600">Welcome, Patient</p>
        </div>
        <div className="space-y-2">
          <MenuItem
            icon={Home}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <MenuItem
            icon={FileText}
            label="Medical Records"
            active={activeTab === "medicalRecords"}
            onClick={() => setActiveTab("medicalRecords")}
          />
          <MenuItem
            icon={Calendar}
            label="Appointments"
            active={activeTab === "appointments"}
            onClick={() => setActiveTab("appointments")}
          />
          <MenuItem
            icon={MessageSquare}
            label="Virtual Assistant"
            active={activeTab === "virtualAssistant"}
            onClick={() => setActiveTab("virtualAssistant")}
          />
        </div>
      </nav>
      
      <main className="flex-grow p-6 overflow-y-auto mt-16">
        {renderContent()}
      </main>
    </div>
  );
};

export default PatientView;
