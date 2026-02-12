from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rdv_app.models import Praticien, Patient, RendezVous, HorairePraticien
from datetime import datetime, timedelta, time
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Crée des données de test pour la plateforme RDV'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🚀 Création des données de test...'))

        # Supprimer les données existantes (optionnel)
        # User.objects.filter(is_superuser=False).delete()

        # 1. Créer un admin s'il n'existe pas
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123',
                first_name='Admin',
                last_name='Système',
                role='admin'
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Admin créé: admin / admin123'))
        else:
            self.stdout.write(self.style.WARNING('⚠️  Admin existe déjà'))

        # 2. Créer des praticiens
        praticiens_data = [
            {
                'username': 'dr_martin',
                'first_name': 'Jean',
                'last_name': 'Martin',
                'email': 'j.martin@example.com',
                'civilite': 'Dr',
                'specialite': 'Médecin généraliste',
                'telephone': '0612345678',
            },
            {
                'username': 'dr_dupont',
                'first_name': 'Marie',
                'last_name': 'Dupont',
                'email': 'm.dupont@example.com',
                'civilite': 'Dr',
                'specialite': 'Cardiologue',
                'telephone': '0612345679',
            },
            {
                'username': 'dr_bernard',
                'first_name': 'Pierre',
                'last_name': 'Bernard',
                'email': 'p.bernard@example.com',
                'civilite': 'Dr',
                'specialite': 'Pédiatre',
                'telephone': '0612345680',
            },
        ]

        for prat_data in praticiens_data:
            username = prat_data['username']
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    password='praticien123',
                    email=prat_data['email'],
                    first_name=prat_data['first_name'],
                    last_name=prat_data['last_name'],
                    role='praticien'
                )
                
                praticien = Praticien.objects.create(
                    user=user,
                    civilite=prat_data['civilite'],
                    specialite=prat_data['specialite'],
                    telephone=prat_data['telephone'],
                    actif=True
                )

                # Créer des horaires pour le praticien (Lundi à Vendredi)
                for jour in range(1, 6):  # 1=Lundi, 5=Vendredi
                    HorairePraticien.objects.create(
                        praticien=praticien,
                        jour_semaine=jour,
                        heure_debut=time(9, 0),
                        heure_fin=time(12, 0)
                    )
                    HorairePraticien.objects.create(
                        praticien=praticien,
                        jour_semaine=jour,
                        heure_debut=time(14, 0),
                        heure_fin=time(18, 0)
                    )

                self.stdout.write(self.style.SUCCESS(f'✅ Praticien créé: {username} / praticien123'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  Praticien {username} existe déjà'))

        # 3. Créer des patients
        patients_data = [
            {
                'username': 'patient1',
                'first_name': 'Sophie',
                'last_name': 'Lefebvre',
                'email': 's.lefebvre@example.com',
                'civilite': 'Mme',
                'telephone': '0623456781',
                'adresse': '10 rue de la Paix, 75001 Paris',
                'date_naissance': '1985-05-15',
            },
            {
                'username': 'patient2',
                'first_name': 'Thomas',
                'last_name': 'Rousseau',
                'email': 't.rousseau@example.com',
                'civilite': 'M',
                'telephone': '0623456782',
                'adresse': '25 avenue des Champs, 75008 Paris',
                'date_naissance': '1990-08-22',
            },
            {
                'username': 'patient3',
                'first_name': 'Emma',
                'last_name': 'Moreau',
                'email': 'e.moreau@example.com',
                'civilite': 'Mlle',
                'telephone': '0623456783',
                'adresse': '5 boulevard Saint-Michel, 75005 Paris',
                'date_naissance': '1995-03-10',
            },
        ]

        for pat_data in patients_data:
            username = pat_data['username']
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    password='patient123',
                    email=pat_data['email'],
                    first_name=pat_data['first_name'],
                    last_name=pat_data['last_name'],
                    role='patient'
                )
                
                Patient.objects.create(
                    user=user,
                    civilite=pat_data['civilite'],
                    telephone=pat_data['telephone'],
                    adresse=pat_data['adresse'],
                    date_naissance=pat_data['date_naissance']
                )

                self.stdout.write(self.style.SUCCESS(f'✅ Patient créé: {username} / patient123'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  Patient {username} existe déjà'))

        # 4. Créer quelques rendez-vous
        try:
            praticien = Praticien.objects.first()
            patient = Patient.objects.first()
            
            if praticien and patient:
                # RDV dans le futur
                rdv1 = RendezVous.objects.create(
                    patient=patient,
                    praticien=praticien,
                    date_heure=timezone.now() + timedelta(days=2, hours=10),
                    motif='Consultation générale',
                    statut='en_attente'
                )
                
                rdv2 = RendezVous.objects.create(
                    patient=patient,
                    praticien=praticien,
                    date_heure=timezone.now() + timedelta(days=5, hours=14),
                    motif='Suivi médical',
                    statut='confirme'
                )
                
                self.stdout.write(self.style.SUCCESS(f'✅ {RendezVous.objects.count()} rendez-vous créés'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️  Rendez-vous non créés: {e}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Données de test créées avec succès!\n'))
        self.stdout.write(self.style.SUCCESS('🔑 Comptes créés:'))
        self.stdout.write(self.style.SUCCESS('   Admin:     admin / admin123'))
        self.stdout.write(self.style.SUCCESS('   Praticien: dr_martin / praticien123'))
        self.stdout.write(self.style.SUCCESS('   Patient:   patient1 / patient123'))
