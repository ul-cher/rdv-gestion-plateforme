"""
ASGI config for plateforme_rdv project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plateforme_rdv.settings')

application = get_asgi_application()
