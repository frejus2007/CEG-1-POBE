
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Assignments from './pages/Assignments';
import Grades from './pages/Grades';
import Settings from './pages/Settings';
import Archives from './pages/Archives';
import Notifications from './pages/Notifications';
import AppVersions from './pages/AppVersions';
import Reports from './pages/Reports';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
    <p className="text-gray-600">Page introuvable</p>
    <a href="/dashboard" className="mt-4 text-blue-600 hover:underline">Retour au tableau de bord</a>
  </div>
);

import { AcademicYearProvider } from './context/AcademicYearContext';
import { SchoolProvider } from './context/SchoolContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './context/ToastContext';

import { ThemeProvider } from './context/ThemeContext';

const ToastRenderer = () => {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AcademicYearProvider>
          <SchoolProvider>
            <Router>
              <ToastRenderer />
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/teachers" element={<Teachers />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/classes" element={<Classes />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/grades" element={<Grades />} />
                  <Route path="/archives" element={<Archives />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/app-versions" element={<AppVersions />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </SchoolProvider>
        </AcademicYearProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
