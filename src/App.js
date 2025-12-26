import React, { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AppStateProvider, useAppState } from "./context/AppStateContext";

import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import TaskDetail from "./components/TaskDetail";
import Toast from "./components/Toasts";
import LetterGeneratorModal from "./components/LetterGeneratorModal";

// --- Layout Component for Protected Routes ---
function ProtectedLayout() {
  const { user, tasks } = useAppState();
  const location = useLocation();
  const [showLetterModal, setShowLetterModal] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', variant: 'info', action: null });

  // Helper to expose toast trigger to children via Outlet context if needed
  // (Or you can move Toast to Context for global access)
  const triggerToast = (message, variant = "info") => {
    setToast({ show: true, message, variant, key: Date.now() });
  };

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100 -z-10" />
      
      <div className="relative flex flex-col min-h-screen">
        <Navbar
          user={user}
          tasks={tasks} // Pass tasks for notification badges
          onOpenLetterModal={() => setShowLetterModal(true)}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
          <Outlet context={{ triggerToast }} />
        </main>
      </div>

      {showLetterModal && (
        <LetterGeneratorModal
          user={user}
          onClose={() => setShowLetterModal(false)}
          templateConfig={{ mode: "gdrive", templates: {} }} // Config moved here
        />
      )}

      {toast.show && (
        <Toast
          key={toast.key}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/task/:taskId" element={<TaskDetail />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppStateProvider>
    </BrowserRouter>
  );
}