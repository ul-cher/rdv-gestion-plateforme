import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rdvAPI } from '../services/api';
import { FaCalendarAlt, FaPlus, FaFilter, FaSearch, FaEye } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RendezVousList = () => {
  const { user, isAdmin, isPraticien, isPatient } = useAuth();
  const [rdvList, setRdvList] = useState([]);
  const [filteredRdv, setFilteredRdv] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    statut: '',
    search: '',
    dateDebut: '',
    dateFin: '',
  });

  useEffect(() => {
    fetchRendezVous();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, rdvList]);

  const fetchRendezVous = async () => {
    try {
      setLoading(true);
      const response = await rdvAPI.getAll();
      // L'API peut retourner un tableau directement ou un objet avec results
      let data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Rendez-vous fetched:', data);

      // Filtrer selon le rôle
      if (isPraticien && user.praticien_profile) {
        data = data.filter(rdv => rdv.praticien.id === user.praticien_profile.id);
      } else if (isPatient && user.patient_profile) {
        data = data.filter(rdv => rdv.patient.id === user.patient_profile.id);
      }

      setRdvList(data);
      setFilteredRdv(data);
    } catch (error) {
      console.error('Error fetching rendez-vous:', error);
      setRdvList([]);
      setFilteredRdv([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rdvList];

    // Filtre par statut
    if (filters.statut) {
      filtered = filtered.filter(rdv => rdv.statut === filters.statut);
    }

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(rdv => 
        rdv.patient.user.first_name.toLowerCase().includes(searchLower) ||
        rdv.patient.user.last_name.toLowerCase().includes(searchLower) ||
        rdv.praticien.user.first_name.toLowerCase().includes(searchLower) ||
        rdv.praticien.user.last_name.toLowerCase().includes(searchLower) ||
        rdv.motif.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par date
    if (filters.dateDebut) {
      filtered = filtered.filter(rdv => new Date(rdv.date_heure) >= new Date(filters.dateDebut));
    }
    if (filters.dateFin) {
      filtered = filtered.filter(rdv => new Date(rdv.date_heure) <= new Date(filters.dateFin));
    }

    setFilteredRdv(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="mt-2 text-gray-600">
            {filteredRdv.length} rendez-vous trouvé{filteredRdv.length > 1 ? 's' : ''}
          </p>
        </div>
        {isPatient && (
          <Link to="/rendez-vous/create" className="btn btn-primary flex items-center">
            <FaPlus className="mr-2" />
            Nouveau rendez-vous
          </Link>
        )}
        {isAdmin && (
          <Link to="/rendez-vous/calendrier" className="btn btn-primary flex items-center">
            <FaCalendarAlt className="mr-2" />
            Vue calendrier
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <FaFilter className="text-gray-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="input pl-10"
                placeholder="Patient, praticien, motif..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              name="statut"
              value={filters.statut}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirme">Confirmé</option>
              <option value="annule">Annulé</option>
              <option value="absence">Absence</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date début
            </label>
            <input
              type="date"
              name="dateDebut"
              value={filters.dateDebut}
              onChange={handleFilterChange}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date fin
            </label>
            <input
              type="date"
              name="dateFin"
              value={filters.dateFin}
              onChange={handleFilterChange}
              className="input"
            />
          </div>
        </div>

        {(filters.search || filters.statut || filters.dateDebut || filters.dateFin) && (
          <button
            onClick={() => setFilters({ statut: '', search: '', dateDebut: '', dateFin: '' })}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Liste des rendez-vous */}
      {filteredRdv.length === 0 ? (
        <div className="card text-center py-12">
          <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun rendez-vous trouvé</p>
          {isPatient && (
            <Link to="/rendez-vous/create" className="mt-4 inline-block btn btn-primary">
              Prendre un rendez-vous
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRdv.map((rdv) => (
            <div key={rdv.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <FaCalendarAlt className="text-primary-600 text-xl" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(rdv.date_heure), "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(rdv.date_heure), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                    {getStatutBadge(rdv.statut)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
                    {!isPatient && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Patient</p>
                        <p className="text-sm text-gray-600">
                          {rdv.patient.civilite} {rdv.patient.user.first_name} {rdv.patient.user.last_name}
                        </p>
                      </div>
                    )}
                    
                    {!isPraticien && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Praticien</p>
                        <p className="text-sm text-gray-600">
                          {rdv.praticien.civilite} {rdv.praticien.user.first_name} {rdv.praticien.user.last_name}
                        </p>
                        {rdv.praticien.specialite && (
                          <p className="text-xs text-gray-500">{rdv.praticien.specialite}</p>
                        )}
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">Motif</p>
                      <p className="text-sm text-gray-600">{rdv.motif}</p>
                    </div>

                    {rdv.notes && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700">Notes</p>
                        <p className="text-sm text-gray-600">{rdv.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <Link
                    to={`/rendez-vous/${rdv.id}`}
                    className="btn btn-secondary flex items-center text-sm"
                  >
                    <FaEye className="mr-2" />
                    Détails
                  </Link>
                  
                  {isPraticien && rdv.statut === 'en_attente' && (
                    <button className="btn btn-success text-sm">
                      Confirmer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RendezVousList;
