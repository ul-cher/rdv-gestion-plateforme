import React, { useState, useEffect } from 'react';
import { statistiquesAPI } from '../services/api';
import { 
  FaCalendarAlt, FaUserMd, FaUsers, FaCheckCircle, 
  FaTimesCircle, FaChartLine, FaExclamationTriangle 
} from 'react-icons/fa';

const Statistiques = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistiques();
  }, []);

  const fetchStatistiques = async () => {
    try {
      setLoading(true);
      const response = await statistiquesAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <FaExclamationTriangle className="mx-auto text-6xl text-red-300 mb-4" />
          <p className="text-gray-500">Erreur lors du chargement des statistiques</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaChartLine className="mr-3 text-primary-600" />
          Statistiques
        </h1>
        <p className="mt-2 text-gray-600">Vue d'ensemble de l'activité</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Rendez-vous</p>
              <p className="text-3xl font-bold mt-2">{stats.total_rdv || 0}</p>
            </div>
            <FaCalendarAlt className="text-5xl text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">RDV Confirmés</p>
              <p className="text-3xl font-bold mt-2">{stats.rdv_confirmes || 0}</p>
            </div>
            <FaCheckCircle className="text-5xl text-green-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">RDV Annulés</p>
              <p className="text-3xl font-bold mt-2">{stats.rdv_annules || 0}</p>
            </div>
            <FaTimesCircle className="text-5xl text-red-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Absences</p>
              <p className="text-3xl font-bold mt-2">{stats.rdv_absences || 0}</p>
            </div>
            <FaExclamationTriangle className="text-5xl text-purple-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Taux d'annulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taux d'annulation</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - (stats.taux_annulation || 0) / 100)}`}
                  className="text-red-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats.taux_annulation?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            {stats.rdv_annules || 0} RDV annulés sur {stats.total_rdv || 0} total
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RDV ce mois</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-6xl font-bold text-primary-600">{stats.rdv_mois || 0}</p>
              <p className="text-sm text-gray-600 mt-2">Rendez-vous programmés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top praticiens */}
      {stats.rdv_par_praticien && stats.rdv_par_praticien.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 Praticiens par nombre de RDV
          </h3>
          <div className="space-y-3">
            {stats.rdv_par_praticien.map((praticien, index) => (
              <div key={praticien.id} className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      {praticien.user__first_name} {praticien.user__last_name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {praticien.nb_rdv} RDV
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{praticien.specialite}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${(praticien.nb_rdv / stats.rdv_par_praticien[0].nb_rdv) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RDV par spécialité */}
      {stats.rdv_par_specialite && stats.rdv_par_specialite.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rendez-vous par spécialité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.rdv_par_specialite.map((spec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{spec.specialite}</span>
                  <span className="text-2xl font-bold text-primary-600">{spec.nb_rdv}</span>
                </div>
                <div className="text-sm text-gray-600">rendez-vous</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de données */}
      {(!stats.rdv_par_praticien || stats.rdv_par_praticien.length === 0) && (
        <div className="card text-center py-12 bg-gray-50">
          <FaChartLine className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Pas encore assez de données pour afficher les statistiques détaillées</p>
        </div>
      )}
    </div>
  );
};

export default Statistiques;
