import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les réponses et extraire les données paginées
api.interceptors.response.use(
  (response) => {
    // Si la réponse contient un objet avec 'results' (pagination DRF), extraire les résultats
    if (response.data && typeof response.data === 'object' && 'results' in response.data && Array.isArray(response.data.results)) {
      // Conserver les métadonnées de pagination dans une propriété spéciale
      response.data = response.data.results;
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Rediriger vers login si on n'est pas déjà sur la page login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      console.error('Network Error:', error.request);
      console.error('Vérifiez que le backend tourne sur http://127.0.0.1:8000');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  register: (userData) => api.post('/auth/register/', userData),
  getCurrentUser: () => api.get('/auth/user/'),
};

// Praticiens
export const praticiensAPI = {
  getAll: (params) => api.get('/praticiens/', { params }),
  getById: (id) => api.get(`/praticiens/${id}/`),
  create: (data) => api.post('/praticiens/', data),
  update: (id, data) => api.put(`/praticiens/${id}/`, data),
  delete: (id) => api.delete(`/praticiens/${id}/`),
  getHoraires: (id) => api.get(`/praticiens/${id}/horaires/`),
  createHoraire: (id, data) => api.post(`/praticiens/${id}/horaires/`, data),
  getIndisponibilites: (id) => api.get(`/praticiens/${id}/indisponibilites/`),
  createIndisponibilite: (id, data) => api.post(`/praticiens/${id}/indisponibilites/`, data),
};

// Patients
export const patientsAPI = {
  getAll: (params) => api.get('/patients/', { params }),
  getById: (id) => api.get(`/patients/${id}/`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.put(`/patients/${id}/`, data),
  delete: (id) => api.delete(`/patients/${id}/`),
};

// Rendez-vous
export const rdvAPI = {
  getAll: (params) => api.get('/rendez-vous/', { params }),
  getById: (id) => api.get(`/rendez-vous/${id}/`),
  create: (data) => api.post('/rendez-vous/', data),
  update: (id, data) => api.put(`/rendez-vous/${id}/`, data),
  delete: (id) => api.delete(`/rendez-vous/${id}/`),
  confirmer: (id) => api.post(`/rendez-vous/${id}/confirmer/`),
  getCalendrier: (params) => api.get('/rendez-vous/calendrier/', { params }),
};

// Annulations
export const annulationsAPI = {
  getAll: (params) => api.get('/annulations/', { params }),
  create: (rdvId, data) => api.post(`/annulations/`, { rdv_id: rdvId, ...data }),
  accepter: (id) => api.post(`/annulations/${id}/accepter/`),
  refuser: (id) => api.post(`/annulations/${id}/refuser/`),
};

// Rappels
export const rappelsAPI = {
  getAll: (params) => api.get('/rappels/', { params }),
};

// Statistiques
export const statistiquesAPI = {
  getDashboard: () => api.get('/statistiques/'),
};

// Logs
export const logsAPI = {
  getAll: (params) => api.get('/logs/', { params }),
};

export default api;