import React, { useState } from "react";
import { LogOut, User, Heart, FileText, Camera, MessageCircle } from "lucide-react";
import VirtualAssistant from "../VirtualAssistant";
import ImageAnalysis from "../ImageAnalysis";
import Transcription from "../Transcription";
import MedicalRecords from "../MedicalRecords";

const PatientView = ({ userId, onLogout }) => {
  const [activeTab, setActiveTab] = useState("assistant");

  const tabs = [
    { id: "assistant", label: "Virtual Assistant", icon: MessageCircle },
    { id: "transcription", label: "Medical Transcription", icon: FileText },
    { id: "imaging", label: "Image Analysis", icon: Camera },
    { id: "records", label: "Medical Records", icon: Heart },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "assistant":
        return <VirtualAssistant userId={userId} />;
      case "transcription":
        return <Transcription userId={userId} />;
      case "imaging":
        return <ImageAnalysis userId={userId} />;
      case "records":
        return <MedicalRecords userId={userId} />;
      default:
        return <VirtualAssistant userId={userId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HealthHub</h1>
                <p className="text-sm text-gray-600">Patient Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{userId}</span>
              </div>
              <button
                onClick={() => {
                  if (onLogout && typeof onLogout === 'function') {
                    onLogout();
                  }
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderContent()}
        </div>
      </main>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t border-green-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            System Status: All services operational
          </div>
          <div className="text-green-600">
            99.94% Uptime | HIPAA Compliant
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientView;
