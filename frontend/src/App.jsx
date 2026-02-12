import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Pages publiques
import Login from './pages/Login';
import Register from './pages/Register';

// Pages protégées
import Dashboard from './pages/Dashboard';
import RendezVousList from './pages/RendezVousList';
import RendezVousCreate from './pages/RendezVousCreate';
import PraticiensList from './pages/PraticiensList';
import PraticienCreate from './pages/PraticienCreate';
import PatientsList from './pages/PatientsList';
import PatientCreate from './pages/PatientCreate';
import Statistiques from './pages/Statistiques';
import AnnulationsList from './pages/AnnulationsList';

// Composant de layout pour les pages protégées
const ProtectedLayout = ({ children, allowedRoles }) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard - Tous les utilisateurs authentifiés */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />

          {/* Rendez-vous - Tous les utilisateurs authentifiés */}
          <Route
            path="/rendez-vous"
            element={
              <ProtectedLayout>
                <RendezVousList />
              </ProtectedLayout>
            }
          />
          
          <Route
            path="/rendez-vous/create"
            element={
              <ProtectedLayout>
                <RendezVousCreate />
              </ProtectedLayout>
            }
          />

          {/* Praticiens - Admin uniquement */}
          <Route
            path="/praticiens"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <PraticiensList />
              </ProtectedLayout>
            }
          />
          
          <Route
            path="/praticiens/create"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <PraticienCreate />
              </ProtectedLayout>
            }
          />

          {/* Patients - Admin et Praticiens */}
          <Route
            path="/patients"
            element={
              <ProtectedLayout allowedRoles={['admin', 'praticien']}>
                <PatientsList />
              </ProtectedLayout>
            }
          />
          
          <Route
            path="/patients/create"
            element={
              <ProtectedLayout allowedRoles={['admin', 'praticien']}>
                <PatientCreate />
              </ProtectedLayout>
            }
          />

          {/* Annulations - Admin et Praticiens */}
          <Route
            path="/annulations"
            element={
              <ProtectedLayout allowedRoles={['admin', 'praticien']}>
                <AnnulationsList />
              </ProtectedLayout>
            }
          />

          {/* Rappels - Admin uniquement */}
          <Route
            path="/rappels"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Gestion des Rappels</h1>
                  <p className="text-gray-600 mt-2">Page en construction</p>
                </div>
              </ProtectedLayout>
            }
          />

          {/* Statistiques - Admin uniquement */}
          <Route
            path="/statistiques"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <Statistiques />
              </ProtectedLayout>
            }
          />

          {/* Logs - Admin uniquement */}
          <Route
            path="/logs"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Logs Système</h1>
                  <p className="text-gray-600 mt-2">Page en construction</p>
                </div>
              </ProtectedLayout>
            }
          />

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
