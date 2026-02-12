from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    AuthViewSet, PraticienViewSet, PatientViewSet,
    RendezVousViewSet, AnnulationViewSet, RappelViewSet, 
    LogViewSet, statistiques_view
)

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'praticiens', PraticienViewSet, basename='praticien')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'rendez-vous', RendezVousViewSet, basename='rendezvous')
router.register(r'annulations', AnnulationViewSet, basename='annulation')
router.register(r'rappels', RappelViewSet, basename='rappel')
router.register(r'logs', LogViewSet, basename='log')

urlpatterns = [
    # Authentification
    path('auth/login/', AuthViewSet.as_view({'post': 'login'}), name='api-login'),
    path('auth/register/', AuthViewSet.as_view({'post': 'register'}), name='api-register'),
    path('auth/logout/', AuthViewSet.as_view({'post': 'logout'}), name='api-logout'),
    path('auth/user/', AuthViewSet.as_view({'get': 'user'}), name='api-user'),
    
    # Statistiques
    path('statistiques/', statistiques_view, name='api-statistiques'),
    
    # Routes du router
    path('', include(router.urls)),
]
