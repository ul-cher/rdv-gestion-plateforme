from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q, Count
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from datetime import datetime, timedelta, date
from .models import (
    User, Praticien, HorairePraticien, Indisponibilite,
    Patient, RendezVous, Annulation, Rappel, Log
)
from .forms import (
    LoginForm, PatientRegistrationForm, PraticienForm, PatientForm,
    HorairePraticienForm, IndisponibiliteForm, RendezVousForm,
    AnnulationForm, RendezVousAdminForm, SearchForm, DateRangeForm
)
from .utils import log_action, check_permission, generer_rapport_csv, generer_rapport_pdf


# Auth

def login_view(request):
    """Connexion"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                log_action(request, 'Connexion', f'Utilisateur {user.username} connecté')
                messages.success(request, f'Bienvenue {user.get_full_name()} !')
                return redirect('dashboard')
    else:
        form = LoginForm()
    
    return render(request, 'rdv_app/login.html', {'form': form})


def logout_view(request):
    """Vue de déconnexion"""
    log_action(request, 'Déconnexion', f'Utilisateur {request.user.username} déconnecté')
    logout(request)
    messages.info(request, 'Vous avez été déconnecté avec succès.')
    return redirect('login')


def register_view(request):
    """Vue d'inscription pour les patients"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = PatientRegistrationForm(request.POST)
        if form.is_valid():
            # Créer l'utilisateur
            user = form.save(commit=False)
            user.role = 'patient'
            user.save()
            
            # Créer le profil patient
            Patient.objects.create(
                user=user,
                civilite=form.cleaned_data['civilite'],
                telephone=form.cleaned_data['telephone'],
                adresse=form.cleaned_data['adresse'],
                date_naissance=form.cleaned_data['date_naissance']
            )
            
            log_action(request, 'Inscription', f'Nouveau patient: {user.username}', 'User', user.id)
            messages.success(request, 'Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.')
            return redirect('login')
    else:
        form = PatientRegistrationForm()
    
    return render(request, 'rdv_app/register.html', {'form': form})


# Dashboard

@login_required
def dashboard_view(request):
    """Tableau de bord principal"""
    context = {}
    user = request.user
    
    if user.role == 'admin':
        # Statistiques admin
        context['total_rdv'] = RendezVous.objects.count()
        context['rdv_aujourdhui'] = RendezVous.objects.filter(
            date_heure__date=date.today(),
            statut__in=['en_attente', 'confirme']
        ).count()
        context['total_patients'] = Patient.objects.count()
        context['total_praticiens'] = Praticien.objects.filter(actif=True).count()
        context['annulations_attente'] = Annulation.objects.filter(statut='en_attente').count()
        
        # Rendez-vous récents
        context['rdv_recents'] = RendezVous.objects.all()[:10]
        
    elif user.role == 'praticien' and hasattr(user, 'praticien_profile'):
        praticien = user.praticien_profile
        today = timezone.now()
        
        # Rendez-vous du jour
        context['rdv_aujourdhui'] = RendezVous.objects.filter(
            praticien=praticien,
            date_heure__date=today.date(),
            statut__in=['en_attente', 'confirme']
        ).order_by('date_heure')
        
        # Rendez-vous à venir (7 prochains jours)
        context['rdv_semaine'] = RendezVous.objects.filter(
            praticien=praticien,
            date_heure__gte=today,
            date_heure__lte=today + timedelta(days=7),
            statut__in=['en_attente', 'confirme']
        ).order_by('date_heure')
        
        context['praticien'] = praticien
        
    elif user.role == 'patient' and hasattr(user, 'patient_profile'):
        patient = user.patient_profile
        
        # Prochains rendez-vous
        context['rdv_futurs'] = RendezVous.objects.filter(
            patient=patient,
            date_heure__gte=timezone.now(),
            statut__in=['en_attente', 'confirme']
        ).order_by('date_heure')
        
        # Historique
        context['rdv_passes'] = RendezVous.objects.filter(
            patient=patient,
            date_heure__lt=timezone.now()
        ).order_by('-date_heure')[:5]
        
        context['patient'] = patient
    
    return render(request, 'rdv_app/dashboard.html', context)


# Praticiens

@login_required
def praticiens_list(request):
    """Liste des praticiens"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    praticiens = Praticien.objects.all()
    
    # Recherche
    search_query = request.GET.get('q', '')
    if search_query:
        praticiens = praticiens.filter(
            Q(user__first_name__icontains=search_query) |
            Q(user__last_name__icontains=search_query) |
            Q(specialite__icontains=search_query)
        )
    
    # Filtre par spécialité
    specialite = request.GET.get('specialite', '')
    if specialite:
        praticiens = praticiens.filter(specialite__icontains=specialite)
    
    # Filtre par statut
    actif = request.GET.get('actif', '')
    if actif:
        praticiens = praticiens.filter(actif=(actif == 'true'))
    
    context = {
        'praticiens': praticiens,
        'search_query': search_query,
        'specialites': Praticien.objects.values_list('specialite', flat=True).distinct()
    }
    
    return render(request, 'rdv_app/praticiens/list.html', context)


@login_required
def praticien_create(request):
    """Créer un praticien"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = PraticienForm(request.POST, request.FILES)
        if form.is_valid():
            # Créer l'utilisateur
            user = User.objects.create_user(
                username=form.cleaned_data['username'],
                email=form.cleaned_data['email'],
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name'],
                password=form.cleaned_data.get('password', 'password123'),
                role='praticien'
            )
            
            # Créer le praticien
            praticien = form.save(commit=False)
            praticien.user = user
            praticien.save()
            
            log_action(request, 'Création praticien', f'Praticien {user.get_full_name()} créé', 'Praticien', praticien.id)
            messages.success(request, 'Praticien créé avec succès !')
            return redirect('praticien_detail', pk=praticien.id)
    else:
        form = PraticienForm()
    
    return render(request, 'rdv_app/praticiens/form.html', {'form': form, 'action': 'Créer'})


@login_required
def praticien_edit(request, pk):
    """Modifier un praticien"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    praticien = get_object_or_404(Praticien, pk=pk)
    
    if request.method == 'POST':
        form = PraticienForm(request.POST, request.FILES, instance=praticien, instance_user=praticien.user)
        if form.is_valid():
            # Mettre à jour l'utilisateur
            user = praticien.user
            user.username = form.cleaned_data['username']
            user.email = form.cleaned_data['email']
            user.first_name = form.cleaned_data['first_name']
            user.last_name = form.cleaned_data['last_name']
            if form.cleaned_data.get('password'):
                user.set_password(form.cleaned_data['password'])
            user.save()
            
            # Mettre à jour le praticien
            form.save()
            
            log_action(request, 'Modification praticien', f'Praticien {user.get_full_name()} modifié', 'Praticien', praticien.id)
            messages.success(request, 'Praticien modifié avec succès !')
            return redirect('praticien_detail', pk=praticien.id)
    else:
        form = PraticienForm(instance=praticien, instance_user=praticien.user)
    
    return render(request, 'rdv_app/praticiens/form.html', {'form': form, 'action': 'Modifier', 'praticien': praticien})


@login_required
def praticien_detail(request, pk):
    """Détail d'un praticien"""
    praticien = get_object_or_404(Praticien, pk=pk)
    
    # Vérifier les permissions
    if request.user.role == 'praticien' and request.user.praticien_profile.id != praticien.id:
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    context = {
        'praticien': praticien,
        'horaires': praticien.horaires.all().order_by('jour_semaine', 'heure_debut'),
        'indisponibilites': praticien.indisponibilites.filter(date_fin__gte=date.today()).order_by('date_debut'),
    }
    
    return render(request, 'rdv_app/praticiens/detail.html', context)


@login_required
def praticien_planning(request, pk):
    """Planning d'un praticien"""
    praticien = get_object_or_404(Praticien, pk=pk)
    
    # Vérifier les permissions
    if request.user.role == 'praticien' and request.user.praticien_profile.id != praticien.id:
        if request.user.role != 'admin':
            messages.error(request, 'Accès non autorisé.')
            return redirect('dashboard')
    
    # Récupérer la semaine (par défaut: semaine courante)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    # Rendez-vous de la semaine
    rdv_semaine = RendezVous.objects.filter(
        praticien=praticien,
        date_heure__date__gte=week_start,
        date_heure__date__lt=week_start + timedelta(days=7)
    ).order_by('date_heure')
    
    context = {
        'praticien': praticien,
        'rdv_semaine': rdv_semaine,
        'week_start': week_start,
    }
    
    return render(request, 'rdv_app/praticiens/planning.html', context)


@login_required
def horaire_create(request, praticien_id):
    """Ajouter un horaire à un praticien"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    praticien = get_object_or_404(Praticien, pk=praticien_id)
    
    if request.method == 'POST':
        form = HorairePraticienForm(request.POST)
        if form.is_valid():
            horaire = form.save(commit=False)
            horaire.praticien = praticien
            horaire.save()
            
            log_action(request, 'Ajout horaire', f'Horaire ajouté pour {praticien.user.get_full_name()}', 'HorairePraticien', horaire.id)
            messages.success(request, 'Horaire ajouté avec succès !')
            return redirect('praticien_detail', pk=praticien.id)
    else:
        form = HorairePraticienForm()
    
    return render(request, 'rdv_app/praticiens/horaire_form.html', {'form': form, 'praticien': praticien})


@login_required
def indisponibilite_create(request, praticien_id):
    """Ajouter une indisponibilité"""
    praticien = get_object_or_404(Praticien, pk=praticien_id)
    
    # Vérifier les permissions
    if request.user.role == 'praticien' and request.user.praticien_profile.id != praticien.id:
        if request.user.role != 'admin':
            messages.error(request, 'Accès non autorisé.')
            return redirect('dashboard')
    
    if request.method == 'POST':
        form = IndisponibiliteForm(request.POST)
        if form.is_valid():
            indispo = form.save(commit=False)
            indispo.praticien = praticien
            indispo.save()
            
            log_action(request, 'Ajout indisponibilité', f'Indisponibilité ajoutée pour {praticien.user.get_full_name()}', 'Indisponibilite', indispo.id)
            messages.success(request, 'Indisponibilité ajoutée avec succès !')
            return redirect('praticien_detail', pk=praticien.id)
    else:
        form = IndisponibiliteForm()
    
    return render(request, 'rdv_app/praticiens/indisponibilite_form.html', {'form': form, 'praticien': praticien})


# Patients

@login_required
def patients_list(request):
    """Liste des patients"""
    if not check_permission(request.user, ['admin', 'praticien']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    patients = Patient.objects.all()
    
    # Recherche
    search_query = request.GET.get('q', '')
    if search_query:
        patients = patients.filter(
            Q(user__first_name__icontains=search_query) |
            Q(user__last_name__icontains=search_query) |
            Q(telephone__icontains=search_query) |
            Q(user__email__icontains=search_query)
        )
    
    # Ajouter le nombre de RDV pour chaque patient
    patients = patients.annotate(nb_rdv=Count('rendez_vous'))
    
    context = {
        'patients': patients,
        'search_query': search_query,
    }
    
    return render(request, 'rdv_app/patients/list.html', context)


@login_required
def patient_create(request):
    """Créer un patient"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = PatientForm(request.POST, request.FILES)
        if form.is_valid():
            # Créer l'utilisateur
            user = User.objects.create_user(
                username=form.cleaned_data['username'],
                email=form.cleaned_data['email'],
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name'],
                password=form.cleaned_data.get('password', 'password123'),
                role='patient'
            )
            
            # Créer le patient
            patient = form.save(commit=False)
            patient.user = user
            patient.save()
            
            log_action(request, 'Création patient', f'Patient {user.get_full_name()} créé', 'Patient', patient.id)
            messages.success(request, 'Patient créé avec succès !')
            return redirect('patient_detail', pk=patient.id)
    else:
        form = PatientForm()
    
    return render(request, 'rdv_app/patients/form.html', {'form': form, 'action': 'Créer'})


@login_required
def patient_edit(request, pk):
    """Modifier un patient"""
    patient = get_object_or_404(Patient, pk=pk)
    
    # Vérifier les permissions
    if request.user.role == 'patient' and request.user.patient_profile.id != patient.id:
        if request.user.role != 'admin':
            messages.error(request, 'Accès non autorisé.')
            return redirect('dashboard')
    
    if request.method == 'POST':
        form = PatientForm(request.POST, request.FILES, instance=patient, instance_user=patient.user)
        if form.is_valid():
            # Mettre à jour l'utilisateur
            user = patient.user
            user.username = form.cleaned_data['username']
            user.email = form.cleaned_data['email']
            user.first_name = form.cleaned_data['first_name']
            user.last_name = form.cleaned_data['last_name']
            if form.cleaned_data.get('password'):
                user.set_password(form.cleaned_data['password'])
            user.save()
            
            # Mettre à jour le patient
            form.save()
            
            log_action(request, 'Modification patient', f'Patient {user.get_full_name()} modifié', 'Patient', patient.id)
            messages.success(request, 'Profil modifié avec succès !')
            return redirect('patient_detail', pk=patient.id)
    else:
        form = PatientForm(instance=patient, instance_user=patient.user)
    
    return render(request, 'rdv_app/patients/form.html', {'form': form, 'action': 'Modifier', 'patient': patient})


@login_required
def patient_detail(request, pk):
    """Détail d'un patient"""
    patient = get_object_or_404(Patient, pk=pk)
    
    # Vérifier les permissions
    if request.user.role == 'patient' and request.user.patient_profile.id != patient.id:
        if request.user.role not in ['admin', 'praticien']:
            messages.error(request, 'Accès non autorisé.')
            return redirect('dashboard')
    
    # Historique des rendez-vous
    rdv_historique = RendezVous.objects.filter(patient=patient).order_by('-date_heure')
    
    context = {
        'patient': patient,
        'rdv_historique': rdv_historique,
    }
    
    return render(request, 'rdv_app/patients/detail.html', context)


# Rendez-vous

@login_required
def rendez_vous_create(request):
    """Créer un rendez-vous (patient)"""
    if not hasattr(request.user, 'patient_profile'):
        messages.error(request, 'Seuls les patients peuvent prendre rendez-vous.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = RendezVousForm(request.POST, user=request.user)
        if form.is_valid():
            rdv = form.save(commit=False)
            rdv.patient = request.user.patient_profile
            rdv.date_heure = form.cleaned_data['date_heure']
            rdv.save()
            
            # Créer les rappels automatiques
            Rappel.objects.create(
                rdv=rdv,
                type_rappel='24h',
                date_envoi_prevue=rdv.date_heure - timedelta(hours=24)
            )
            Rappel.objects.create(
                rdv=rdv,
                type_rappel='48h',
                date_envoi_prevue=rdv.date_heure - timedelta(hours=48)
            )
            
            log_action(request, 'Création RDV', f'RDV créé par patient {request.user.get_full_name()}', 'RendezVous', rdv.id)
            messages.success(request, 'Votre rendez-vous a été créé avec succès ! Vous recevrez des rappels automatiques.')
            return redirect('rdv_detail', pk=rdv.id)
    else:
        form = RendezVousForm(user=request.user)
    
    return render(request, 'rdv_app/rendez_vous/form.html', {'form': form})


@login_required
def rendez_vous_list(request):
    """Liste des rendez-vous"""
    user = request.user
    
    if user.role == 'admin':
        rdv_list = RendezVous.objects.all()
    elif user.role == 'praticien' and hasattr(user, 'praticien_profile'):
        rdv_list = RendezVous.objects.filter(praticien=user.praticien_profile)
    elif user.role == 'patient' and hasattr(user, 'patient_profile'):
        rdv_list = RendezVous.objects.filter(patient=user.patient_profile)
    else:
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Filtres
    statut = request.GET.get('statut', '')
    if statut:
        rdv_list = rdv_list.filter(statut=statut)
    
    date_debut = request.GET.get('date_debut', '')
    date_fin = request.GET.get('date_fin', '')
    if date_debut:
        rdv_list = rdv_list.filter(date_heure__gte=date_debut)
    if date_fin:
        rdv_list = rdv_list.filter(date_heure__lte=date_fin)
    
    rdv_list = rdv_list.order_by('-date_heure')
    
    context = {
        'rendez_vous_list': rdv_list,
        'statut_choices': RendezVous.STATUT_CHOICES,
    }
    
    return render(request, 'rdv_app/rendez_vous/list.html', context)


@login_required
def rdv_detail(request, pk):
    """Détail d'un rendez-vous"""
    rdv = get_object_or_404(RendezVous, pk=pk)
    
    # Vérifier les permissions
    if request.user.role == 'patient' and rdv.patient.user != request.user:
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    elif request.user.role == 'praticien' and rdv.praticien.user != request.user:
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    context = {
        'rdv': rdv,
        'annulations': rdv.annulations.all(),
        'rappels': rdv.rappels.all(),
    }
    
    return render(request, 'rdv_app/rendez_vous/detail.html', context)


@login_required
def rdv_confirmer(request, pk):
    """Confirmer un rendez-vous"""
    rdv = get_object_or_404(RendezVous, pk=pk)
    
    # Vérifier les permissions
    if not check_permission(request.user, ['admin', 'praticien']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.user.role == 'praticien' and rdv.praticien.user != request.user:
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    rdv.statut = 'confirme'
    rdv.save()
    
    log_action(request, 'Confirmation RDV', f'RDV #{rdv.id} confirmé', 'RendezVous', rdv.id)
    messages.success(request, 'Rendez-vous confirmé avec succès !')
    
    return redirect('rdv_detail', pk=rdv.id)


@login_required
def rdv_calendrier(request):
    """Calendrier des rendez-vous"""
    user = request.user
    
    if user.role == 'admin':
        rdv_list = RendezVous.objects.filter(statut__in=['en_attente', 'confirme'])
    elif user.role == 'praticien' and hasattr(user, 'praticien_profile'):
        rdv_list = RendezVous.objects.filter(
            praticien=user.praticien_profile,
            statut__in=['en_attente', 'confirme']
        )
    elif user.role == 'patient' and hasattr(user, 'patient_profile'):
        rdv_list = RendezVous.objects.filter(
            patient=user.patient_profile,
            statut__in=['en_attente', 'confirme']
        )
    else:
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Filtrer par mois (par défaut: mois courant)
    today = date.today()
    month = int(request.GET.get('month', today.month))
    year = int(request.GET.get('year', today.year))
    
    rdv_list = rdv_list.filter(
        date_heure__year=year,
        date_heure__month=month
    ).order_by('date_heure')
    
    context = {
        'rendez_vous_list': rdv_list,
        'month': month,
        'year': year,
    }
    
    return render(request, 'rdv_app/rendez_vous/calendrier.html', context)


# Annulations

@login_required
def annulation_create(request, rdv_id):
    """Demander l'annulation d'un rendez-vous"""
    rdv = get_object_or_404(RendezVous, pk=rdv_id)
    
    # Vérifier que c'est le patient du RDV
    if request.user.role == 'patient' and rdv.patient.user != request.user:
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = AnnulationForm(request.POST)
        if form.is_valid():
            annulation = form.save(commit=False)
            annulation.rdv = rdv
            annulation.save()
            
            log_action(request, 'Demande annulation', f'Demande annulation RDV #{rdv.id}', 'Annulation', annulation.id)
            messages.success(request, 'Votre demande d\'annulation a été envoyée.')
            return redirect('rdv_detail', pk=rdv.id)
    else:
        form = AnnulationForm()
    
    return render(request, 'rdv_app/annulations/form.html', {'form': form, 'rdv': rdv})


@login_required
def annulations_list(request):
    """Liste des demandes d'annulation"""
    if not check_permission(request.user, ['admin', 'praticien']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    annulations = Annulation.objects.all()
    
    if request.user.role == 'praticien' and hasattr(request.user, 'praticien_profile'):
        annulations = annulations.filter(rdv__praticien=request.user.praticien_profile)
    
    # Filtre par statut
    statut = request.GET.get('statut', 'en_attente')
    if statut:
        annulations = annulations.filter(statut=statut)
    
    annulations = annulations.order_by('-date_demande')
    
    context = {
        'annulations': annulations,
        'statut_filter': statut,
    }
    
    return render(request, 'rdv_app/annulations/list.html', context)


@login_required
def annulation_traiter(request, pk, action):
    """Traiter une demande d'annulation"""
    if not check_permission(request.user, ['admin', 'praticien']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    annulation = get_object_or_404(Annulation, pk=pk)
    
    if action == 'accepter':
        annulation.statut = 'acceptee'
        annulation.rdv.statut = 'annule'
        annulation.rdv.save()
        messages.success(request, 'Annulation acceptée. Le créneau a été libéré.')
    elif action == 'refuser':
        annulation.statut = 'refusee'
        messages.info(request, 'Annulation refusée.')
    
    annulation.date_traitement = timezone.now()
    annulation.save()
    
    log_action(request, f'Annulation {action}', f'Annulation #{annulation.id} {action}ée', 'Annulation', annulation.id)
    
    return redirect('annulations_list')


# Rappels

@login_required
def rappels_list(request):
    """Liste des rappels"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    rappels = Rappel.objects.all().order_by('-date_envoi_prevue')
    
    # Filtre par statut d'envoi
    envoye = request.GET.get('envoye', '')
    if envoye:
        rappels = rappels.filter(envoye=(envoye == 'true'))
    
    context = {
        'rappels': rappels,
    }
    
    return render(request, 'rdv_app/rappels/list.html', context)


# Stats et rapports

@login_required
def statistiques_view(request):
    """Tableau de bord des statistiques"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Statistiques générales
    total_rdv = RendezVous.objects.count()
    rdv_confirmes = RendezVous.objects.filter(statut='confirme').count()
    rdv_annules = RendezVous.objects.filter(statut='annule').count()
    rdv_absences = RendezVous.objects.filter(statut='absence').count()
    
    # Taux d'annulation
    taux_annulation = (rdv_annules / total_rdv * 100) if total_rdv > 0 else 0
    
    # Rendez-vous par praticien
    rdv_par_praticien = Praticien.objects.annotate(
        nb_rdv=Count('rendez_vous')
    ).order_by('-nb_rdv')
    
    # Rendez-vous par spécialité
    rdv_par_specialite = Praticien.objects.values('specialite').annotate(
        nb_rdv=Count('rendez_vous')
    ).order_by('-nb_rdv')
    
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
    
    context = {
        'total_rdv': total_rdv,
        'rdv_confirmes': rdv_confirmes,
        'rdv_annules': rdv_annules,
        'rdv_absences': rdv_absences,
        'taux_annulation': taux_annulation,
        'rdv_par_praticien': rdv_par_praticien[:10],
        'rdv_par_specialite': rdv_par_specialite,
        'rdv_mois': rdv_mois,
    }
    
    return render(request, 'rdv_app/statistiques/dashboard.html', context)


@login_required
def rapport_export(request):
    """Exporter les rapports"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    format_export = request.GET.get('format', 'csv')
    date_debut = request.GET.get('date_debut', '')
    date_fin = request.GET.get('date_fin', '')
    
    # Filtrer les rendez-vous
    rdv_list = RendezVous.objects.all()
    if date_debut:
        rdv_list = rdv_list.filter(date_heure__gte=date_debut)
    if date_fin:
        rdv_list = rdv_list.filter(date_heure__lte=date_fin)
    
    if format_export == 'csv':
        return generer_rapport_csv(rdv_list)
    elif format_export == 'pdf':
        return generer_rapport_pdf(rdv_list)
    
    messages.error(request, 'Format d\'export non supporté.')
    return redirect('statistiques')


# Logs

@login_required
def logs_view(request):
    """Consulter les logs"""
    if not check_permission(request.user, ['admin']):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    logs = Log.objects.all().order_by('-date')[:100]
    
    # Filtres
    action = request.GET.get('action', '')
    if action:
        logs = logs.filter(action__icontains=action)
    
    context = {
        'logs': logs,
    }
    
    return render(request, 'rdv_app/logs/list.html', context)

