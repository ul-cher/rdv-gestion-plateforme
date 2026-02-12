import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { praticiensAPI, rdvAPI } from '../services/api';
import { FaArrowLeft, FaEdit, FaUserMd, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PraticienPlanning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [praticien, setPraticien] = useState(null);
  const [rdvList, setRdvList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPraticienDetail();
    fetchPraticienRdv();
  }, [id]);

  const fetchPraticienDetail = async () => {
    try {
      setLoading(true);
      const response = await praticiensAPI.getById(id);
      setPraticien(response.data);
    } catch (error) {
      console.error('Error fetching praticien:', error);
      alert('Erreur lors du chargement du praticien');
      navigate('/praticiens');
    } finally {
      setLoading(false);
    }
  };

  const fetchPraticienRdv = async () => {
    try {
      const response = await rdvAPI.getAll({ praticien_id: id });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setRdvList(data);
    } catch (error) {
      console.error('Error fetching praticien RDV:', error);
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      'en_attente': 'badge badge-warning',
      'confirme': 'badge badge-success',
      'annule': 'badge badge-danger',
      'termine': 'badge badge-info',
      'absence': 'badge badge-danger'
    };
    return badges[statut] || 'badge';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'en_attente': 'En attente',
      'confirme': 'Confirmé',
      'annule': 'Annulé',
      'termine': 'Terminé',
      'absence': 'Absence'
    };
    return labels[statut] || statut;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!praticien) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Praticien introuvable</p>
          <Link to="/praticiens" className="btn btn-primary">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/praticiens')}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Retour à la liste
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-2xl mr-4">
              {praticien.user.first_name?.[0]}{praticien.user.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {praticien.civilite} {praticien.user.first_name} {praticien.user.last_name}
              </h1>
              <p className="mt-2 text-gray-600">{praticien.specialite}</p>
            </div>
          </div>
          <Link
            to={`/praticiens/${praticien.id}/edit`}
            className="btn btn-primary flex items-center"
          >
            <FaEdit className="mr-2" />
            Modifier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Informations */}
        <div className="lg:col-span-1 space-y-6">
          {/* Informations */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="text-gray-900">{praticien.telephone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{praticien.user.email}</p>
              </div>
              {praticien.numero_rpps && (
                <div>
                  <p className="text-sm text-gray-600">Numéro RPPS</p>
                  <p className="text-gray-900">{praticien.numero_rpps}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <span className={praticien.actif ? 'badge badge-success' : 'badge badge-danger'}>
                  {praticien.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="card bg-primary-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total RDV</span>
                <span className="font-bold text-primary-600">{rdvList.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RDV confirmés</span>
                <span className="font-bold text-green-600">
                  {rdvList.filter(rdv => rdv.statut === 'confirme').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">En attente</span>
                <span className="font-bold text-yellow-600">
                  {rdvList.filter(rdv => rdv.statut === 'en_attente').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite - Planning */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Planning des rendez-vous
              </h3>
              <Link to="/rendez-vous/create" className="btn btn-primary text-sm">
                + Nouveau RDV
              </Link>
            </div>

            {rdvList.length === 0 ? (
              <div className="text-center py-12">
                <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Aucun rendez-vous</p>
                <Link to="/rendez-vous/create" className="btn btn-primary">
                  Créer un rendez-vous
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rdvList.sort((a, b) => new Date(b.date_heure) - new Date(a.date_heure)).map((rdv) => (
                  <Link
                    key={rdv.id}
                    to={`/rendez-vous/${rdv.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FaCalendarAlt className="text-primary-600" />
                          <p className="font-medium text-gray-900">
                            {format(new Date(rdv.date_heure), 'EEEE d MMMM yyyy', { locale: fr })}
                          </p>
                          <span className={getStatutBadge(rdv.statut)}>
                            {getStatutLabel(rdv.statut)}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-primary-600 mb-2">
                          {format(new Date(rdv.date_heure), 'HH:mm')}
                        </p>
                        <div className="text-sm text-gray-600">
                          <p>
                            <strong>Patient:</strong> {rdv.patient.civilite} {rdv.patient.user.first_name} {rdv.patient.user.last_name}
                          </p>
                          <p>
                            <strong>Âge:</strong> {rdv.patient.age} ans
                          </p>
                          <p>
                            <strong>Motif:</strong> {rdv.motif}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PraticienPlanning;
