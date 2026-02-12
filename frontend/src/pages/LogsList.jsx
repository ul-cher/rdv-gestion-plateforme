import React, { useState, useEffect } from 'react';
import { logsAPI } from '../services/api';
import { FaHistory, FaSearch, FaFilter, FaUser, FaCalendar } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const LogsList = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterAction, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logsAPI.getAll({ limit: 200 });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Logs fetched:', data);
      setLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.user_display?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par type d'action
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(filterAction.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const getActionBadge = (action) => {
    if (action.includes('Création') || action.includes('Inscription')) {
      return 'badge badge-success';
    } else if (action.includes('Suppression') || action.includes('Annulation')) {
      return 'badge badge-danger';
    } else if (action.includes('Modification') || action.includes('Mise à jour')) {
      return 'badge badge-warning';
    } else if (action.includes('Connexion')) {
      return 'badge badge-info';
    }
    return 'badge';
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
          <FaHistory className="text-3xl text-primary-600 mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logs Système</h1>
            <p className="mt-2 text-gray-600">
              {filteredLogs.length} log{filteredLogs.length > 1 ? 's' : ''} trouvé{filteredLogs.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Action, détails, utilisateur..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFilter className="inline mr-2" />
              Type d'action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input"
            >
              <option value="all">Toutes les actions</option>
              <option value="création">Créations</option>
              <option value="modification">Modifications</option>
              <option value="suppression">Suppressions</option>
              <option value="connexion">Connexions</option>
              <option value="annulation">Annulations</option>
            </select>
          </div>
        </div>

        {(searchTerm || filterAction !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterAction('all');
            }}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Liste des logs */}
      {filteredLogs.length === 0 ? (
        <div className="card text-center py-12">
          <FaHistory className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun log trouvé</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(log.date), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(log.date), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUser className="text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {log.user_display || 'Système'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getActionBadge(log.action)}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {log.details || '-'}
                      </div>
                      {log.table_cible && (
                        <div className="text-xs text-gray-500 mt-1">
                          Table: {log.table_cible}
                          {log.cible_id && ` (ID: ${log.cible_id})`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Les logs sont conservés pour garantir la traçabilité des actions dans le système
      </div>
    </div>
  );
};

export default LogsList;
