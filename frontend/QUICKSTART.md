# 🚀 Guide de Démarrage Rapide - Frontend React

## Installation en 3 étapes

### Étape 1 : Installer les dépendances
```bash
cd rdv-frontend
npm install
```

### Étape 2 : Lancer le serveur de développement
```bash
npm run dev
```

### Étape 3 : Ouvrir dans le navigateur
Ouvrir http://localhost:3000

## ✅ Comptes de Test

### Administrateur
- Username: `admin`
- Password: `admin123`
- Accès: Toutes les fonctionnalités

### Praticien
- Username: `dr_martin`
- Password: `praticien123`
- Accès: Planning, patients, confirmation RDV

### Patient
- Username: `patient1`
- Password: `patient123`
- Accès: Prise de RDV, historique

## 🔧 Prérequis

⚠️ **Important** : Le backend Django DOIT être lancé avant le frontend

### Backend Django
```bash
# Terminal 1
cd plateforme-rdv
python manage.py runserver
```
Le backend doit tourner sur http://127.0.0.1:8000

### Frontend React
```bash
# Terminal 2
cd rdv-frontend
npm run dev
```
Le frontend tournera sur http://localhost:3000

## 📋 Checklist de Vérification

Avant de commencer, vérifiez :

- [ ] Node.js 16+ installé (`node --version`)
- [ ] npm installé (`npm --version`)
- [ ] Backend Django lancé sur le port 8000
- [ ] Dépendances npm installées (`npm install`)
- [ ] Pas de conflits de port (3000 et 8000 disponibles)

## 🐛 Problèmes Courants

### 1. "Failed to fetch" ou erreurs réseau
**Solution** : Vérifiez que le backend Django tourne sur http://127.0.0.1:8000

```bash
# Vérifier si le backend répond
curl http://127.0.0.1:8000/api/
```

### 2. Erreur CORS
**Solution** : Configurez CORS dans Django (voir DJANGO_API_SETUP.md)

### 3. Port 3000 déjà utilisé
**Solution** : Changez le port dans vite.config.js ou tuez le processus

```bash
# Sur Linux/Mac
lsof -ti:3000 | xargs kill -9

# Sur Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 4. Dépendances manquantes
**Solution** : Réinstallez les dépendances

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📱 Interface

### Pages disponibles
- `/login` - Connexion
- `/register` - Inscription patient
- `/dashboard` - Tableau de bord (personnalisé par rôle)
- `/rendez-vous` - Liste des rendez-vous
- `/praticiens` - Gestion praticiens (admin)
- `/patients` - Gestion patients (admin/praticien)
- `/annulations` - Gestion annulations (admin/praticien)
- `/statistiques` - Statistiques (admin)
- `/logs` - Logs système (admin)

### Navigation
- La navigation s'adapte selon le rôle de l'utilisateur
- Les routes sont protégées (redirection si non autorisé)
- Interface responsive (desktop, tablette, mobile)

## 🎨 Personnalisation

### Changer les couleurs
Modifiez `tailwind.config.js` :
```javascript
colors: {
  primary: {
    500: '#3b82f6',  // Votre couleur
    600: '#2563eb',
  }
}
```

### Changer l'URL de l'API
Créez un fichier `.env` :
```
VITE_API_BASE_URL=http://votre-api.com/api
```

## 📞 Support

Pour toute question :
1. Consultez le README.md principal
2. Vérifiez DJANGO_API_SETUP.md pour la config backend
3. Inspectez la console du navigateur (F12)
4. Vérifiez les logs du serveur Django

## 🎯 Prochaines Étapes

Une fois l'application lancée :

1. ✅ Testez la connexion avec les comptes de test
2. ✅ Explorez le dashboard selon votre rôle
3. ✅ Testez la liste des rendez-vous
4. 🚧 Implémentez les fonctionnalités manquantes (voir README.md)

## 🏗️ Build pour Production

```bash
# Générer le build de production
npm run build

# Le dossier dist/ contiendra les fichiers à déployer
# Servez-les avec nginx, Apache, ou un service cloud
```

---

**Bon développement ! 🎉**
