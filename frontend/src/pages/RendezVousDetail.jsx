import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rdvAPI, annulationsAPI } from '../services/api';
import { FaArrowLeft, FaCheck, FaBan, FaCalendarAlt, FaClock, FaUser, FaUserMd, FaNotesMedical } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RendezVousDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isPraticien, isPatient } = useAuth();
  const [rdv, setRdv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAnnulationModal, setShowAnnulationModal] = useState(false);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  useEffect(() => {
    fetchRdvDetail();
  }, [id]);

  const fetchRdvDetail = async () => {
    try {
      setLoading(true);
      const response = await rdvAPI.getById(id);
      setRdv(response.data);
    } catch (error) {
      console.error('Error fetching RDV:', error);
      alert('Erreur lors du chargement du rendez-vous');
      navigate('/rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmer = async () => {
    if (!window.confirm('Confirmer ce rendez-vous ?')) return;

    try {
      setActionLoading(true);
      await rdvAPI.confirmer(id);
      alert('Rendez-vous confirmé avec succès');
      fetchRdvDetail();
    } catch (error) {
      console.error('Error confirming RDV:', error);
      alert('Erreur lors de la confirmation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnuler = async () => {
    if (!motifAnnulation.trim()) {
      alert('Veuillez indiquer un motif d\'annulation');
      return;
    }

    try {
      setActionLoading(true);
      await annulationsAPI.create(id, { motif: motifAnnulation });
      alert('Demande d\'annulation envoyée avec succès');
      setShowAnnulationModal(false);
      fetchRdvDetail();
    } catch (error) {
      console.error('Error creating annulation:', error);
      alert('Erreur lors de la demande d\'annulation');
    } finally {
      setActionLoading(false);
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

  const canConfirm = (isAdmin || isPraticien) && rdv?.statut === 'en_attente';
  const canCancel = isPatient && ['en_attente', 'confirme'].includes(rdv?.statut);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!rdv) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Rendez-vous introuvable</p>
          <Link to="/rendez-vous" className="btn btn-primary">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/rendez-vous')}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Retour à la liste
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Détails du Rendez-vous</h1>
            <p className="mt-2 text-gray-600">RDV #{rdv.id}</p>
          </div>
          <span className={getStatutBadge(rdv.statut)}>
            {getStatutLabel(rdv.statut)}
          </span>
        </div>
      </div>

      {/* Informations du RDV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Date et Heure */}
        <div className="card">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaCalendarAlt className="text-primary-600 text-xl" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Date et Heure</h3>
              <p className="text-gray-700">
                {format(new Date(rdv.date_heure), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {format(new Date(rdv.date_heure), 'HH:mm')}
              </p>
            </div>
          </div>
        </div>

        {/* Patient */}
        <div className="card">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient</h3>
              <p className="text-gray-700 font-medium">
                {rdv.patient.civilite} {rdv.patient.user.first_name} {rdv.patient.user.last_name}
              </p>
              <p className="text-sm text-gray-600 mt-1">{rdv.patient.age} ans</p>
              <p className="text-sm text-gray-600">{rdv.patient.telephone}</p>
            </div>
          </div>
        </div>

        {/* Praticien */}
        <div className="card">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUserMd className="text-green-600 text-xl" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Praticien</h3>
              <p className="text-gray-700 font-medium">
                {rdv.praticien.civilite} {rdv.praticien.user.first_name} {rdv.praticien.user.last_name}
              </p>
              <p className="text-sm text-gray-600 mt-1">{rdv.praticien.specialite}</p>
              <p className="text-sm text-gray-600">{rdv.praticien.telephone}</p>
            </div>
          </div>
        </div>

        {/* Motif */}
        <div className="card">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaNotesMedical className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Motif</h3>
              <p className="text-gray-700">{rdv.motif || 'Non spécifié'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {rdv.notes && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{rdv.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {canConfirm && (
            <button
              onClick={handleConfirmer}
              disabled={actionLoading}
              className="btn btn-success flex items-center"
            >
              <FaCheck className="mr-2" />
              Confirmer le rendez-vous
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setShowAnnulationModal(true)}
              disabled={actionLoading}
              className="btn btn-danger flex items-center"
            >
              <FaBan className="mr-2" />
              Demander l'annulation
            </button>
          )}

          {!canConfirm && !canCancel && (
            <p className="text-gray-600 italic">
              Aucune action disponible pour ce rendez-vous
            </p>
          )}
        </div>
      </div>

      {/* Modal d'annulation */}
      {showAnnulationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Demande d'annulation
            </h3>
            <p className="text-gray-600 mb-4">
              Veuillez indiquer le motif de votre demande d'annulation :
            </p>
            <textarea
              value={motifAnnulation}
              onChange={(e) => setMotifAnnulation(e.target.value)}
              className="input mb-4"
              rows={4}
              placeholder="Motif de l'annulation..."
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAnnulationModal(false);
                  setMotifAnnulation('');
                }}
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleAnnuler}
                className="btn btn-danger"
                disabled={actionLoading || !motifAnnulation.trim()}
              >
                {actionLoading ? 'Envoi...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Créé le {format(new Date(rdv.date_creation), 'dd/MM/yyyy à HH:mm')}
        {rdv.date_modification && (
          <> • Modifié le {format(new Date(rdv.date_modification), 'dd/MM/yyyy à HH:mm')}</>
        )}
      </div>
    </div>
  );
};

export default RendezVousDetail;
