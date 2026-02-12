import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { annulationsAPI } from '../services/api';
import { FaBan, FaCheck, FaTimes, FaClock, FaFilter } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AnnulationsList = () => {
  const { isAdmin, isPraticien } = useAuth();
  const [annulations, setAnnulations] = useState([]);
  const [filteredAnnulations, setFilteredAnnulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('all');

  useEffect(() => {
    fetchAnnulations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterStatut, annulations]);

  const fetchAnnulations = async () => {
    try {
      setLoading(true);
      const response = await annulationsAPI.getAll();
      // L'API peut retourner un tableau directement ou un objet avec results
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Annulations fetched:', data);
      setAnnulations(data);
      setFilteredAnnulations(data);
    } catch (error) {
      console.error('Error fetching annulations:', error);
      setAnnulations([]);
      setFilteredAnnulations([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...annulations];

    if (filterStatut !== 'all') {
      filtered = filtered.filter(a => a.statut === filterStatut);
    }

    setFilteredAnnulations(filtered);
  };

  const handleAccepter = async (id) => {
    if (window.confirm('Accepter cette demande d\'annulation ?')) {
      try {
        await annulationsAPI.accepter(id);
        alert('Annulation acceptée');
        fetchAnnulations();
      } catch (error) {
        console.error('Error accepting annulation:', error);
        alert('Erreur lors de l\'acceptation');
      }
    }
  };

  const handleRefuser = async (id) => {
    if (window.confirm('Refuser cette demande d\'annulation ?')) {
      try {
        await annulationsAPI.refuser(id);
        alert('Annulation refusée');
        fetchAnnulations();
      } catch (error) {
        console.error('Error refusing annulation:', error);
        alert('Erreur lors du refus');
      }
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      en_attente: { color: 'badge-warning', label: 'En attente', icon: FaClock },
      acceptee: { color: 'badge-success', label: 'Acceptée', icon: FaCheck },
      refusee: { color: 'badge-danger', label: 'Refusée', icon: FaTimes },
    };
    
    const badge = badges[statut] || { color: 'badge-info', label: statut, icon: FaClock };
    const Icon = badge.icon;
    
    return (
      <span className={`badge ${badge.color} flex items-center`}>
        <Icon className="mr-1" />
        {badge.label}
      </span>
    );
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
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaBan className="mr-3 text-red-600" />
          Demandes d'Annulation
        </h1>
        <p className="mt-2 text-gray-600">
          {filteredAnnulations.length} demande{filteredAnnulations.length > 1 ? 's' : ''} trouvée{filteredAnnulations.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <FaFilter className="text-gray-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Filtres</h3>
        </div>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="input"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="acceptee">Acceptée</option>
            <option value="refusee">Refusée</option>
          </select>
        </div>
      </div>

      {/* Liste des annulations */}
      {filteredAnnulations.length === 0 ? (
        <div className="card text-center py-12">
          <FaBan className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune demande d'annulation trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnulations.map((annulation) => (
            <div key={annulation.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* En-tête */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <FaBan className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          Demande d'annulation #{annulation.id}
                        </h3>
                        {getStatutBadge(annulation.statut)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Demandée le {format(new Date(annulation.date_demande), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Informations du RDV */}
                  {annulation.rdv && (
                    <div className="ml-12 space-y-2 mb-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Rendez-vous : </span>
                        <span className="text-gray-600">
                          {format(new Date(annulation.rdv.date_heure), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Patient : </span>
                        <span className="text-gray-600">
                          {annulation.rdv.patient?.civilite} {annulation.rdv.patient?.user?.first_name} {annulation.rdv.patient?.user?.last_name}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Praticien : </span>
                        <span className="text-gray-600">
                          {annulation.rdv.praticien?.civilite} {annulation.rdv.praticien?.user?.first_name} {annulation.rdv.praticien?.user?.last_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Motif */}
                  <div className="ml-12 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Motif :</p>
                    <p className="text-sm text-gray-600">{annulation.motif}</p>
                  </div>

                  {/* Date de traitement */}
                  {annulation.date_traitement && (
                    <div className="ml-12 mt-2 text-sm text-gray-600">
                      Traitée le {format(new Date(annulation.date_traitement), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(isAdmin || isPraticien) && annulation.statut === 'en_attente' && (
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => handleAccepter(annulation.id)}
                      className="btn btn-success text-sm flex items-center"
                    >
                      <FaCheck className="mr-2" />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRefuser(annulation.id)}
                      className="btn btn-danger text-sm flex items-center"
                    >
                      <FaTimes className="mr-2" />
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnulationsList;
