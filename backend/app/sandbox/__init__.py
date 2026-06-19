"""Sandbox v2 — isolated research workbench.

A separate SQLite database (``backend/sandbox.db``) and a ``/api/sandbox/*``
router tree power the sandbox. Nothing in this module mutates the main app's
PostgreSQL tables, sessions, programs, or shared gallery.
"""
