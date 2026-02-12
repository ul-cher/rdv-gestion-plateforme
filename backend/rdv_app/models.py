from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import datetime, timedelta


class User(AbstractUser):
    """Utilisateur étendu avec système de rôles"""
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('praticien', 'Praticien'),
        ('patient', 'Patient'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
    )
    
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"


class Praticien(models.Model):
    """Praticiens et médecins"""
    CIVILITE_CHOICES = [
        ('M', 'Monsieur'),
        ('Mme', 'Madame'),
        ('Dr', 'Docteur'),
        ('Pr', 'Professeur'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='praticien_profile')
    civilite = models.CharField(max_length=3, choices=CIVILITE_CHOICES, default='Dr')
    specialite = models.CharField(max_length=100)
    numero_rpps = models.CharField(max_length=11, blank=True, null=True, help_text="Numéro RPPS (optionnel)")
    telephone = models.CharField(max_length=15)
    photo = models.ImageField(upload_to='praticiens/', blank=True, null=True)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Praticien'
        verbose_name_plural = 'Praticiens'
    
    def __str__(self):
        return f"{self.get_civilite_display()} {self.user.get_full_name()} - {self.specialite}"
    
    def is_disponible_today(self):
        """Check si dispo aujourd'hui"""
        today = timezone.now().date()
        indispo = Indisponibilite.objects.filter(
            praticien=self,
            date_debut__lte=today,
            date_fin__gte=today
        ).exists()
        return self.actif and not indispo


class HorairePraticien(models.Model):
    """Horaires de consultation"""
    JOURS_SEMAINE = [
        (1, 'Lundi'),
        (2, 'Mardi'),
        (3, 'Mercredi'),
        (4, 'Jeudi'),
        (5, 'Vendredi'),
        (6, 'Samedi'),
        (7, 'Dimanche'),
    ]
    
    praticien = models.ForeignKey(Praticien, on_delete=models.CASCADE, related_name='horaires')
    jour_semaine = models.IntegerField(choices=JOURS_SEMAINE)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    
    class Meta:
        verbose_name = 'Horaire Praticien'
        verbose_name_plural = 'Horaires Praticiens'
        unique_together = ['praticien', 'jour_semaine', 'heure_debut']
    
    def __str__(self):
        return f"{self.praticien.user.get_full_name()} - {self.get_jour_semaine_display()}: {self.heure_debut}-{self.heure_fin}"


class Indisponibilite(models.Model):
    """Congés et indisponibilités"""
    praticien = models.ForeignKey(Praticien, on_delete=models.CASCADE, related_name='indisponibilites')
    date_debut = models.DateField()
    date_fin = models.DateField()
    motif = models.CharField(max_length=200, help_text="Ex: Congés, Formation, Urgence")
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Indisponibilité'
        verbose_name_plural = 'Indisponibilités'
        ordering = ['-date_debut']
    
    def __str__(self):
        return f"{self.praticien.user.get_full_name()} - {self.motif} ({self.date_debut} au {self.date_fin})"


class Patient(models.Model):
    """Patients"""
    CIVILITE_CHOICES = [
        ('M', 'Monsieur'),
        ('Mme', 'Madame'),
        ('Mlle', 'Mademoiselle'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    civilite = models.CharField(max_length=4, choices=CIVILITE_CHOICES, default='M')
    telephone = models.CharField(max_length=15)
    adresse = models.TextField()
    date_naissance = models.DateField()
    photo = models.ImageField(upload_to='patients/', blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'
    
    def __str__(self):
        return f"{self.get_civilite_display()} {self.user.get_full_name()}"
    
    def get_age(self):
        """Calcul de l'âge"""
        today = timezone.now().date()
        age = today.year - self.date_naissance.year
        if today.month < self.date_naissance.month or (today.month == self.date_naissance.month and today.day < self.date_naissance.day):
            age -= 1
        return age


class RendezVous(models.Model):
    """Rendez-vous"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirme', 'Confirmé'),
        ('annule', 'Annulé'),
        ('absence', 'Absence sans préavis'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='rendez_vous')
    praticien = models.ForeignKey(Praticien, on_delete=models.CASCADE, related_name='rendez_vous')
    date_heure = models.DateTimeField()
    motif = models.TextField(help_text="Ex: Consultation générale, Contrôle")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    notes = models.TextField(blank=True, help_text="Notes internes (praticien/admin)")
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Rendez-vous'
        verbose_name_plural = 'Rendez-vous'
        ordering = ['-date_heure']
    
    def __str__(self):
        return f"{self.patient.user.get_full_name()} - {self.praticien.user.get_full_name()} - {self.date_heure.strftime('%d/%m/%Y %H:%M')}"
    
    def is_passe(self):
        """RDV passé?"""
        return self.date_heure < timezone.now()


class Annulation(models.Model):
    """Annulations"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('acceptee', 'Acceptée'),
        ('refusee', 'Refusée'),
    ]
    
    rdv = models.ForeignKey(RendezVous, on_delete=models.CASCADE, related_name='annulations')
    date_demande = models.DateTimeField(auto_now_add=True)
    motif = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    date_traitement = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Annulation'
        verbose_name_plural = 'Annulations'
        ordering = ['-date_demande']
    
    def __str__(self):
        return f"Annulation RDV #{self.rdv.id} - {self.get_statut_display()}"


class Rappel(models.Model):
    """Rappels automatiques"""
    TYPE_CHOICES = [
        ('24h', '24 heures avant'),
        ('48h', '48 heures avant'),
    ]
    
    rdv = models.ForeignKey(RendezVous, on_delete=models.CASCADE, related_name='rappels')
    date_envoi_prevue = models.DateTimeField()
    type_rappel = models.CharField(max_length=10, choices=TYPE_CHOICES, default='24h')
    envoye = models.BooleanField(default=False)
    date_envoi_effectif = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Rappel'
        verbose_name_plural = 'Rappels'
        ordering = ['-date_envoi_prevue']
    
    def __str__(self):
        return f"Rappel {self.get_type_rappel_display()} - RDV #{self.rdv.id}"


class Log(models.Model):
    """Logs système"""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True)
    table_cible = models.CharField(max_length=50, blank=True)
    cible_id = models.IntegerField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Log'
        verbose_name_plural = 'Logs'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.date.strftime('%d/%m/%Y %H:%M')} - {self.action} - {self.user}"

