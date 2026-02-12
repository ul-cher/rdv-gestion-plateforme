import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { rdvAPI, praticiensAPI, patientsAPI } from '../services/api';
import { FaCalendarPlus, FaArrowLeft, FaSave } from 'react-icons/fa';

const RendezVousCreate = () => {
  const navigate = useNavigate();
  const { user, isPatient, isAdmin, isPraticien } = useAuth();
  
  const [formData, setFormData] = useState({
    praticien_id: '',
    patient_id: isPatient ? user.patient_profile?.id : '',
    date_heure: '',
    motif: '',
    notes: ''
  });
  
  const [praticiens, setPraticiens] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPraticiens();
    if (!isPatient) {
      fetchPatients();
    }
  }, [isPatient]);

  const fetchPraticiens = async () => {
    try {
      const response = await praticiensAPI.getAll({ actif: true });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setPraticiens(data);
    } catch (error) {
      console.error('Error fetching praticiens:', error);
      setPraticiens([]);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.praticien_id) {
      newErrors.praticien_id = 'Veuillez sélectionner un praticien';
    }
    
    if (!isPatient && !formData.patient_id) {
      newErrors.patient_id = 'Veuillez sélectionner un patient';
    }
    
    if (!formData.date_heure) {
      newErrors.date_heure = 'Veuillez sélectionner une date et heure';
    } else {
      const selectedDate = new Date(formData.date_heure);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.date_heure = 'La date doit être dans le futur';
      }
    }
    
    if (!formData.motif || formData.motif.trim().length < 5) {
      newErrors.motif = 'Le motif doit contenir au moins 5 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await rdvAPI.create(formData);
      alert('Rendez-vous créé avec succès !');
      navigate('/rendez-vous');
    } catch (error) {
      console.error('Error creating RDV:', error);
      if (error.response?.data) {
        const apiErrors = error.response.data;
        if (typeof apiErrors === 'object') {
          setErrors(apiErrors);
        } else {
          alert('Erreur lors de la création du rendez-vous');
        }
      } else {
        alert('Erreur de connexion au serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/rendez-vous')}
          className="btn btn-secondary mb-4 flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaCalendarPlus className="mr-3 text-primary-600" />
          Nouveau Rendez-vous
        </h1>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Praticien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Praticien *
            </label>
            <select
              name="praticien_id"
              value={formData.praticien_id}
              onChange={handleChange}
              className={`input ${errors.praticien_id ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Sélectionnez un praticien</option>
              {praticiens.map((praticien) => (
                <option key={praticien.id} value={praticien.id}>
                  {praticien.civilite} {praticien.user.first_name} {praticien.user.last_name} - {praticien.specialite}
                </option>
              ))}
            </select>
            {errors.praticien_id && (
              <p className="mt-1 text-sm text-red-600">{errors.praticien_id}</p>
            )}
          </div>

          {/* Patient (si admin ou praticien) */}
          {!isPatient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              <select
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                className={`input ${errors.patient_id ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Sélectionnez un patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.civilite} {patient.user.first_name} {patient.user.last_name}
                  </option>
                ))}
              </select>
              {errors.patient_id && (
                <p className="mt-1 text-sm text-red-600">{errors.patient_id}</p>
              )}
            </div>
          )}

          {/* Date et heure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure *
            </label>
            <input
              type="datetime-local"
              name="date_heure"
              value={formData.date_heure}
              onChange={handleChange}
              className={`input ${errors.date_heure ? 'border-red-500' : ''}`}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
            {errors.date_heure && (
              <p className="mt-1 text-sm text-red-600">{errors.date_heure}</p>
            )}
          </div>

          {/* Motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif de consultation *
            </label>
            <textarea
              name="motif"
              value={formData.motif}
              onChange={handleChange}
              className={`input ${errors.motif ? 'border-red-500' : ''}`}
              rows="4"
              placeholder="Décrivez le motif de votre consultation..."
              required
            />
            {errors.motif && (
              <p className="mt-1 text-sm text-red-600">{errors.motif}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Minimum 5 caractères
            </p>
          </div>

          {/* Notes (optionnel pour admin/praticien) */}
          {(isAdmin || isPraticien) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes internes (optionnel)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Notes internes..."
              />
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/rendez-vous')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Créer le rendez-vous
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Informations */}
      <div className="mt-6 card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informations</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le rendez-vous sera créé avec le statut "En attente"</li>
          <li>• Le praticien devra confirmer le rendez-vous</li>
          <li>• Vous recevrez une notification de confirmation</li>
          <li>• L'annulation doit être faite au moins 24h à l'avance</li>
        </ul>
      </div>
    </div>
  );
};

export default RendezVousCreate;
