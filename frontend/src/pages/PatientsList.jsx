import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientsAPI } from '../services/api';
import { FaUsers, FaPlus, FaSearch, FaPhone, FaEdit, FaTrash, FaCalendar } from 'react-icons/fa';

const PatientsList = () => {
  const { isAdmin, isPraticien } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsAPI.getAll();
      // L'API peut retourner un tableau directement ou un objet avec results
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Patients fetched:', data);
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...patients];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.user.first_name.toLowerCase().includes(searchLower) ||
        p.user.last_name.toLowerCase().includes(searchLower) ||
        p.telephone.includes(searchTerm)
      );
    }

    setFilteredPatients(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      try {
        await patientsAPI.delete(id);
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="mt-2 text-gray-600">
            {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} trouvé{filteredPatients.length > 1 ? 's' : ''}
          </p>
        </div>
        {(isAdmin || isPraticien) && (
          <Link to="/patients/create" className="btn btn-primary flex items-center">
            <FaPlus className="mr-2" />
            Nouveau patient
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="max-w-md">
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
              placeholder="Nom, prénom, téléphone..."
            />
          </div>
        </div>
      </div>

      {/* Liste des patients */}
      {filteredPatients.length === 0 ? (
        <div className="card text-center py-12">
          <FaUsers className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun patient trouvé</p>
          {(isAdmin || isPraticien) && (
            <Link to="/patients/create" className="mt-4 inline-block btn btn-primary">
              Ajouter un patient
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="card hover:shadow-lg transition-shadow">
              {/* Photo */}
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {patient.user.first_name?.[0]}{patient.user.last_name?.[0]}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {patient.civilite} {patient.user.first_name} {patient.user.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{patient.age} ans</p>
                </div>
              </div>

              {/* Informations */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaPhone className="mr-2" />
                  {patient.telephone}
                </div>
                <div className="text-sm text-gray-600">
                  Né(e) le: {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                </div>
                {patient.adresse && (
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {patient.adresse}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <Link
                  to={`/patients/${patient.id}`}
                  className="flex-1 btn btn-secondary text-sm flex items-center justify-center"
                >
                  <FaCalendar className="mr-2" />
                  Voir dossier
                </Link>
                {(isAdmin || isPraticien) && (
                  <>
                    <Link
                      to={`/patients/${patient.id}/edit`}
                      className="btn btn-secondary text-sm p-2"
                      title="Modifier"
                    >
                      <FaEdit />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="btn btn-danger text-sm p-2"
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    )}
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

export default PatientsList;
