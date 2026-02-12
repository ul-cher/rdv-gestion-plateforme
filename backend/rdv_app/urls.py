from django.urls import path
from . import views

urlpatterns = [
    # Authentification
    path('', views.login_view, name='login'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    
    # Dashboard
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # Praticiens
    path('praticiens/', views.praticiens_list, name='praticiens_list'),
    path('praticiens/create/', views.praticien_create, name='praticien_create'),
    path('praticiens/<int:pk>/', views.praticien_detail, name='praticien_detail'),
    path('praticiens/<int:pk>/edit/', views.praticien_edit, name='praticien_edit'),
    path('praticiens/<int:pk>/planning/', views.praticien_planning, name='praticien_planning'),
    path('praticiens/<int:praticien_id>/horaire/create/', views.horaire_create, name='horaire_create'),
    path('praticiens/<int:praticien_id>/indisponibilite/create/', views.indisponibilite_create, name='indisponibilite_create'),
    
    # Patients
    path('patients/', views.patients_list, name='patients_list'),
    path('patients/create/', views.patient_create, name='patient_create'),
    path('patients/<int:pk>/', views.patient_detail, name='patient_detail'),
    path('patients/<int:pk>/edit/', views.patient_edit, name='patient_edit'),
    
    # Rendez-vous
    path('rendez-vous/', views.rendez_vous_list, name='rendez_vous_list'),
    path('rendez-vous/create/', views.rendez_vous_create, name='rendez_vous_create'),
    path('rendez-vous/<int:pk>/', views.rdv_detail, name='rdv_detail'),
    path('rendez-vous/<int:pk>/confirmer/', views.rdv_confirmer, name='rdv_confirmer'),
    path('rendez-vous/calendrier/', views.rdv_calendrier, name='rdv_calendrier'),
    
    # Annulations
    path('annulations/', views.annulations_list, name='annulations_list'),
    path('annulations/create/<int:rdv_id>/', views.annulation_create, name='annulation_create'),
    path('annulations/<int:pk>/<str:action>/', views.annulation_traiter, name='annulation_traiter'),
    
    # Rappels
    path('rappels/', views.rappels_list, name='rappels_list'),
    
    # Statistiques
    path('statistiques/', views.statistiques_view, name='statistiques'),
    path('statistiques/export/', views.rapport_export, name='rapport_export'),
    
    # Logs
    path('logs/', views.logs_view, name='logs'),
]

