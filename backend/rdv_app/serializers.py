from rest_framework import serializers
from .models import (
    User, Praticien, Patient, RendezVous, Annulation, 
    Rappel, Log, HorairePraticien, Indisponibilite
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle User"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active']
        read_only_fields = ['id']
        extra_kwargs = {'password': {'write_only': True}}


class PraticienSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Praticien"""
    user = UserSerializer(read_only=True)
    nom_complet = serializers.SerializerMethodField()
    
    class Meta:
        model = Praticien
        fields = [
            'id', 'user', 'civilite', 'specialite', 'numero_rpps', 
            'telephone', 'photo', 'actif', 'date_creation', 'nom_complet'
        ]
    
    def get_nom_complet(self, obj):
        return f"{obj.get_civilite_display()} {obj.user.get_full_name()}"


class HorairePraticienSerializer(serializers.ModelSerializer):
    """Serializer pour les horaires de praticien"""
    jour_semaine_display = serializers.CharField(source='get_jour_semaine_display', read_only=True)
    
    class Meta:
        model = HorairePraticien
        fields = '__all__'


class IndisponibiliteSerializer(serializers.ModelSerializer):
    """Serializer pour les indisponibilités"""
    praticien_nom = serializers.SerializerMethodField()
    
    class Meta:
        model = Indisponibilite
        fields = '__all__'
    
    def get_praticien_nom(self, obj):
        return obj.praticien.user.get_full_name()


class PatientSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Patient"""
    user = UserSerializer(read_only=True)
    age = serializers.SerializerMethodField()
    nom_complet = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'civilite', 'telephone', 'adresse', 
            'date_naissance', 'photo', 'date_creation', 'age', 'nom_complet'
        ]
    
    def get_age(self, obj):
        return obj.get_age()
    
    def get_nom_complet(self, obj):
        return f"{obj.get_civilite_display()} {obj.user.get_full_name()}"


class RendezVousSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle RendezVous"""
    patient = PatientSerializer(read_only=True)
    praticien = PraticienSerializer(read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    is_passe = serializers.SerializerMethodField()
    
    # Pour la création
    patient_id = serializers.IntegerField(write_only=True, required=False)
    praticien_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = RendezVous
        fields = [
            'id', 'patient', 'praticien', 'date_heure', 'motif', 'statut', 
            'notes', 'date_creation', 'date_modification', 'statut_display',
            'is_passe', 'patient_id', 'praticien_id'
        ]
    
    def get_is_passe(self, obj):
        return obj.is_passe()
    
    def create(self, validated_data):
        patient_id = validated_data.pop('patient_id', None)
        praticien_id = validated_data.pop('praticien_id', None)
        
        if patient_id:
            validated_data['patient'] = Patient.objects.get(id=patient_id)
        if praticien_id:
            validated_data['praticien'] = Praticien.objects.get(id=praticien_id)
        
        return super().create(validated_data)


class AnnulationSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Annulation"""
    rdv = RendezVousSerializer(read_only=True)
    rdv_id = serializers.IntegerField(write_only=True, required=False)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Annulation
        fields = [
            'id', 'rdv', 'date_demande', 'motif', 'statut', 
            'date_traitement', 'statut_display', 'rdv_id'
        ]
    
    def create(self, validated_data):
        rdv_id = validated_data.pop('rdv_id', None)
        if rdv_id:
            validated_data['rdv'] = RendezVous.objects.get(id=rdv_id)
        return super().create(validated_data)


class RappelSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Rappel"""
    rdv = RendezVousSerializer(read_only=True)
    type_rappel_display = serializers.CharField(source='get_type_rappel_display', read_only=True)
    
    class Meta:
        model = Rappel
        fields = [
            'id', 'rdv', 'date_envoi_prevue', 'type_rappel', 
            'envoye', 'date_envoi_effectif', 'type_rappel_display'
        ]


class LogSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Log"""
    user = UserSerializer(read_only=True)
    user_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Log
        fields = [
            'id', 'user', 'action', 'details', 'table_cible', 
            'cible_id', 'date', 'ip_address', 'user_display'
        ]
    
    def get_user_display(self, obj):
        if obj.user:
            return obj.user.get_full_name()
        return "Système"


class PraticienCreateSerializer(serializers.Serializer):
    """Serializer pour la création d'un praticien"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True)
    civilite = serializers.ChoiceField(choices=Praticien.CIVILITE_CHOICES)
    specialite = serializers.CharField(max_length=100)
    numero_rpps = serializers.CharField(max_length=11, required=False, allow_blank=True)
    telephone = serializers.CharField(max_length=15)
    actif = serializers.BooleanField(default=True)
    
    def validate(self, data):
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Ce nom d'utilisateur existe déjà"})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Cet email existe déjà"})
        
        return data
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        
        # Données utilisateur
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'role': 'praticien'
        }
        
        # Créer l'utilisateur
        user = User.objects.create_user(**user_data, password=password)
        
        # Créer le profil praticien
        praticien = Praticien.objects.create(user=user, **validated_data)
        
        return praticien


class PatientCreateSerializer(serializers.Serializer):
    """Serializer pour la création d'un patient"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True)
    civilite = serializers.ChoiceField(choices=Patient.CIVILITE_CHOICES)
    telephone = serializers.CharField(max_length=15)
    adresse = serializers.CharField(required=False, allow_blank=True)
    date_naissance = serializers.DateField()
    
    def validate(self, data):
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Ce nom d'utilisateur existe déjà"})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Cet email existe déjà"})
        
        return data
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        
        # Données utilisateur
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'role': 'patient'
        }
        
        # Créer l'utilisateur
        user = User.objects.create_user(**user_data, password=password)
        
        # Créer le profil patient
        patient = Patient.objects.create(user=user, **validated_data)
        
        return patient


class PatientRegistrationSerializer(serializers.Serializer):
    """Serializer pour l'inscription d'un patient"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    civilite = serializers.ChoiceField(choices=Patient.CIVILITE_CHOICES)
    telephone = serializers.CharField(max_length=15)
    adresse = serializers.CharField()
    date_naissance = serializers.DateField()
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà")
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Cet email existe déjà")
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        # Données utilisateur
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'role': 'patient'
        }
        
        # Créer l'utilisateur
        user = User.objects.create_user(**user_data, password=password)
        
        # Créer le profil patient
        patient = Patient.objects.create(user=user, **validated_data)
        
        return patient
