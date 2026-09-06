import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { DemoDataProvider } from './context/DemoDataContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MilkTesting } from './pages/MilkTesting';
import { MilkCollection } from './pages/MilkCollection';
import { Farmers } from './pages/Farmers';
import { FarmerDetails } from './pages/FarmerDetails';
import { TestHistory } from './pages/TestHistory';
import { Reports } from './pages/Reports';
import { Devices } from './pages/Devices';
import { DeviceDetails } from './pages/DeviceDetails';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <DemoDataProvider>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Dashboard Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/milk-testing" element={<MilkTesting />} />
                  <Route path="/collection" element={<MilkCollection />} />
                  <Route path="/farmers" element={<Farmers />} />
                  <Route path="/farmers/:id" element={<FarmerDetails />} />
                  <Route path="/history" element={<TestHistory />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/devices/:id" element={<DeviceDetails />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </DemoDataProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
