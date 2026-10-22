# Vérifications exécutées le 22 octobre 2026

Environnement : PHP 8.3.6, MariaDB 10.11.14, Node du runtime et jsdom 30.1.3.

- 16 tests frontend historiques réussis : ressources, architecture HTML, validations et logique mock. Ces tests seuls ne valident pas le backend.
- 129 requêtes API vérifiées avec le lanceur `backend/tests/run_local.py`, dans une nouvelle base dédiée : authentification, droits, CSRF, validation, capacité concurrente, demandes, messages, paiements/remboursements simulés, livraison, avis, administration, suspension, réinitialisation, révocation et photos privées.
- 32 contrôles DOM connectés réussis avec `frontend/tests/connected-dom.cjs` : formulaires de trajet et de colis, envoi de la demande, chargement des pages et absence d’erreurs JavaScript sur ces scénarios.
- Structure SQL initiale et migration exécutées sur MariaDB ; pas d’exécution sur MySQL.
- Contrôle de syntaxe PHP/JavaScript et `git diff --check`.

Le script Playwright a été réécrit pour le mode connecté et les largeurs 360, 390, 768 et 1440 px. Son lancement reste à faire : le téléchargement de Chromium a échoué dans cet environnement. jsdom ne vérifie ni la mise en page, ni les interactions natives du navigateur, ni les performances mobiles. Aucun audit de sécurité externe ni test de charge n’a été effectué.

Commandes et prérequis : README principal. Les fixtures des tests sont créées par inscription et ne dépendent pas des mots de passe fictifs des anciens scripts SQL.
