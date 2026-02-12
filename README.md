# 🏥 Plateforme de Gestion des Rendez-vous Médicaux

Une application web complète pour gérer les rendez-vous médicaux avec Django (backend) et React (frontend).

## 📋 Fonctionnalités

### 🔐 Authentification multi-rôles
- **Admin** : Gestion complète de la plateforme
- **Praticien** : Gestion de son planning et confirmations
- **Patient** : Prise de rendez-vous et suivi

### ✨ Fonctionnalités principales
- ✅ Gestion des praticiens (spécialités, horaires, indisponibilités)
- ✅ Gestion des patients (dossiers médicaux)
- ✅ Système de rendez-vous complet
- ✅ Demandes d'annulation
- ✅ Rappels automatiques
- ✅ Statistiques et tableaux de bord
- ✅ Logs système
- ✅ Export PDF/CSV

## 🚀 Installation Rapide

### Prérequis
- Python 3.8+
- Node.js 16+
- npm ou yarn

### 1️⃣ Backend Django

```bash
cd backend

# Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate (Windows)

# Installer dépendances
pip install -r requirements.txt

# Migrations
python manage.py makemigrations
python manage.py migrate

# Créer superuser
python manage.py createsuperuser

# Données de test (optionnel)
python manage.py create_sample_data

# Lancer serveur
python manage.py runserver
```

Backend disponible sur : http://127.0.0.1:8000

### 2️⃣ Frontend React

```bash
cd frontend

# Installer dépendances
npm install

# Lancer dev server
npm run dev
```

Frontend disponible sur : http://localhost:5173

## 🔑 Comptes de Test

| Rôle | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Praticien | dr_martin | praticien123 |
| Patient | patient1 | patient123 |


# 🏗️ Architecture du Projet

## Vue d'ensemble

L'application est structurée en **2 parties indépendantes** :
- **Backend** : API REST Django
- **Frontend** : SPA React

```
┌─────────────────────────────────────────────────────────┐
│                      UTILISATEURS                        │
│              (Admin, Praticiens, Patients)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pages : Login, Dashboard, RDV, Praticiens...   │  │
│  │  Components : Navbar, ProtectedRoute            │  │
│  │  Services : API client (Axios)                  │  │
│  │  State : AuthContext, React Hooks              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON + JWT
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Django)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API ViewSets : DRF + JWT Authentication        │  │
│  │  Models : User, Praticien, Patient, RDV...      │  │
│  │  Serializers : Validation & Transformation      │  │
│  │  Utils : PDF export, Logs, Permissions          │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              BASE DE DONNÉES (SQLite)                    │
│   Users, Praticiens, Patients, RendezVous, Logs...     │
└─────────────────────────────────────────────────────────┘
```

## 📦 Stack Technique

### Backend
- **Framework** : Django 5.0
- **API** : Django REST Framework 3.14
- **Auth** : Simple JWT
- **CORS** : django-cors-headers
- **DB** : SQLite (dev) / PostgreSQL (prod)
- **Files** : Pillow, ReportLab

### Frontend
- **Framework** : React 18
- **Router** : React Router 6
- **HTTP** : Axios
- **UI** : Tailwind CSS
- **Icons** : React Icons
- **Dates** : date-fns
- **Build** : Vite

## 🗂️ Modèles de Données

### User (Custom User Model)
- username, email, password
- first_name, last_name
- **role** : admin / praticien / patient
- Relations : OneToOne avec Praticien ou Patient

### Praticien
- user (OneToOne)
- civilite, specialite, numero_rpps
- telephone, photo, actif
- Relations : HorairePraticien, Indisponibilite, RendezVous

### Patient
- user (OneToOne)
- civilite, telephone, adresse
- date_naissance, photo
- Relations : RendezVous

### RendezVous
- patient (FK), praticien (FK)
- date_heure, motif, notes
- **statut** : en_attente / confirme / annule / absence
- Relations : Annulation, Rappel

### Annulation
- rdv (FK)
- date_demande, motif
- **statut** : en_attente / acceptee / refusee
- date_traitement

### Autres
- **HorairePraticien** : Horaires de consultation
- **Indisponibilite** : Congés et absences
- **Rappel** : Notifications automatiques
- **Log** : Traçabilité des actions

## 🔐 Authentification

### Flow JWT
```
1. Login : POST /api/auth/login/
   → Retour : { token, refresh, user }

2. Stockage : localStorage.setItem('token', token)

3. Requêtes : Header "Authorization: Bearer <token>"

4. Expiration : 1 jour (configurable)

5. Refresh : 7 jours
```

### Permissions par rôle

| Feature | Admin | Praticien | Patient |
|---------|-------|-----------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Voir RDV | Tous | Siens | Siens |
| Créer RDV | ✅ | ✅ | ✅ |
| Confirmer RDV | ✅ | ✅ | ❌ |
| Gérer Praticiens | ✅ | ❌ | ❌ |
| Gérer Patients | ✅ | ✅ | ❌ |
| Annulations | ✅ | ✅ | Demander |
| Statistiques | ✅ | ❌ | ❌ |
| Logs | ✅ | ❌ | ❌ |

## 🔄 Flux de Données

### Création de RDV (Patient)
```
1. Patient remplit formulaire
   └─> Frontend valide données

2. POST /api/rendez-vous/
   └─> Backend valide (date, disponibilité)
   └─> Création en DB avec statut "en_attente"
   └─> Log de l'action

3. Praticien reçoit notification
   └─> Confirme via POST /api/rendez-vous/{id}/confirmer/
   └─> Statut passe à "confirme"

4. Rappel automatique créé (24h avant)
```

### Annulation de RDV
```
1. Patient demande annulation
   └─> POST /api/annulations/
   └─> Statut "en_attente"

2. Admin/Praticien traite
   └─> Accepter : POST /api/annulations/{id}/accepter/
       ├─> Annulation.statut = "acceptee"
       └─> RDV.statut = "annule"
   └─> Refuser : POST /api/annulations/{id}/refuser/
       └─> Annulation.statut = "refusee"
```

## 📊 Architecture des Composants React

```
App.jsx
├── AuthProvider (Context)
├── Router
│   ├── Public Routes
│   │   ├── Login
│   │   └── Register
│   │
│   └── Protected Routes
│       ├── ProtectedLayout
│       │   ├── Navbar
│       │   └── [Page Component]
│       │
│       ├── Dashboard (all)
│       ├── RendezVous (all)
│       ├── Praticiens (admin)
│       ├── Patients (admin, praticien)
│       ├── Annulations (admin, praticien)
│       └── Statistiques (admin)
```

## 🔌 API Endpoints

### Format standard
```
GET    /api/resource/          → Liste
GET    /api/resource/{id}/     → Détails
POST   /api/resource/          → Créer
PUT    /api/resource/{id}/     → Modifier
DELETE /api/resource/{id}/     → Supprimer

POST   /api/resource/{id}/action/  → Action custom
```

### Exemples
```
POST /api/auth/login/
POST /api/rendez-vous/
POST /api/rendez-vous/5/confirmer/
GET  /api/statistiques/
```

## 🚀 Déploiement

### Development
- Backend : `python manage.py runserver`
- Frontend : `npm run dev`
- CORS : Localhost autorisé


## 🔒 Sécurité

### Backend
- ✅ JWT avec expiration
- ✅ CORS strict
- ✅ CSRF protection
- ✅ Password hashing (Django)
- ✅ SQL injection protection (ORM)
- ✅ Permissions par rôle
- ⚠️ Rate limiting (TODO)
- ⚠️ HTTPS only (TODO prod)

### Frontend
- ✅ Protected routes
- ✅ Token auto-refresh
- ✅ Input validation
- ✅ XSS protection (React)
- ⚠️ Content Security Policy (TODO)

## 📈 Performance

### Backend
- Queries optimisées (select_related, prefetch_related)
- Pagination (100 items/page)
- Indexation DB sur FK

### Frontend
- Lazy loading des pages
- Minimisation des re-renders
- Build optimisé (Vite)
- Tree-shaking

## 🧪 Tests (À implémenter)

### Backend
```bash
python manage.py test
```

### Frontend
```bash
npm run test
```

## 📝 Logs

Tous les événements importants sont loggés :
- Connexions/déconnexions
- Création/modification/suppression
- Actions administratives
- Erreurs

Format :
```python
Log.objects.create(
    user=request.user,
    action='Création RDV',
    details='RDV #123 créé',
    table_cible='RendezVous',
    cible_id=123,
    ip_address='192.168.1.1'
)
```

## 🔄 Évolutions Futures

- [ ] Notifications en temps réel (WebSockets)
- [ ] Paiement en ligne
- [ ] Visioconférence intégrée
- [ ] Application mobile (React Native)
- [ ] Multi-langues
- [ ] Dark mode
- [ ] Tests automatisés
- [ ] CI/CD pipeline
