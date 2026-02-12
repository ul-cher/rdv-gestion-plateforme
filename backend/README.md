# Backend Django - Plateforme RDV

## 📁 Structure Correcte

```
backend/
├── manage.py
├── requirements.txt
├── db.sqlite3 (sera créé)
│
├── plateforme_rdv/          # Configuration Django
│   ├── __init__.py
│   ├── settings.py          # Paramètres
│   ├── urls.py              # URLs principales
│   ├── wsgi.py
│   └── asgi.py
│
└── rdv_app/                 # Application principale
    ├── __init__.py
    ├── models.py            # Modèles
    ├── serializers.py       # Serializers DRF
    ├── api_views.py         # ViewSets API
    ├── api_urls.py          # URLs API
    ├── views.py             # Vues Django
    ├── urls.py              # URLs Django
    ├── forms.py             # Formulaires
    ├── admin.py             # Admin Django
    ├── apps.py              # Configuration app
    ├── utils.py             # Utilitaires
    └── migrations/          # Migrations DB
        └── __init__.py
```

## 🚀 Installation

```bash
# 1. Créer un environnement virtuel
python3 -m venv venv

# 2. Activer l'environnement
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Créer la base de données
python manage.py makemigrations
python manage.py migrate

# 5. Créer un superutilisateur
python manage.py createsuperuser
# Username: admin
# Email: admin@example.com
# Password: admin123

# 6. (Optionnel) Créer des données de test
# Note: Le script create_sample_data.py doit être dans
# rdv_app/management/commands/create_sample_data.py
python manage.py create_sample_data

# 7. Lancer le serveur
python manage.py runserver
```

## ✅ Vérification

Le serveur devrait démarrer sur : **http://127.0.0.1:8000**

Testez l'API : http://127.0.0.1:8000/api/

## 🔑 API Endpoints

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/register/` - Inscription
- `GET /api/auth/user/` - Utilisateur courant

### Praticiens
- `GET /api/praticiens/` - Liste
- `POST /api/praticiens/` - Créer
- `GET /api/praticiens/{id}/` - Détails

### Patients
- `GET /api/patients/` - Liste
- `POST /api/patients/` - Créer

### Rendez-vous
- `GET /api/rendez-vous/` - Liste
- `POST /api/rendez-vous/` - Créer
- `POST /api/rendez-vous/{id}/confirmer/` - Confirmer

### Autres
- `GET /api/statistiques/` - Statistiques
- `GET /api/logs/` - Logs
- `GET /api/annulations/` - Annulations
- `GET /api/rappels/` - Rappels

## 🐛 Problèmes Fréquents

### ModuleNotFoundError: No module named 'rdv_app'

**Cause** : Structure de dossiers incorrecte

**Solution** : Vérifiez que vous avez bien la structure suivante :
```
backend/
├── manage.py
├── plateforme_rdv/
│   └── settings.py
└── rdv_app/
    ├── __init__.py
    └── models.py
```

### CORS Error

**Cause** : django-cors-headers non installé ou mal configuré

**Solution** :
```bash
pip install django-cors-headers
```

Vérifiez dans `settings.py` :
- `'corsheaders'` dans `INSTALLED_APPS`
- `'corsheaders.middleware.CorsMiddleware'` en PREMIER dans `MIDDLEWARE`
- `CORS_ALLOWED_ORIGINS` contient `"http://localhost:3000"`

### Import Error

**Cause** : Dépendances manquantes

**Solution** :
```bash
pip install -r requirements.txt
```

## 📦 Dépendances Requises

```
Django==5.0.1
djangorestframework==3.14.0
django-cors-headers==4.3.1
djangorestframework-simplejwt==5.3.1
Pillow==10.2.0
reportlab==4.0.9
python-dateutil==2.8.2
```

## 🔒 Sécurité

- Ne commitez JAMAIS `SECRET_KEY` en production
- Utilisez des variables d'environnement pour les secrets
- Changez `DEBUG = False` en production
- Configurez `ALLOWED_HOSTS` correctement

## 📚 Documentation

- Django : https://docs.djangoproject.com/
- DRF : https://www.django-rest-framework.org/
- Simple JWT : https://django-rest-framework-simplejwt.readthedocs.io/
