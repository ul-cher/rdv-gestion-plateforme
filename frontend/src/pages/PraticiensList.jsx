import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { praticiensAPI } from '../services/api';
import { FaUserMd, FaPlus, FaSearch, FaPhone, FaEdit, FaTrash, FaCalendar } from 'react-icons/fa';

const PraticiensList = () => {
  const { isAdmin } = useAuth();
  const [praticiens, setPraticiens] = useState([]);
  const [filteredPraticiens, setFilteredPraticiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActif, setFilterActif] = useState('all');

  useEffect(() => {
    fetchPraticiens();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterActif, praticiens]);

  const fetchPraticiens = async () => {
    try {
      setLoading(true);
      const response = await praticiensAPI.getAll();
      // L'API peut retourner un tableau directement ou un objet avec results
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Praticiens fetched:', data);
      setPraticiens(data);
      setFilteredPraticiens(data);
    } catch (error) {
      console.error('Error fetching praticiens:', error);
      setPraticiens([]);
      setFilteredPraticiens([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...praticiens];

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.user.first_name.toLowerCase().includes(searchLower) ||
        p.user.last_name.toLowerCase().includes(searchLower) ||
        p.specialite.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut actif
    if (filterActif !== 'all') {
      filtered = filtered.filter(p => 
        filterActif === 'actif' ? p.actif : !p.actif
      );
    }

    setFilteredPraticiens(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce praticien ?')) {
      try {
        await praticiensAPI.delete(id);
        fetchPraticiens();
      } catch (error) {
        console.error('Error deleting praticien:', error);
        alert('Erreur lors de la suppression');
      }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Praticiens</h1>
          <p className="mt-2 text-gray-600">
            {filteredPraticiens.length} praticien{filteredPraticiens.length > 1 ? 's' : ''} trouvé{filteredPraticiens.length > 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Link to="/praticiens/create" className="btn btn-primary flex items-center">
            <FaPlus className="mr-2" />
            Nouveau praticien
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                placeholder="Nom, prénom, spécialité..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value)}
              className="input"
            >
              <option value="all">Tous</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des praticiens */}
      {filteredPraticiens.length === 0 ? (
        <div className="card text-center py-12">
          <FaUserMd className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun praticien trouvé</p>
          {isAdmin && (
            <Link to="/praticiens/create" className="mt-4 inline-block btn btn-primary">
              Ajouter un praticien
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPraticiens.map((praticien) => (
            <div key={praticien.id} className="card hover:shadow-lg transition-shadow">
              {/* Photo */}
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">
                  {praticien.user.first_name?.[0]}{praticien.user.last_name?.[0]}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {praticien.civilite} {praticien.user.first_name} {praticien.user.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{praticien.specialite}</p>
                </div>
                {praticien.actif ? (
                  <span className="badge badge-success">Actif</span>
                ) : (
                  <span className="badge badge-danger">Inactif</span>
                )}
              </div>

              {/* Informations */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaPhone className="mr-2" />
                  {praticien.telephone}
                </div>
                {praticien.numero_rpps && (
                  <div className="text-sm text-gray-600">
                    RPPS: {praticien.numero_rpps}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <Link
                  to={`/praticiens/${praticien.id}/planning`}
                  className="flex-1 btn btn-secondary text-sm flex items-center justify-center"
                >
                  <FaCalendar className="mr-2" />
                  Planning
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      to={`/praticiens/${praticien.id}/edit`}
                      className="btn btn-secondary text-sm p-2"
                      title="Modifier"
                    >
                      <FaEdit />
                    </Link>
                    <button
                      onClick={() => handleDelete(praticien.id)}
                      className="btn btn-danger text-sm p-2"
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PraticiensList;
