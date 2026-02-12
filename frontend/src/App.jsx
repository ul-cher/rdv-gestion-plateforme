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
import RendezVousDetail from './pages/RendezVousDetail';
import PraticiensList from './pages/PraticiensList';
import PraticienCreate from './pages/PraticienCreate';
import PraticienPlanning from './pages/PraticienPlanning';
import PraticienEdit from './pages/PraticienEdit';
import PatientsList from './pages/PatientsList';
import PatientCreate from './pages/PatientCreate';
import PatientDetail from './pages/PatientDetail';
import PatientEdit from './pages/PatientEdit';
import Statistiques from './pages/Statistiques';
import AnnulationsList from './pages/AnnulationsList';
import LogsList from './pages/LogsList';
import RappelsList from './pages/RappelsList';

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
          
          <Route
            path="/rendez-vous/:id"
            element={
              <ProtectedLayout>
                <RendezVousDetail />
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
          
          <Route
            path="/praticiens/:id/planning"
            element={
              <ProtectedLayout allowedRoles={['admin', 'praticien']}>
                <PraticienPlanning />
              </ProtectedLayout>
            }
          />
          
          <Route
            path="/praticiens/:id/edit"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <PraticienEdit />
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
          
          <Route
            path="/patients/:id"
            element={
              <ProtectedLayout allowedRoles={['admin', 'praticien']}>
                <PatientDetail />
              </ProtectedLayout>
            }
          />
          
          <Route
            path="/patients/:id/edit"
            element={
              <ProtectedLayout allowedRoles={['admin', 'praticien']}>
                <PatientEdit />
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
                <RappelsList />
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
                <LogsList />
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
