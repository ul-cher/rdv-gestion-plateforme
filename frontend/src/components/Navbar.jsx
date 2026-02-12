import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaHome, FaUserMd, FaUsers, FaCalendarAlt, 
  FaBan, FaBell, FaChartBar, FaHistory, 
  FaSignOutAlt, FaBars, FaTimes 
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, isAdmin, isPraticien, isPatient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: FaHome, roles: ['admin', 'praticien', 'patient'] },
    { path: '/praticiens', label: 'Praticiens', icon: FaUserMd, roles: ['admin'] },
    { path: '/patients', label: 'Patients', icon: FaUsers, roles: ['admin', 'praticien'] },
    { path: '/rendez-vous', label: 'Rendez-vous', icon: FaCalendarAlt, roles: ['admin', 'praticien', 'patient'] },
    { path: '/annulations', label: 'Annulations', icon: FaBan, roles: ['admin', 'praticien'] },
    { path: '/rappels', label: 'Rappels', icon: FaBell, roles: ['admin'] },
    { path: '/statistiques', label: 'Statistiques', icon: FaChartBar, roles: ['admin'] },
    { path: '/logs', label: 'Logs', icon: FaHistory, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">
                Plateforme RDV
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-danger-500 rounded-lg hover:bg-danger-600 transition-colors"
            >
              <FaSignOutAlt className="mr-2" />
              Déconnexion
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-danger-600 hover:bg-danger-50"
            >
              <FaSignOutAlt className="mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
