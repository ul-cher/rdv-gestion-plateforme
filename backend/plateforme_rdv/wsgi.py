"""
WSGI config for plateforme_rdv project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plateforme_rdv.settings')

application = get_wsgi_application()
