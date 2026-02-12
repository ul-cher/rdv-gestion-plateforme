# Configuration Backend Django pour React Frontend

Ce guide explique comment configurer votre backend Django pour qu'il fonctionne avec le frontend React.

## 🔧 Modifications nécessaires

### 1. Installer les dépendances supplémentaires

```bash
pip install djangorestframework
pip install django-cors-headers
pip install djangorestframework-simplejwt
```

### 2. Mettre à jour requirements.txt

Ajouter à votre `requirements.txt` :
```
djangorestframework==3.14.0
django-cors-headers==4.3.1
djangorestframework-simplejwt==5.3.1
```

### 3. Configurer settings.py

Modifier votre `plateforme_rdv/settings.py` :

```python
# INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    
    # Local apps
    'rdv_app',
]

# MIDDLEWARE - Ajouter CorsMiddleware EN PREMIER
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # <-- IMPORTANT: en premier
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

### 4. Créer les serializers

Créer `rdv_app/serializers.py` :

```python
from rest_framework import serializers
from .models import User, Praticien, Patient, RendezVous, Annulation, Rappel, Log, HorairePraticien, Indisponibilite


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id']


class PraticienSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Praticien
        fields = '__all__'


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = '__all__'
    
    def get_age(self, obj):
        return obj.get_age()


class RendezVousSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    praticien = PraticienSerializer(read_only=True)
    
    class Meta:
        model = RendezVous
        fields = '__all__'


class AnnulationSerializer(serializers.ModelSerializer):
    rdv = RendezVousSerializer(read_only=True)
    
    class Meta:
        model = Annulation
        fields = '__all__'


class RappelSerializer(serializers.ModelSerializer):
    rdv = RendezVousSerializer(read_only=True)
    
    class Meta:
        model = Rappel
        fields = '__all__'


class LogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Log
        fields = '__all__'


class HorairePraticienSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorairePraticien
        fields = '__all__'


class IndisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indisponibilite
        fields = '__all__'
```

### 5. Créer les API ViewSets

Créer `rdv_app/api_views.py` :

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Praticien, Patient, RendezVous, Annulation, Rappel, Log
from .serializers import (
    UserSerializer, PraticienSerializer, PatientSerializer,
    RendezVousSerializer, AnnulationSerializer, RappelSerializer, LogSerializer
)


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        
        return Response(
            {'message': 'Identifiants invalides'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        # Créer l'utilisateur
        user = User.objects.create_user(
            username=request.data.get('username'),
            email=request.data.get('email'),
            first_name=request.data.get('first_name'),
            last_name=request.data.get('last_name'),
            password=request.data.get('password'),
            role='patient'
        )
        
        # Créer le profil patient
        Patient.objects.create(
            user=user,
            civilite=request.data.get('civilite'),
            telephone=request.data.get('telephone'),
            adresse=request.data.get('adresse'),
            date_naissance=request.data.get('date_naissance')
        )
        
        return Response(
            {'message': 'Inscription réussie'},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        return Response({'message': 'Déconnexion réussie'})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def user(self, request):
        return Response(UserSerializer(request.user).data)


class PraticienViewSet(viewsets.ModelViewSet):
    queryset = Praticien.objects.all()
    serializer_class = PraticienSerializer


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer


class RendezVousViewSet(viewsets.ModelViewSet):
    queryset = RendezVous.objects.all().order_by('-date_heure')
    serializer_class = RendezVousSerializer
    
    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        rdv = self.get_object()
        rdv.statut = 'confirme'
        rdv.save()
        return Response({'message': 'Rendez-vous confirmé'})


class AnnulationViewSet(viewsets.ModelViewSet):
    queryset = Annulation.objects.all().order_by('-date_demande')
    serializer_class = AnnulationSerializer


class RappelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Rappel.objects.all().order_by('-date_envoi_prevue')
    serializer_class = RappelSerializer


class LogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Log.objects.all().order_by('-date')
    serializer_class = LogSerializer
```

### 6. Créer les URLs de l'API

Créer `rdv_app/api_urls.py` :

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    AuthViewSet, PraticienViewSet, PatientViewSet,
    RendezVousViewSet, AnnulationViewSet, RappelViewSet, LogViewSet
)

router = DefaultRouter()
router.register(r'praticiens', PraticienViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'rendez-vous', RendezVousViewSet)
router.register(r'annulations', AnnulationViewSet)
router.register(r'rappels', RappelViewSet)
router.register(r'logs', LogViewSet)

urlpatterns = [
    # Auth endpoints
    path('auth/login/', AuthViewSet.as_view({'post': 'login'})),
    path('auth/register/', AuthViewSet.as_view({'post': 'register'})),
    path('auth/logout/', AuthViewSet.as_view({'post': 'logout'})),
    path('auth/user/', AuthViewSet.as_view({'get': 'user'})),
    
    # Router URLs
    path('', include(router.urls)),
]
```

### 7. Mettre à jour les URLs principales

Modifier `plateforme_rdv/urls.py` :

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('rdv_app.api_urls')),  # API REST
    path('', include('rdv_app.urls')),          # URLs Django classiques (optionnel)
]
```

## 🚀 Lancement

### Terminal 1 - Backend Django
```bash
cd plateforme-rdv
python manage.py runserver
```

### Terminal 2 - Frontend React
```bash
cd rdv-frontend
npm run dev
```

## ✅ Vérification

Une fois tout configuré, testez :

1. **Backend API** : http://127.0.0.1:8000/api/
2. **Frontend React** : http://localhost:3000
3. **Login** : Utilisez les comptes de test (admin/admin123, etc.)

## 🔍 Débogage

### Erreur CORS
Si vous avez des erreurs CORS :
- Vérifiez que `corsheaders` est bien installé
- Vérifiez que `CorsMiddleware` est en PREMIER dans MIDDLEWARE
- Vérifiez que l'URL du frontend est dans `CORS_ALLOWED_ORIGINS`

### Erreur 401
Si vous avez des erreurs 401 :
- Vérifiez que le token JWT est bien retourné lors du login
- Vérifiez que le header Authorization est bien envoyé
- Vérifiez la configuration SIMPLE_JWT

### API non accessible
Si l'API ne répond pas :
- Vérifiez que le serveur Django tourne sur le port 8000
- Vérifiez les URLs dans `api_urls.py`
- Testez directement avec curl ou Postman

## 📚 Ressources

- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django CORS Headers](https://github.com/adamchainz/django-cors-headers)
- [Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
