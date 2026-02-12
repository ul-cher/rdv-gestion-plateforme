from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import (
    User, Praticien, HorairePraticien, Indisponibilite,
    Patient, RendezVous, Annulation
)
from datetime import datetime, timedelta


class LoginForm(AuthenticationForm):
    """Formulaire de connexion personnalisé"""
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Nom d\'utilisateur'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Mot de passe'
        })
    )


class PatientRegistrationForm(UserCreationForm):
    """Formulaire d'inscription pour les patients"""
    civilite = forms.ChoiceField(
        choices=Patient.CIVILITE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    first_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Prénom'})
    )
    last_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nom'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'})
    )
    telephone = forms.CharField(
        max_length=15,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Téléphone'})
    )
    adresse = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Adresse', 'rows': 3})
    )
    date_naissance = forms.DateField(
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nom d\'utilisateur'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({'class': 'form-control', 'placeholder': 'Mot de passe'})
        self.fields['password2'].widget.attrs.update({'class': 'form-control', 'placeholder': 'Confirmer le mot de passe'})


class PraticienForm(forms.ModelForm):
    """Formulaire pour créer/modifier un praticien"""
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nom d\'utilisateur'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'})
    )
    first_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Prénom'})
    )
    last_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nom'})
    )
    password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Mot de passe (laisser vide pour ne pas changer)'})
    )
    
    class Meta:
        model = Praticien
        fields = ['civilite', 'specialite', 'numero_rpps', 'telephone', 'photo', 'actif']
        widgets = {
            'civilite': forms.Select(attrs={'class': 'form-select'}),
            'specialite': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ex: Médecin généraliste, Cardiologue'}),
            'numero_rpps': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Numéro RPPS (optionnel)'}),
            'telephone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Téléphone professionnel'}),
            'photo': forms.FileInput(attrs={'class': 'form-control'}),
            'actif': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
    
    def __init__(self, *args, **kwargs):
        self.instance_user = kwargs.pop('instance_user', None)
        super().__init__(*args, **kwargs)
        
        if self.instance_user:
            self.fields['username'].initial = self.instance_user.username
            self.fields['email'].initial = self.instance_user.email
            self.fields['first_name'].initial = self.instance_user.first_name
            self.fields['last_name'].initial = self.instance_user.last_name
            self.fields['password'].required = False


class PatientForm(forms.ModelForm):
    """Formulaire pour créer/modifier un patient"""
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nom d\'utilisateur'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'})
    )
    first_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Prénom'})
    )
    last_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nom'})
    )
    password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Mot de passe (laisser vide pour ne pas changer)'})
    )
    
    class Meta:
        model = Patient
        fields = ['civilite', 'telephone', 'adresse', 'date_naissance', 'photo']
        widgets = {
            'civilite': forms.Select(attrs={'class': 'form-select'}),
            'telephone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Téléphone'}),
            'adresse': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Adresse complète', 'rows': 3}),
            'date_naissance': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'photo': forms.FileInput(attrs={'class': 'form-control'}),
        }
    
    def __init__(self, *args, **kwargs):
        self.instance_user = kwargs.pop('instance_user', None)
        super().__init__(*args, **kwargs)
        
        if self.instance_user:
            self.fields['username'].initial = self.instance_user.username
            self.fields['email'].initial = self.instance_user.email
            self.fields['first_name'].initial = self.instance_user.first_name
            self.fields['last_name'].initial = self.instance_user.last_name
            self.fields['password'].required = False


class HorairePraticienForm(forms.ModelForm):
    """Formulaire pour définir les horaires d'un praticien"""
    class Meta:
        model = HorairePraticien
        fields = ['jour_semaine', 'heure_debut', 'heure_fin']
        widgets = {
            'jour_semaine': forms.Select(attrs={'class': 'form-select'}),
            'heure_debut': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
            'heure_fin': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
        }
    
    def clean(self):
        cleaned_data = super().clean()
        heure_debut = cleaned_data.get('heure_debut')
        heure_fin = cleaned_data.get('heure_fin')
        
        if heure_debut and heure_fin and heure_debut >= heure_fin:
            raise ValidationError("L'heure de fin doit être après l'heure de début.")
        
        return cleaned_data


class IndisponibiliteForm(forms.ModelForm):
    """Formulaire pour définir les indisponibilités d'un praticien"""
    class Meta:
        model = Indisponibilite
        fields = ['date_debut', 'date_fin', 'motif']
        widgets = {
            'date_debut': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'date_fin': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'motif': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ex: Congés, Formation'}),
        }
    
    def clean(self):
        cleaned_data = super().clean()
        date_debut = cleaned_data.get('date_debut')
        date_fin = cleaned_data.get('date_fin')
        
        if date_debut and date_fin and date_debut > date_fin:
            raise ValidationError("La date de fin doit être après la date de début.")
        
        return cleaned_data


class RendezVousForm(forms.ModelForm):
    """Formulaire pour créer un rendez-vous"""
    date = forms.DateField(
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    heure = forms.TimeField(
        widget=forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'})
    )
    
    class Meta:
        model = RendezVous
        fields = ['praticien', 'motif']
        widgets = {
            'praticien': forms.Select(attrs={'class': 'form-select'}),
            'motif': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Décrivez le motif de votre consultation', 'rows': 3}),
        }
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Filtrer uniquement les praticiens actifs
        self.fields['praticien'].queryset = Praticien.objects.filter(actif=True)
        
        # Si l'utilisateur est un praticien, on peut pré-sélectionner ou limiter
        if user and hasattr(user, 'praticien_profile'):
            self.fields['praticien'].initial = user.praticien_profile
    
    def clean(self):
        cleaned_data = super().clean()
        date = cleaned_data.get('date')
        heure = cleaned_data.get('heure')
        praticien = cleaned_data.get('praticien')
        
        if date and heure:
            date_heure = datetime.combine(date, heure)
            # Rendre le datetime timezone-aware pour la comparaison
            date_heure = timezone.make_aware(date_heure)
            
            # Vérifier que la date est dans le futur
            if date_heure <= timezone.now():
                raise ValidationError("La date et l'heure du rendez-vous doivent être dans le futur.")
            
            # Vérifier si le créneau est disponible
            if praticien:
                rdv_existant = RendezVous.objects.filter(
                    praticien=praticien,
                    date_heure=date_heure,
                    statut__in=['en_attente', 'confirme']
                ).exists()
                
                if rdv_existant:
                    raise ValidationError("Ce créneau n'est pas disponible.")
            
            cleaned_data['date_heure'] = date_heure
        
        return cleaned_data


class AnnulationForm(forms.ModelForm):
    """Formulaire pour demander l'annulation d'un rendez-vous"""
    class Meta:
        model = Annulation
        fields = ['motif']
        widgets = {
            'motif': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Raison de l\'annulation', 'rows': 3}),
        }


class RendezVousAdminForm(forms.ModelForm):
    """Formulaire admin pour gérer les rendez-vous"""
    class Meta:
        model = RendezVous
        fields = ['patient', 'praticien', 'date_heure', 'motif', 'statut', 'notes']
        widgets = {
            'patient': forms.Select(attrs={'class': 'form-select'}),
            'praticien': forms.Select(attrs={'class': 'form-select'}),
            'date_heure': forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
            'motif': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'statut': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
        }


class SearchForm(forms.Form):
    """Formulaire de recherche générique"""
    q = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Rechercher...'})
    )


class DateRangeForm(forms.Form):
    """Formulaire pour filtrer par période"""
    date_debut = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    date_fin = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )

