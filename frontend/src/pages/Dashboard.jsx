import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rdvAPI, praticiensAPI, patientsAPI, annulationsAPI } from '../services/api';
import { 
  FaCalendarAlt, FaUserMd, FaUsers, FaCheckCircle, 
  FaTimesCircle, FaClock, FaExclamationTriangle,
  FaChartLine, FaPlus
} from 'react-icons/fa';
import { format, isToday, isFuture, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const { user, isAdmin, isPraticien, isPatient } = useAuth();
  const [stats, setStats] = useState({});
  const [rdvList, setRdvList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Stats admin
        const [rdvResponse, praticiensResponse, patientsResponse, annulationsResponse] = await Promise.all([
          rdvAPI.getAll(),
          praticiensAPI.getAll({ actif: true }),
          patientsAPI.getAll(),
          annulationsAPI.getAll({ statut: 'en_attente' })
        ]);
        
        // Extraire les données (gérer pagination)
        const rdvData = Array.isArray(rdvResponse.data) ? rdvResponse.data : (rdvResponse.data.results || []);
        const praticiensData = Array.isArray(praticiensResponse.data) ? praticiensResponse.data : (praticiensResponse.data.results || []);
        const patientsData = Array.isArray(patientsResponse.data) ? patientsResponse.data : (patientsResponse.data.results || []);
        const annulationsData = Array.isArray(annulationsResponse.data) ? annulationsResponse.data : (annulationsResponse.data.results || []);
        
        const today = new Date().toISOString().split('T')[0];
        const rdvToday = rdvData.filter(rdv => 
          rdv.date_heure.startsWith(today) && ['en_attente', 'confirme'].includes(rdv.statut)
        );
        
        setStats({
          total_rdv: rdvData.length,
          rdv_aujourdhui: rdvToday.length,
          total_praticiens: praticiensData.length,
          total_patients: patientsData.length,
          annulations_attente: annulationsData.length,
        });
        
        setRdvList(rdvData.slice(0, 10));
        
      } else if (isPraticien) {
        // Stats praticien
        const rdvResponse = await rdvAPI.getAll();
        const rdvData = Array.isArray(rdvResponse.data) ? rdvResponse.data : (rdvResponse.data.results || []);
        const praticienRdv = rdvData.filter(rdv => 
          rdv.praticien.id === user.praticien_profile.id
        );
        
        const today = new Date().toISOString().split('T')[0];
        const rdvToday = praticienRdv.filter(rdv => 
          rdv.date_heure.startsWith(today) && ['en_attente', 'confirme'].includes(rdv.statut)
        );
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const rdvWeek = praticienRdv.filter(rdv => {
          const rdvDate = new Date(rdv.date_heure);
          return rdvDate >= new Date() && rdvDate <= nextWeek && ['en_attente', 'confirme'].includes(rdv.statut);
        });
        
        setStats({
          rdv_aujourdhui: rdvToday.length,
          rdv_semaine: rdvWeek.length,
        });
        
        setRdvList(rdvToday.sort((a, b) => new Date(a.date_heure) - new Date(b.date_heure)));
        
      } else if (isPatient) {
        // Stats patient
        const rdvResponse = await rdvAPI.getAll();
        const rdvData = Array.isArray(rdvResponse.data) ? rdvResponse.data : (rdvResponse.data.results || []);
        const patientRdv = rdvData.filter(rdv => 
          rdv.patient.id === user.patient_profile.id
        );
        
        const rdvFuturs = patientRdv.filter(rdv => {
          const rdvDate = new Date(rdv.date_heure);
          return rdvDate >= new Date() && ['en_attente', 'confirme'].includes(rdv.statut);
        });
        
        const rdvPasses = patientRdv.filter(rdv => {
          const rdvDate = new Date(rdv.date_heure);
          return rdvDate < new Date();
        }).slice(0, 5);
        
        setStats({
          rdv_futurs: rdvFuturs.length,
          rdv_passes: rdvPasses.length,
        });
        
        setRdvList(rdvFuturs.sort((a, b) => new Date(a.date_heure) - new Date(b.date_heure)));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      en_attente: { color: 'badge-warning', label: 'En attente' },
      confirme: { color: 'badge-success', label: 'Confirmé' },
      annule: { color: 'badge-danger', label: 'Annulé' },
      absence: { color: 'badge-info', label: 'Absence' },
    };
    
    const badge = badges[statut] || { color: 'badge-info', label: statut };
    return <span className={`badge ${badge.color}`}>{badge.label}</span>;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="mt-2 text-gray-600">
          Bienvenue {user.first_name} {user.last_name}
        </p>
      </div>

      {/* Statistiques - Admin */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total RDV</p>
                  <p className="text-3xl font-bold mt-2">{stats.total_rdv}</p>
                </div>
                <FaCalendarAlt className="text-5xl text-blue-200 opacity-50" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">RDV Aujourd'hui</p>
                  <p className="text-3xl font-bold mt-2">{stats.rdv_aujourdhui}</p>
                </div>
                <FaClock className="text-5xl text-green-200 opacity-50" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Praticiens Actifs</p>
                  <p className="text-3xl font-bold mt-2">{stats.total_praticiens}</p>
                </div>
                <FaUserMd className="text-5xl text-purple-200 opacity-50" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Patients</p>
                  <p className="text-3xl font-bold mt-2">{stats.total_patients}</p>
                </div>
                <FaUsers className="text-5xl text-pink-200 opacity-50" />
              </div>
            </div>
          </div>

          {stats.annulations_attente > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-600 text-xl mr-3" />
                <div>
                  <p className="text-yellow-800 font-medium">
                    {stats.annulations_attente} demande{stats.annulations_attente > 1 ? 's' : ''} d'annulation en attente
                  </p>
                  <Link to="/annulations" className="text-yellow-700 text-sm underline">
                    Voir les demandes
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Statistiques - Praticien */}
      {isPraticien && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">RDV Aujourd'hui</p>
                <p className="text-3xl font-bold mt-2">{stats.rdv_aujourdhui}</p>
              </div>
              <FaClock className="text-5xl text-blue-200 opacity-50" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">RDV Cette Semaine</p>
                <p className="text-3xl font-bold mt-2">{stats.rdv_semaine}</p>
              </div>
              <FaCalendarAlt className="text-5xl text-green-200 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides - Patient */}
      {isPatient && (
        <div className="mb-8">
          <Link 
            to="/rendez-vous/create" 
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            <FaPlus className="mr-2" />
            Prendre un rendez-vous
          </Link>
        </div>
      )}

      {/* Liste des rendez-vous */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isPatient ? 'Mes prochains rendez-vous' : 
             isPraticien ? 'Rendez-vous du jour' : 
             'Rendez-vous récents'}
          </h2>
          <Link to="/rendez-vous" className="text-primary-600 hover:text-primary-700 font-medium">
            Voir tout →
          </Link>
        </div>

        {rdvList.length === 0 ? (
          <div className="text-center py-12">
            <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">
              {isPatient ? 'Vous n\'avez aucun rendez-vous à venir' : 'Aucun rendez-vous'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rdvList.map((rdv) => (
              <Link
                key={rdv.id}
                to={`/rendez-vous/${rdv.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FaCalendarAlt className="text-primary-600" />
                      <span className="font-medium text-gray-900">
                        {format(new Date(rdv.date_heure), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </span>
                      {getStatutBadge(rdv.statut)}
                    </div>
                    
                    <div className="ml-6 space-y-1">
                      {!isPatient && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Patient:</span> {rdv.patient.user.first_name} {rdv.patient.user.last_name}
                        </p>
                      )}
                      {!isPraticien && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Praticien:</span> {rdv.praticien.civilite} {rdv.praticien.user.first_name} {rdv.praticien.user.last_name}
                          {rdv.praticien.specialite && ` - ${rdv.praticien.specialite}`}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Motif:</span> {rdv.motif}
                      </p>
                    </div>
                  </div>

                  {isPraticien && rdv.statut === 'en_attente' && (
                    <button className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                      Confirmer
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides - Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link to="/praticiens" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaUserMd className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les praticiens</p>
                <p className="text-sm text-gray-600">Ajouter, modifier, consulter</p>
              </div>
            </div>
          </Link>

          <Link to="/patients" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les patients</p>
                <p className="text-sm text-gray-600">Ajouter, modifier, consulter</p>
              </div>
            </div>
          </Link>

          <Link to="/statistiques" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Statistiques</p>
                <p className="text-sm text-gray-600">Rapports et analyses</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
