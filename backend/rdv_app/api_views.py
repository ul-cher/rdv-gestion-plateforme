from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta, date

from .models import (
    User, Praticien, Patient, RendezVous, Annulation, 
    Rappel, Log, HorairePraticien, Indisponibilite
)
from .serializers import (
    UserSerializer, PraticienSerializer, PatientSerializer,
    RendezVousSerializer, AnnulationSerializer, RappelSerializer,
    LogSerializer, HorairePraticienSerializer, IndisponibiliteSerializer,
    PatientRegistrationSerializer, PraticienCreateSerializer, PatientCreateSerializer
)
from .utils import log_action


class AuthViewSet(viewsets.ViewSet):
    """ViewSet pour l'authentification"""
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Connexion utilisateur"""
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            
            # Ajouter les informations du profil selon le rôle
            user_data = UserSerializer(user).data
            if user.role == 'praticien' and hasattr(user, 'praticien_profile'):
                user_data['praticien_profile'] = {
                    'id': user.praticien_profile.id,
                    'specialite': user.praticien_profile.specialite,
                }
            elif user.role == 'patient' and hasattr(user, 'patient_profile'):
                user_data['patient_profile'] = {
                    'id': user.patient_profile.id,
                }
            
            log_action(request, 'Connexion API', f'Utilisateur {user.username} connecté')
            
            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            })
        
        return Response(
            {'message': 'Identifiants invalides'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Inscription d'un nouveau patient"""
        serializer = PatientRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            log_action(request, 'Inscription API', f'Nouveau patient: {patient.user.username}')
            
            return Response(
                {'message': 'Inscription réussie', 'patient_id': patient.id},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Déconnexion utilisateur"""
        log_action(request, 'Déconnexion API', f'Utilisateur {request.user.username} déconnecté')
        return Response({'message': 'Déconnexion réussie'})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def user(self, request):
        """Récupérer l'utilisateur courant"""
        user_data = UserSerializer(request.user).data
        
        # Ajouter les informations du profil
        if request.user.role == 'praticien' and hasattr(request.user, 'praticien_profile'):
            user_data['praticien_profile'] = {
                'id': request.user.praticien_profile.id,
                'specialite': request.user.praticien_profile.specialite,
            }
        elif request.user.role == 'patient' and hasattr(request.user, 'patient_profile'):
            user_data['patient_profile'] = {
                'id': request.user.patient_profile.id,
            }
        
        return Response(user_data)


class PraticienViewSet(viewsets.ModelViewSet):
    """ViewSet pour les praticiens"""
    queryset = Praticien.objects.all().select_related('user')
    serializer_class = PraticienSerializer
    
    def get_serializer_class(self):
        """Utiliser un serializer différent pour la création"""
        if self.action == 'create':
            return PraticienCreateSerializer
        return PraticienSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtres
        actif = self.request.query_params.get('actif')
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')
        
        specialite = self.request.query_params.get('specialite')
        if specialite:
            queryset = queryset.filter(specialite__icontains=specialite)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(specialite__icontains=search)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Créer un praticien"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            praticien = serializer.save()
            log_action(request, 'Création praticien', f'Praticien créé: {praticien.user.get_full_name()}', 'Praticien', praticien.id)
            return Response(PraticienSerializer(praticien).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def horaires(self, request, pk=None):
        """Récupérer les horaires d'un praticien"""
        praticien = self.get_object()
        horaires = HorairePraticien.objects.filter(praticien=praticien)
        serializer = HorairePraticienSerializer(horaires, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def horaires(self, request, pk=None):
        """Créer un horaire pour un praticien"""
        praticien = self.get_object()
        serializer = HorairePraticienSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(praticien=praticien)
            log_action(request, 'Création horaire', f'Horaire créé pour {praticien.user.get_full_name()}')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def indisponibilites(self, request, pk=None):
        """Récupérer les indisponibilités d'un praticien"""
        praticien = self.get_object()
        indisponibilites = Indisponibilite.objects.filter(praticien=praticien)
        serializer = IndisponibiliteSerializer(indisponibilites, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def indisponibilites(self, request, pk=None):
        """Créer une indisponibilité pour un praticien"""
        praticien = self.get_object()
        serializer = IndisponibiliteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(praticien=praticien)
            log_action(request, 'Création indisponibilité', f'Indisponibilité créée pour {praticien.user.get_full_name()}')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientViewSet(viewsets.ModelViewSet):
    """ViewSet pour les patients"""
    queryset = Patient.objects.all().select_related('user')
    serializer_class = PatientSerializer
    
    def get_serializer_class(self):
        """Utiliser un serializer différent pour la création"""
        if self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtre de recherche
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(telephone__icontains=search)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Créer un patient"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            log_action(request, 'Création patient', f'Patient créé: {patient.user.get_full_name()}', 'Patient', patient.id)
            return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RendezVousViewSet(viewsets.ModelViewSet):
    """ViewSet pour les rendez-vous"""
    queryset = RendezVous.objects.all().select_related('patient__user', 'praticien__user')
    serializer_class = RendezVousSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().order_by('-date_heure')
        
        # Filtres
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        praticien_id = self.request.query_params.get('praticien_id')
        if praticien_id:
            queryset = queryset.filter(praticien_id=praticien_id)
        
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        date_debut = self.request.query_params.get('date_debut')
        if date_debut:
            queryset = queryset.filter(date_heure__gte=date_debut)
        
        date_fin = self.request.query_params.get('date_fin')
        if date_fin:
            queryset = queryset.filter(date_heure__lte=date_fin)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Créer un rendez-vous"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            rdv = serializer.save()
            log_action(request, 'Création RDV', f'RDV créé #{rdv.id}', 'RendezVous', rdv.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        """Confirmer un rendez-vous"""
        rdv = self.get_object()
        rdv.statut = 'confirme'
        rdv.save()
        log_action(request, 'Confirmation RDV', f'RDV confirmé #{rdv.id}', 'RendezVous', rdv.id)
        return Response({'message': 'Rendez-vous confirmé', 'rdv': RendezVousSerializer(rdv).data})
    
    @action(detail=False, methods=['get'])
    def calendrier(self, request):
        """Vue calendrier des rendez-vous"""
        month = request.query_params.get('month', date.today().month)
        year = request.query_params.get('year', date.today().year)
        
        rdv_list = self.get_queryset().filter(
            date_heure__year=year,
            date_heure__month=month
        )
        
        serializer = self.get_serializer(rdv_list, many=True)
        return Response(serializer.data)


class AnnulationViewSet(viewsets.ModelViewSet):
    """ViewSet pour les annulations"""
    queryset = Annulation.objects.all().select_related('rdv__patient__user', 'rdv__praticien__user')
    serializer_class = AnnulationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().order_by('-date_demande')
        
        # Filtre par statut
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        """Accepter une demande d'annulation"""
        annulation = self.get_object()
        annulation.statut = 'acceptee'
        annulation.date_traitement = timezone.now()
        annulation.rdv.statut = 'annule'
        annulation.rdv.save()
        annulation.save()
        
        log_action(request, 'Annulation acceptée', f'Annulation #{annulation.id} acceptée', 'Annulation', annulation.id)
        
        return Response({
            'message': 'Annulation acceptée',
            'annulation': AnnulationSerializer(annulation).data
        })
    
    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        """Refuser une demande d'annulation"""
        annulation = self.get_object()
        annulation.statut = 'refusee'
        annulation.date_traitement = timezone.now()
        annulation.save()
        
        log_action(request, 'Annulation refusée', f'Annulation #{annulation.id} refusée', 'Annulation', annulation.id)
        
        return Response({
            'message': 'Annulation refusée',
            'annulation': AnnulationSerializer(annulation).data
        })


class RappelViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les rappels (lecture seule)"""
    queryset = Rappel.objects.all().select_related('rdv__patient__user', 'rdv__praticien__user')
    serializer_class = RappelSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().order_by('-date_envoi_prevue')
        
        # Filtre par statut d'envoi
        envoye = self.request.query_params.get('envoye')
        if envoye is not None:
            queryset = queryset.filter(envoye=envoye.lower() == 'true')
        
        return queryset


class LogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les logs (lecture seule)"""
    queryset = Log.objects.all().select_related('user')
    serializer_class = LogSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().order_by('-date')
        
        # Filtre par action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action__icontains=action)
        
        # Limiter aux 100 derniers logs par défaut
        limit = self.request.query_params.get('limit', 100)
        return queryset[:int(limit)]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistiques_view(request):
    """Vue des statistiques"""
    # Statistiques générales
    total_rdv = RendezVous.objects.count()
    rdv_confirmes = RendezVous.objects.filter(statut='confirme').count()
    rdv_annules = RendezVous.objects.filter(statut='annule').count()
    rdv_absences = RendezVous.objects.filter(statut='absence').count()
    
    # Taux d'annulation
    taux_annulation = (rdv_annules / total_rdv * 100) if total_rdv > 0 else 0
    
    # Rendez-vous par praticien
    rdv_par_praticien = list(Praticien.objects.annotate(
        nb_rdv=Count('rendez_vous')
    ).values('id', 'user__first_name', 'user__last_name', 'specialite', 'nb_rdv').order_by('-nb_rdv')[:10])
    
    # Rendez-vous par spécialité
    rdv_par_specialite = list(Praticien.objects.values('specialite').annotate(
        nb_rdv=Count('rendez_vous')
    ).order_by('-nb_rdv'))
    
    # Rendez-vous du mois
    today = date.today()
    first_day = date(today.year, today.month, 1)
    if today.month == 12:
        last_day = date(today.year + 1, 1, 1)
    else:
        last_day = date(today.year, today.month + 1, 1)
    
    rdv_mois = RendezVous.objects.filter(
        date_heure__gte=first_day,
        date_heure__lt=last_day
    ).count()
    
    return Response({
        'total_rdv': total_rdv,
        'rdv_confirmes': rdv_confirmes,
        'rdv_annules': rdv_annules,
        'rdv_absences': rdv_absences,
        'taux_annulation': round(taux_annulation, 2),
        'rdv_par_praticien': rdv_par_praticien,
        'rdv_par_specialite': rdv_par_specialite,
        'rdv_mois': rdv_mois,
    })
