import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login/Login";
import DoctorView from "./components/DoctorView";
import PatientView from "./components/PatientView";
import { ErrorBoundary } from "./components/ErrorBoundary";

const App = () => {
  const [currentView, setCurrentView] = useState("landing"); // landing, login, dashboard
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check for existing session only if not forced to landing
    const urlParams = new URLSearchParams(window.location.search);
    const forceLanding = urlParams.get('landing') === 'true';
    
    if (forceLanding) {
      // Clear any existing session and show landing
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      setCurrentView("landing");
      return;
    }

    const token = localStorage.getItem("token");
    const storedUserRole = localStorage.getItem("userRole");
    const storedUserId = localStorage.getItem("userId");

    if (token && storedUserRole && storedUserId) {
      setIsLoggedIn(true);
      setUserRole(storedUserRole);
      setUserId(storedUserId);
      setCurrentView("dashboard");
    } else {
      // No valid session, show landing page
      setCurrentView("landing");
    }
  }, []);

  const handleGetStarted = () => {
    setCurrentView("login");
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
  };

  const handleLoginSuccess = (token, email, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userId", email);
    
    setIsLoggedIn(true);
    setUserRole(role);
    setUserId(email);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    
    setIsLoggedIn(false);
    setUserRole(null);
    setUserId(null);
    setCurrentView("landing");
  };

  const handleGoHome = () => {
    setCurrentView("landing");
  };

  const renderContent = () => {
    // Landing Page - Version 2.0 Production Ready
    if (currentView === "landing") {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    // Login Page
    if (currentView === "login") {
      return (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={handleBackToLanding}
        />
      );
    }

    // Dashboard (after login)
    if (currentView === "dashboard" && isLoggedIn) {
      if (userRole === "doctor") {
        return <DoctorView userId={userId} onLogout={handleLogout} />;
      } else if (userRole === "patient") {
        return <PatientView userId={userId} onLogout={handleLogout} />;
      }
    }

    // Fallback to landing
    return <LandingPage onGetStarted={handleGetStarted} />;
  };

  return (
    <ErrorBoundary 
      title="HealthHub Error"
      message="We're experiencing technical difficulties. Our team has been notified."
      onGoHome={handleGoHome}
    >
      {renderContent()}
    </ErrorBoundary>
  );
};

export default App;
