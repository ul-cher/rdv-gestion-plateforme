from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Praticien, HorairePraticien, Indisponibilite,
    Patient, RendezVous, Annulation, Rappel, Log
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'date_joined']
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {'fields': ('role',)}),
    )


class HorairePraticienInline(admin.TabularInline):
    model = HorairePraticien
    extra = 1


class IndisponibiliteInline(admin.TabularInline):
    model = Indisponibilite
    extra = 0


@admin.register(Praticien)
class PraticienAdmin(admin.ModelAdmin):
    list_display = ['get_nom_complet', 'specialite', 'telephone', 'actif', 'date_creation']
    list_filter = ['specialite', 'actif', 'date_creation']
    search_fields = ['user__first_name', 'user__last_name', 'specialite', 'telephone']
    inlines = [HorairePraticienInline, IndisponibiliteInline]
    
    def get_nom_complet(self, obj):
        return f"{obj.civilite} {obj.user.get_full_name()}"
    get_nom_complet.short_description = 'Nom complet'


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['get_nom_complet', 'telephone', 'date_naissance', 'get_age', 'date_creation']
    list_filter = ['date_creation']
    search_fields = ['user__first_name', 'user__last_name', 'telephone']
    
    def get_nom_complet(self, obj):
        return f"{obj.civilite} {obj.user.get_full_name()}"
    get_nom_complet.short_description = 'Nom complet'


@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'praticien', 'date_heure', 'statut', 'date_creation']
    list_filter = ['statut', 'date_heure', 'date_creation']
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'praticien__user__first_name', 'praticien__user__last_name']
    date_hierarchy = 'date_heure'


@admin.register(Annulation)
class AnnulationAdmin(admin.ModelAdmin):
    list_display = ['rdv', 'date_demande', 'statut', 'date_traitement']
    list_filter = ['statut', 'date_demande']


@admin.register(Rappel)
class RappelAdmin(admin.ModelAdmin):
    list_display = ['rdv', 'type_rappel', 'date_envoi_prevue', 'envoye', 'date_envoi_effectif']
    list_filter = ['type_rappel', 'envoye', 'date_envoi_prevue']


@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    list_display = ['date', 'user', 'action', 'table_cible', 'cible_id', 'ip_address']
    list_filter = ['action', 'table_cible', 'date']
    search_fields = ['user__username', 'action', 'details']
    date_hierarchy = 'date'
    readonly_fields = ['date', 'user', 'action', 'details', 'table_cible', 'cible_id', 'ip_address']

