import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const PatientsCreate = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    civilite: '',        // M ou F
    first_name: '',
    last_name: '',
    telephone: '',
    adresse: '',
    email: '',
    date_naissance: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.civilite) newErrors.civilite = 'Veuillez sélectionner une civilité';
    if (!formData.first_name) newErrors.first_name = 'Prénom obligatoire';
    if (!formData.last_name) newErrors.last_name = 'Nom obligatoire';
    if (!formData.telephone) newErrors.telephone = 'Téléphone obligatoire';
    if (!formData.adresse) newErrors.adresse = 'Adresse obligatoire';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await patientsAPI.create(formData);
      alert('Patient créé avec succès !');
      navigate('/patients');
    } catch (error) {
      console.error('Erreur lors de la création du patient:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        alert('Erreur de connexion au serveur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/patients')}
        className="btn btn-secondary mb-6 flex items-center"
      >
        <FaArrowLeft className="mr-2" /> Retour
      </button>

      <h1 className="text-3xl font-bold mb-6">Créer un nouveau patient</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Civilité */}
        <div>
          <label className="block text-sm font-medium mb-2">Civilité *</label>
          <select
            name="civilite"
            value={formData.civilite}
            onChange={handleChange}
            className={`input ${errors.civilite ? 'border-red-500' : ''}`}
            required
          >
            <option value="">Sélectionnez</option>
            <option value="M">M.</option>
            <option value="F">Mme</option>
          </select>
          {errors.civilite && <p className="text-red-600 text-sm mt-1">{errors.civilite}</p>}
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium mb-2">Prénom *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={`input ${errors.first_name ? 'border-red-500' : ''}`}
            required
          />
          {errors.first_name && <p className="text-red-600 text-sm mt-1">{errors.first_name}</p>}
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium mb-2">Nom *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={`input ${errors.last_name ? 'border-red-500' : ''}`}
            required
          />
          {errors.last_name && <p className="text-red-600 text-sm mt-1">{errors.last_name}</p>}
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium mb-2">Téléphone *</label>
          <input
            type="text"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            className={`input ${errors.telephone ? 'border-red-500' : ''}`}
            required
          />
          {errors.telephone && <p className="text-red-600 text-sm mt-1">{errors.telephone}</p>}
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium mb-2">Adresse *</label>
          <input
            type="text"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            className={`input ${errors.adresse ? 'border-red-500' : ''}`}
            required
          />
          {errors.adresse && <p className="text-red-600 text-sm mt-1">{errors.adresse}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* Date de naissance */}
        <div>
          <label className="block text-sm font-medium mb-2">Date de naissance</label>
          <input
            type="date"
            name="date_naissance"
            value={formData.date_naissance}
            onChange={handleChange}
            className="input"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input"
            rows="3"
          />
        </div>

        {/* Boutons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/patients')}
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FaSave className="mr-2" />
            )}
            Créer le patient
          </button>
        </div>

      </form>
    </div>
  );
};

export default PatientsCreate;
