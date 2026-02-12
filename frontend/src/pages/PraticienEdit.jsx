import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { praticiensAPI } from '../services/api';
import { FaArrowLeft, FaUserMd } from 'react-icons/fa';

const PraticienEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    civilite: 'Dr',
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    specialite: '',
    numero_rpps: '',
    actif: true
  });

  useEffect(() => {
    fetchPraticien();
  }, [id]);

  const fetchPraticien = async () => {
    try {
      setLoading(true);
      const response = await praticiensAPI.getById(id);
      const praticien = response.data;
      
      setFormData({
        civilite: praticien.civilite,
        first_name: praticien.user.first_name,
        last_name: praticien.user.last_name,
        email: praticien.user.email,
        telephone: praticien.telephone,
        specialite: praticien.specialite,
        numero_rpps: praticien.numero_rpps || '',
        actif: praticien.actif
      });
    } catch (error) {
      console.error('Error fetching praticien:', error);
      alert('Erreur lors du chargement du praticien');
      navigate('/praticiens');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await praticiensAPI.update(id, formData);
      alert('Praticien modifié avec succès');
      navigate('/praticiens');
    } catch (err) {
      console.error('Error updating praticien:', err);
      setError(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/praticiens')}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Retour à la liste
        </button>
        <div className="flex items-center">
          <FaUserMd className="text-3xl text-primary-600 mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifier le praticien</h1>
            <p className="mt-2 text-gray-600">Mettre à jour les informations</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="card">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Civilité *
                </label>
                <select
                  name="civilite"
                  value={formData.civilite}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="Dr">Dr</option>
                  <option value="Pr">Pr</option>
                  <option value="M">M.</option>
                  <option value="Mme">Mme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="0123456789"
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations professionnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialité *
                </label>
                <input
                  type="text"
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="Ex: Cardiologue, Dentiste..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro RPPS
                </label>
                <input
                  type="text"
                  name="numero_rpps"
                  value={formData.numero_rpps}
                  onChange={handleChange}
                  className="input"
                  placeholder="Optionnel"
                />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Praticien actif
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/praticiens')}
              className="btn btn-secondary"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PraticienEdit;
