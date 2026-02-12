# Frontend React - Plateforme de Gestion des Rendez-vous

Application frontend React moderne pour la plateforme de gestion de rendez-vous médicaux.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 16+ et npm
- Backend Django lancé sur `http://127.0.0.1:8000`

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:3000
```

## 📋 Fonctionnalités

### ✅ Implémenté
- ✅ Authentification (Login/Register)
- ✅ Tableau de bord selon le rôle (Admin/Praticien/Patient)
- ✅ Liste des rendez-vous avec filtres
- ✅ Navigation responsive
- ✅ Protection des routes par rôle
- ✅ Gestion des états de chargement
- ✅ Interface moderne avec Tailwind CSS

### 🚧 À Implémenter
- Création de rendez-vous (patients)
- Détails d'un rendez-vous
- Gestion des praticiens (admin)
- Gestion des patients (admin/praticien)
- Gestion des annulations
- Calendrier des rendez-vous
- Statistiques et graphiques
- Logs système
- Export de rapports

## 🏗️ Architecture

```
rdv-frontend/
├── public/                 # Fichiers statiques
├── src/
│   ├── components/        # Composants réutilisables
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/          # Contextes React
│   │   └── AuthContext.jsx
│   ├── pages/             # Pages de l'application
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   └── RendezVousList.jsx
│   ├── services/          # Services API
│   │   └── api.js
│   ├── App.jsx            # Composant principal
│   ├── main.jsx           # Point d'entrée
│   └── index.css          # Styles globaux
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🔑 Comptes de Test

### Administrateur
- **Username:** `admin`
- **Password:** `admin123`

### Praticien
- **Username:** `dr_martin`
- **Password:** `praticien123`

### Patient
- **Username:** `patient1`
- **Password:** `patient123`

## 🛠️ Technologies

- **React 18** - Framework UI
- **React Router 6** - Routing
- **Axios** - Requêtes HTTP
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **date-fns** - Manipulation de dates
- **React Icons** - Icônes

## 🔌 API Backend

Le frontend communique avec le backend Django via l'API REST :

### Endpoints principaux
```
POST   /api/auth/login/              # Connexion
POST   /api/auth/logout/             # Déconnexion
POST   /api/auth/register/           # Inscription
GET    /api/auth/user/               # Utilisateur courant

GET    /api/praticiens/              # Liste praticiens
GET    /api/praticiens/:id/          # Détails praticien
POST   /api/praticiens/              # Créer praticien
PUT    /api/praticiens/:id/          # Modifier praticien

GET    /api/patients/                # Liste patients
GET    /api/patients/:id/            # Détails patient
POST   /api/patients/                # Créer patient
PUT    /api/patients/:id/            # Modifier patient

GET    /api/rendez-vous/             # Liste RDV
GET    /api/rendez-vous/:id/         # Détails RDV
POST   /api/rendez-vous/             # Créer RDV
POST   /api/rendez-vous/:id/confirmer/ # Confirmer RDV

GET    /api/annulations/             # Liste annulations
POST   /api/annulations/create/:id/  # Demander annulation
POST   /api/annulations/:id/accepter/ # Accepter annulation

GET    /api/statistiques/            # Statistiques
GET    /api/logs/                    # Logs système
```

## 🎨 Personnalisation

### Couleurs (tailwind.config.js)
Les couleurs principales peuvent être modifiées :
```javascript
colors: {
  primary: { ... },  // Bleu par défaut
  success: { ... },  // Vert
  warning: { ... },  // Jaune/Orange
  danger: { ... },   // Rouge
}
```

## 📝 Scripts disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Production
npm run build        # Compile pour la production
npm run preview      # Prévisualise le build de production
```

## 🔐 Sécurité

- Authentification par token JWT
- Protection CSRF pour les requêtes POST/PUT/DELETE
- Routes protégées par rôle
- Validation des formulaires côté client

## 🐛 Débogage

### Problèmes courants

**1. CORS errors**
- Vérifier que le backend Django a bien configuré CORS
- Ajouter `http://localhost:3000` dans `ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS`

**2. 401 Unauthorized**
- Vérifier que le token est bien stocké dans localStorage
- Vérifier que le backend accepte le token Bearer

**3. Proxy errors**
- Vérifier que le backend Django tourne sur le port 8000
- Vérifier la configuration proxy dans `vite.config.js`

## 📦 Build pour Production

```bash
# 1. Build
npm run build

# 2. Les fichiers sont dans dist/
# 3. Déployer le contenu de dist/ sur votre serveur
```

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :

1. Créer un nouveau composant dans `src/pages/` ou `src/components/`
2. Ajouter la route dans `src/App.jsx`
3. Créer les appels API dans `src/services/api.js`
4. Tester avec les comptes de test

## 📄 Licence

Projet académique - Master ESILV M1
Module : Python for Data Engineering
Année : 2026

## ✨ Prochaines Améliorations

- [ ] Notification toast pour les actions
- [ ] Pagination pour les listes
- [ ] Recherche avancée
- [ ] Thème sombre
- [ ] PWA pour mobile
- [ ] Tests unitaires et E2E
- [ ] Internationalisation (i18n)
- [ ] Graphiques interactifs avec Recharts
