# Backend PHP

L’installation complète est décrite dans le README de la racine. Les fichiers qui étaient des squelettes sur `develop` délèguent maintenant au point d’entrée `api/index.php`.

- `config/env.php` lit le fichier `.env` local sans interpréter son contenu. Les variables d’environnement déjà définies restent prioritaires.
- `config/database.php` crée la connexion PDO avec requêtes préparées natives et fuseau UTC.
- `lib/bootstrap.php` contient validation, sessions, autorisations, transactions et conversions destinées au frontend.
- `api/index.php` distribue les opérations métier documentées dans `frontend/docs/API.md`.
- `photo.php` sert une photo privée uniquement au propriétaire ou au voyageur d’une demande associée.
- `cli.php` attribue le rôle administrateur depuis une commande locale.
- `router.php` expose seulement les ressources frontend, les API et les photos autorisées.
- `tests/` contient les scénarios reproductibles sur base de test.

Chaque mutation passe dans une transaction InnoDB et verrouille la ligne `verrou_application.id=1`. Ce choix simple sérialise les mutations du projet étudiant et protège les acceptations concurrentes, y compris entre deux sessions. Une application à forte charge nécessiterait des verrous plus fins. Toutes les écritures métier doivent respecter cette convention, y compris les futurs traitements hors API.

Les sessions PHP utilisent un cookie HttpOnly/SameSite=Lax, renouvelé à la connexion, une expiration après deux heures d’inactivité et une table `sessions_actives` pour la révocation. La table historique `session_utilisateur` est conservée sans suppression mais n’est pas utilisée par cette stratégie. La suspension et la réinitialisation invalident les sessions actives. Les mots de passe utilisent `password_hash`/`password_verify`. Seule l’empreinte SHA-256 des jetons de réinitialisation est en base. La boîte locale contient le lien destiné à l’utilisateur et doit rester privée.

Les requêtes POST exigent `X-CSRF-Token`, obtenu via `GET ?op=session`. Les API partagent l’origine du frontend ; aucun CORS permissif n’est activé. Les erreurs sont en JSON et les détails SQL restent dans les journaux serveur.

Les tarifs sont pédagogiques et configurables par `DEMO_RATE_CENTS` et `DEMO_FEE_CENTS`. Le montant est recalculé côté serveur et enregistré dans `paiement`. Les annulations avant prise en charge créent un remboursement simulé, sans supprimer la transaction. Aucune intégration bancaire n’est incluse.
