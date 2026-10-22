# Finalisation Weight’Aty — 22 octobre 2026

## Référence et audit initial

Branche de référence : `develop`, commit `898f8cf6ad9521f6ded3b70d9421732e2d56e066`.
Branche de travail : `feature/finalisation-sprints`.

Dix branches ont été recensées. Les branches WAT-22 et WAT-24 contiennent aussi des travaux d’authentification et de recherche, absents de `develop`. Leur historique et leurs différences ont été consultés. Aucune branche n’a été fusionnée automatiquement. Cette proposition part uniquement de `develop` et conserve les branches des autres membres.

L’architecture existante comprend le frontend HTML/CSS/JavaScript, des mocks et services locaux, 27 pages HTML, des tests frontend et les scripts SQL des utilisateurs, trajets, colis, demandes, notifications et avis. Les fichiers backend de `develop` étaient des squelettes de dix octets. Aucun parcours connecté n’était donc fourni par cette branche. Les comptes et demandes affichés par le frontend utilisaient localStorage.

## Travaux par sprint

| Sprint | Réalisation | Vérification obtenue |
|---|---|---|
| 0 — Architecture | Configuration locale, PDO, API JSON, erreurs, routeur public, migration additive, lanceur de tests | Création SQL et migration exécutées sur MariaDB ; tests API/DOM |
| 1 — Authentification | Inscription, connexion, déconnexion, CSRF, sessions révocables, profil, rôle administrateur, oubli/réinitialisation | Droits, suspension, jeton à usage unique et anciennes sessions testés ; e-mails testés par boîte locale |
| 2 — Trajets | Publication, modification, annulation, recherche, filtres, tri, détails et profil voyageur | API et formulaires DOM ; rendu mobile à vérifier |
| 3 — Colis et demandes | Brouillon, édition, photo privée, demande idempotente, réception, acceptation/refus/annulation, notifications et messages | API, concurrence réelle entre deux sessions, DOM ; polling des messages toutes les dix secondes |
| 4 — Livraison | Tarif côté serveur, paiement et remboursement simulés, prise en charge, livraison et avis | Parcours API jusqu’à livraison et avis ; aucun paiement bancaire |
| 5 — Administration | Consultation comptes/trajets/demandes/transactions/signalements/statistiques, suspension/réactivation, annulation contrôlée, résolution des signalements | Permissions et opérations administratives API ; rendu de la page administrateur non vérifié visuellement |

Les principaux fichiers créés sont `backend/api/index.php`, `backend/lib/bootstrap.php`, `backend/config/env.php`, `backend/router.php`, `backend/photo.php`, `backend/cli.php`, les tests connectés et `database/migrations/04_finalisation.sql`. Les points d’entrée PHP existants délèguent au même traitement. Trois nouvelles pages HTML complètent les pages conservées : réinitialisation, transport et administration. Les fichiers HTML gardent leur contenu et leurs templates ; aucune génération de page complète n’a été introduite en JavaScript.

## Données et règles

La migration ne supprime ni tables ni lignes existantes. Elle ajoute les droits administrateur, le trajet provisoire des brouillons, les sessions révocables, le verrou des mutations, les messages, paiements/remboursements simulés, dates de suivi, signalements, tentatives de connexion et journal d’actions.

Les clés étrangères, contraintes et unicités existantes restent en place. Le code serveur vérifie les droits, transitions, dates, dimensions, poids et participation aux avis. Toutes les mutations de l’API sont sérialisées par une ligne verrouillée dans une transaction InnoDB. Cette solution simple protège la capacité et les colis du projet étudiant, mais limite le débit des écritures. Les écritures directes hors API doivent respecter les mêmes règles.

Le poids disponible est calculé depuis les demandes acceptées ; il n’existe pas de deuxième compteur modifiable. Un colis engagé ne peut pas être modifié. Une demande refusée ou annulée conserve son historique ; le colis peut être préparé pour un autre trajet. Une nouvelle demande sur la même paire colis/trajet est refusée, conformément à l’unicité SQL. Après prise en charge, une annulation standard est refusée. Avant prise en charge, le paiement éventuel est remboursé uniquement en simulation.

Les sessions PHP sont distinctes de l’ancienne table `session_utilisateur`, conservée mais inutilisée. La table `sessions_actives` permet la révocation après suspension ou changement du mot de passe. Les secrets et photos restent hors du dépôt. Les réinitialisations peuvent utiliser une boîte locale privée de démonstration.

## Tests réellement exécutés

- 16 tests frontend historiques réussis.
- 129 requêtes API vérifiées sur PHP 8.3.6/MariaDB 10.11.14 : parcours principal, erreurs, droits, concurrence, photos, remboursement simulé, administration et réinitialisation.
- 32 contrôles DOM connectés réussis sous jsdom 30.1.3.
- Syntaxe PHP/JavaScript et vérification des différences Git.

Les essais ont notamment détecté un stockage de sessions inaccessible dans l’environnement de test et des erreurs de préparation des fixtures DOM. Ils ont été corrigés avant la relance complète. Le dossier privé `SESSION_DIR` est configurable et l’application signale désormais l’indisponibilité des sessions.

Le téléchargement de Chromium a échoué. Le script Playwright connecté est fourni mais ses résultats ne sont pas déclarés réussis. Les contrôles DOM ne remplacent pas les vérifications visuelles à 360, 390, 768 et 1440 px. MySQL lui-même n’a pas été exécuté ; la compatibilité SQL annoncée doit être vérifiée sur la version retenue par l’équipe.

## Limites et décisions à valider

- Tarif pédagogique de 200 MUR/kg et 50 MUR de frais par défaut, configurable et sans valeur contractuelle.
- Paiements et remboursements exclusivement simulés. Aucun fournisseur bancaire ni versement réel au voyageur.
- E-mails réels seulement si le serveur `mail()` est configuré ; boîte locale utilisée dans les tests.
- Parcours d’administration implémenté pour consulter les transactions et annuler un trajet ou une demande avant prise en charge. Les litiges après prise en charge demandent une procédure humaine à définir.
- Contact et les contenus juridiques/informatifs restent des éléments de démonstration.
- Nettoyage différé des fichiers photos orphelins, quotas de stockage, journalisation exhaustive, sauvegardes automatiques, test de charge et audit externe de sécurité à prévoir avant une mise en production.
- Aucun déploiement public ni aucune fusion dans `develop` n’est réalisé automatiquement. Relire les changements avec les auteurs des branches WAT-22 et WAT-24 pour coordonner leurs PR.

L’installation et les commandes de vérification sont décrites dans le README principal. Les API sont documentées dans `frontend/docs/API.md`.

## Livraison GitHub

Les changements sont enregistrés localement dans `feature/finalisation-sprints`. La branche `develop` est restée au commit de référence lors de la dernière vérification.

La publication est bloquée : le push Git ne dispose pas d’identifiants d’écriture et l’API du connecteur GitHub refuse la création d’un arbre avec `403 Resource not accessible by integration`. Aucune branche distante ni Pull Request n’a donc été créée. Ce refus vient de l’accès GitHub disponible, pas d’un échec des tests.

La livraison comprend une archive du projet et un patch Git contenant les commits. Depuis un clone de travail propre, basé sur la version `develop` analysée :

```sh
git switch develop
git pull --ff-only
git switch -c feature/finalisation-sprints
git am /chemin/WeightAty-finalisation.patch
git push -u origin feature/finalisation-sprints
```

Créer ensuite une Pull Request en brouillon, de cette branche vers `develop`, et joindre les résultats de tests ci-dessus. Si `develop` a changé entre-temps, relire et résoudre les éventuels conflits avant publication. Aucune fusion automatique n’est prévue.

Commits locaux principaux : `f6fd05f` (backend et migration), `78a0a4c` (frontend connecté), `c2d627e` (documentation), `e7f4376` (mise en forme). Le patch comprend aussi la mise à jour de ce rapport de livraison.
