import csv
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from .models import Log


def get_client_ip(request):
    """IP du client"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_action(request, action, details='', table_cible='', cible_id=None):
    """Enregistre dans les logs"""
    try:
        user = request.user if request.user.is_authenticated else None
        ip_address = get_client_ip(request)
        
        Log.objects.create(
            user=user,
            action=action,
            details=details,
            table_cible=table_cible,
            cible_id=cible_id,
            ip_address=ip_address
        )
    except Exception as e:
        print(f"Erreur lors de l'enregistrement du log: {e}")


def check_permission(user, allowed_roles):
    """Check permissions"""
    if not user.is_authenticated:
        return False
    
    if user.is_superuser:
        return True
    
    return user.role in allowed_roles


def generer_rapport_csv(rdv_list):
    """Export CSV"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="rapport_rdv_{timezone.now().strftime("%Y%m%d")}.csv"'
    response.write('\ufeff')  # BOM UTF-8 pour Excel
    
    writer = csv.writer(response, delimiter=';')
    writer.writerow(['ID', 'Patient', 'Praticien', 'Date et Heure', 'Motif', 'Statut', 'Date de création'])
    
    for rdv in rdv_list:
        writer.writerow([
            rdv.id,
            rdv.patient.user.get_full_name(),
            rdv.praticien.user.get_full_name(),
            rdv.date_heure.strftime('%d/%m/%Y %H:%M'),
            rdv.motif,
            rdv.get_statut_display(),
            rdv.date_creation.strftime('%d/%m/%Y %H:%M')
        ])
    
    return response


def generer_rapport_pdf(rdv_list):
    """Export PDF"""
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="rapport_rdv_{timezone.now().strftime("%Y%m%d")}.pdf"'
    
    doc = SimpleDocTemplate(response, pagesize=landscape(A4))
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Titre
    titre = Paragraph(f"<b>Rapport des Rendez-vous - {timezone.now().strftime('%d/%m/%Y')}</b>", styles['Title'])
    elements.append(titre)
    elements.append(Spacer(1, 0.5*cm))
    
    # Données du tableau
    data = [['ID', 'Patient', 'Praticien', 'Date et Heure', 'Statut']]
    
    for rdv in rdv_list[:50]:  # Limiter à 50 pour la lisibilité
        data.append([
            str(rdv.id),
            rdv.patient.user.get_full_name(),
            rdv.praticien.user.get_full_name(),
            rdv.date_heure.strftime('%d/%m/%Y %H:%M'),
            rdv.get_statut_display()
        ])
    
    # Créer le tableau
    table = Table(data, colWidths=[2*cm, 5*cm, 5*cm, 4*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    
    # Construire le PDF
    doc.build(elements)
    
    return response


def get_creneaux_disponibles(praticien, date_cible):
    """Obtenir les créneaux disponibles pour un praticien à une date donnée"""
    from datetime import datetime, timedelta
    from .models import RendezVous, Indisponibilite, HorairePraticien
    
    # Récupérer le jour de la semaine (1=Lundi, 7=Dimanche)
    jour_semaine = date_cible.isoweekday()
    
    # Vérifier si le praticien travaille ce jour
    horaires = HorairePraticien.objects.filter(
        praticien=praticien,
        jour_semaine=jour_semaine
    )
    
    if not horaires.exists():
        return []
    
    # Vérifier les indisponibilités
    indisponible = Indisponibilite.objects.filter(
        praticien=praticien,
        date_debut__lte=date_cible,
        date_fin__gte=date_cible
    ).exists()
    
    if indisponible:
        return []
    
    # Générer les créneaux (par exemple, toutes les 30 minutes)
    creneaux = []
    for horaire in horaires:
        heure_debut = datetime.combine(date_cible, horaire.heure_debut)
        heure_fin = datetime.combine(date_cible, horaire.heure_fin)
        
        heure_courante = heure_debut
        while heure_courante < heure_fin:
            # Vérifier si le créneau est déjà pris
            rdv_existant = RendezVous.objects.filter(
                praticien=praticien,
                date_heure=heure_courante,
                statut__in=['en_attente', 'confirme']
            ).exists()
            
            if not rdv_existant:
                creneaux.append(heure_courante)
            
            heure_courante += timedelta(minutes=30)
    
    return creneaux

