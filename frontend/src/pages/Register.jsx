import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCalendarAlt, FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaCalendar, FaSpinner } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    civilite: 'M',
    telephone: '',
    adresse: '',
    date_naissance: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    if (formData.password !== formData.password2) {
      setErrors({ password2: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setLoading(true);
    const result = await register(formData);
    
    if (result.success) {
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } else {
      setErrors(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <FaCalendarAlt className="text-white text-3xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Créer un compte patient
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Inscrivez-vous pour prendre rendez-vous
            </p>
          </div>

          {/* Formulaire d'inscription */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.non_field_errors && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.non_field_errors}
              </div>
            )}

            {/* Informations de compte */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations de connexion</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Nom d'utilisateur"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="email@exemple.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Mot de passe"
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      name="password2"
                      type="password"
                      required
                      value={formData.password2}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Confirmer le mot de passe"
                    />
                  </div>
                  {errors.password2 && <p className="mt-1 text-sm text-red-600">{errors.password2}</p>}
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
              
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
                  >
                    <option value="M">Monsieur</option>
                    <option value="Mme">Madame</option>
                    <option value="Mlle">Mademoiselle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Prénom"
                  />
                  {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Nom"
                  />
                  {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400" />
                    </div>
                    <input
                      name="telephone"
                      type="tel"
                      required
                      value={formData.telephone}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                  {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendar className="text-gray-400" />
                    </div>
                    <input
                      name="date_naissance"
                      type="date"
                      required
                      value={formData.date_naissance}
                      onChange={handleChange}
                      className="input pl-10"
                    />
                  </div>
                  {errors.date_naissance && <p className="mt-1 text-sm text-red-600">{errors.date_naissance}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse *
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <textarea
                    name="adresse"
                    required
                    value={formData.adresse}
                    onChange={handleChange}
                    rows="3"
                    className="input pl-10"
                    placeholder="Adresse complète"
                  />
                </div>
                {errors.adresse && <p className="mt-1 text-sm text-red-600">{errors.adresse}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire'
              )}
            </button>
          </form>

          {/* Lien connexion */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
