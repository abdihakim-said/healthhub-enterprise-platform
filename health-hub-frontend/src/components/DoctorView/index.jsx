import React, { useState } from "react";
import { Home, VolumeX, FileText, Image, LogOut, User } from "lucide-react";
import DoctorDashboard from "../DoctorDashboard";
import AISpeech from "../AiSpeech";
import Transcription from "../Transcription";
import ImageAnalysis from "../ImageAnalysis";
import { MenuItem } from "../SharedComponents";

const DoctorView = ({ userId, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DoctorDashboard />;
      case "speech":
        return <AISpeech />;
      case "transcription":
        return <Transcription />;
      case "image":
        return <ImageAnalysis />;
      default:
        return <DoctorDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">HealthHub - Doctor Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{userId}</span>
              </div>
              <button
                onClick={onLogout}
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
          <p className="text-sm text-gray-600">Welcome, Doctor</p>
        </div>
        <div className="space-y-2">
          <MenuItem
            icon={Home}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <MenuItem
            icon={VolumeX}
            label="AI Speech (Polly/Translate)"
            active={activeTab === "speech"}
            onClick={() => setActiveTab("speech")}
          />
          <MenuItem
            icon={FileText}
            label="Medical Transcription (Azure)"
            active={activeTab === "transcription"}
            onClick={() => setActiveTab("transcription")}
          />
          <MenuItem
            icon={Image}
            label="Image Analysis (Google Vision)"
            active={activeTab === "image"}
            onClick={() => setActiveTab("image")}
          />
        </div>
      </nav>
      
      <main className="flex-grow p-6 overflow-y-auto mt-16">
        {renderContent()}
      </main>
    </div>
  );
};

export default DoctorView;
