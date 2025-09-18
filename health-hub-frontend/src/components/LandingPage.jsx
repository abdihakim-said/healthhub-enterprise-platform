import React from "react";
import { Heart, Shield, Globe, Zap } from "lucide-react";

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">HealthHub</span>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Healthcare Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Revolutionizing patient care through intelligent automation. 
            Multi-cloud AI integration for medical transcription, image analysis, 
            and multilingual patient support.
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-600">99.94%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-purple-600">29+</div>
              <div className="text-sm text-gray-600">Languages</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-orange-600">10K+</div>
              <div className="text-sm text-gray-600">Daily Users</div>
            </div>
          </div>

          <button
            onClick={onGetStarted}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Access Platform
          </button>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Virtual Assistant</h3>
            <p className="text-gray-600">AI-powered patient support with OpenAI GPT-4</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Medical Transcription</h3>
            <p className="text-gray-600">98% accurate medical conversation transcription</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Image Analysis</h3>
            <p className="text-gray-600">AI-powered medical image diagnosis</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Globe className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Global Access</h3>
            <p className="text-gray-600">29+ languages with real-time translation</p>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Multi-Cloud Architecture</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-orange-500 font-bold text-lg">AWS</div>
              <div className="text-sm text-gray-600">Core Infrastructure</div>
            </div>
            <div className="p-4">
              <div className="text-blue-500 font-bold text-lg">Azure</div>
              <div className="text-sm text-gray-600">Speech Services</div>
            </div>
            <div className="p-4">
              <div className="text-green-500 font-bold text-lg">Google Cloud</div>
              <div className="text-sm text-gray-600">Vision AI</div>
            </div>
            <div className="p-4">
              <div className="text-purple-500 font-bold text-lg">OpenAI</div>
              <div className="text-sm text-gray-600">GPT-4 Assistant</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 HealthHub. Enterprise Healthcare Platform. HIPAA Compliant.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
