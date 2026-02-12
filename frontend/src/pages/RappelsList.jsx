import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rappelsAPI } from '../services/api';
import { FaBell, FaSearch, FaFilter, FaEnvelope, FaCheckCircle, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RappelsList = () => {
  const [rappels, setRappels] = useState([]);
  const [filteredRappels, setFilteredRappels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnvoye, setFilterEnvoye] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchRappels();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterEnvoye, filterType, rappels]);

  const fetchRappels = async () => {
    try {
      setLoading(true);
      const response = await rappelsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Rappels fetched:', data);
      setRappels(data);
      setFilteredRappels(data);
    } catch (error) {
      console.error('Error fetching rappels:', error);
      setRappels([]);
      setFilteredRappels([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rappels];

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rappel => 
        rappel.rdv?.patient?.user?.first_name?.toLowerCase().includes(searchLower) ||
        rappel.rdv?.patient?.user?.last_name?.toLowerCase().includes(searchLower) ||
        rappel.rdv?.praticien?.user?.first_name?.toLowerCase().includes(searchLower) ||
        rappel.rdv?.praticien?.user?.last_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut d'envoi
    if (filterEnvoye !== 'all') {
      const isEnvoye = filterEnvoye === 'envoye';
      filtered = filtered.filter(rappel => rappel.envoye === isEnvoye);
    }

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(rappel => rappel.type_rappel === filterType);
    }

    setFilteredRappels(filtered);
  };

  const getTypeRappelLabel = (type) => {
    const labels = {
      'email': 'Email',
      'sms': 'SMS',
      'notification': 'Notification'
    };
    return labels[type] || type;
  };

  const getTypeRappelIcon = (type) => {
    switch(type) {
      case 'email':
        return <FaEnvelope className="text-blue-600" />;
      case 'sms':
        return <FaBell className="text-green-600" />;
      case 'notification':
        return <FaBell className="text-purple-600" />;
      default:
        return <FaBell className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <FaBell className="text-3xl text-primary-600 mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Rappels</h1>
            <p className="mt-2 text-gray-600">
              {filteredRappels.length} rappel{filteredRappels.length > 1 ? 's' : ''} trouvé{filteredRappels.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-blue-50">
          <div className="flex items-center">
            <FaBell className="text-3xl text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total rappels</p>
              <p className="text-2xl font-bold text-gray-900">{rappels.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50">
          <div className="flex items-center">
            <FaCheckCircle className="text-3xl text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Envoyés</p>
              <p className="text-2xl font-bold text-gray-900">
                {rappels.filter(r => r.envoye).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50">
          <div className="flex items-center">
            <FaClock className="text-3xl text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {rappels.filter(r => !r.envoye).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50">
          <div className="flex items-center">
            <FaCalendarAlt className="text-3xl text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">
                {rappels.filter(r => {
                  const today = new Date().toISOString().split('T')[0];
                  return r.date_envoi_prevue.startsWith(today);
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaSearch className="inline mr-2" />
              Recherche
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              placeholder="Patient, praticien..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFilter className="inline mr-2" />
              Statut
            </label>
            <select
              value={filterEnvoye}
              onChange={(e) => setFilterEnvoye(e.target.value)}
              className="input"
            >
              <option value="all">Tous</option>
              <option value="envoye">Envoyés</option>
              <option value="en_attente">En attente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input"
            >
              <option value="all">Tous les types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="notification">Notification</option>
            </select>
          </div>
        </div>

        {(searchTerm || filterEnvoye !== 'all' || filterType !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterEnvoye('all');
              setFilterType('all');
            }}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Liste des rappels */}
      {filteredRappels.length === 0 ? (
        <div className="card text-center py-12">
          <FaBell className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun rappel trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRappels.map((rappel) => (
            <div key={rappel.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getTypeRappelIcon(rappel.type_rappel)}
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {getTypeRappelLabel(rappel.type_rappel)}
                      </span>
                      {rappel.envoye ? (
                        <span className="ml-3 badge badge-success">
                          <FaCheckCircle className="mr-1" />
                          Envoyé
                        </span>
                      ) : (
                        <span className="ml-3 badge badge-warning">
                          <FaClock className="mr-1" />
                          En attente
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Patient</p>
                      <p className="text-sm text-gray-900">
                        {rappel.rdv?.patient?.civilite} {rappel.rdv?.patient?.user?.first_name} {rappel.rdv?.patient?.user?.last_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Praticien</p>
                      <p className="text-sm text-gray-900">
                        {rappel.rdv?.praticien?.civilite} {rappel.rdv?.praticien?.user?.first_name} {rappel.rdv?.praticien?.user?.last_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">RDV</p>
                      <p className="text-sm text-gray-900">
                        {rappel.rdv?.date_heure && format(new Date(rappel.rdv.date_heure), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Envoi prévu:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {format(new Date(rappel.date_envoi_prevue), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      {rappel.envoye && rappel.date_envoi_effectif && (
                        <div>
                          <span className="text-gray-600">Envoyé le:</span>
                          <span className="ml-2 text-gray-900 font-medium">
                            {format(new Date(rappel.date_envoi_effectif), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <Link
                    to={`/rendez-vous/${rappel.rdv?.id}`}
                    className="btn btn-secondary text-sm"
                  >
                    Voir RDV
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Les rappels sont envoyés automatiquement 24h et 48h avant chaque rendez-vous
      </div>
    </div>
  );
};

export default RappelsList;
