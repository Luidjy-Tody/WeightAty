# API PHP connectée

Base : `/backend/api/index.php?op=OPERATION`, sur la même origine que le frontend.
Les réponses sont JSON. Les noms anglais correspondent aux champs des formulaires existants et sont convertis en colonnes françaises côté PHP.

GET `session` fournit `{csrf,user}`. Envoyer ensuite le cookie de session et `X-CSRF-Token` pour chaque POST, y compris l’inscription et la connexion. La connexion renouvelle le jeton CSRF. Les champs inconnus ne permettent pas d’attribuer un rôle.

| Méthode | op | Paramètres principaux | Accès |
|---|---|---|---|
| GET | session | aucun | Public |
| POST | register | firstName, lastName, email, password | Public + CSRF |
| POST | login | email, password | Public + CSRF |
| POST | forgot | email | Public + CSRF |
| POST | reset | token, password | Jeton temporaire + CSRF |
| POST | logout | aucun | Connecté |
| GET | user | id facultatif | Profil public ; coordonnées réservées au propriétaire |
| POST | profile | firstName, lastName, location, about, email, phone | Propriétaire |
| GET | trips | from, to, date, minWeight, sort=date ou weight | Public |
| GET | trip | id | Public |
| GET | myTrips | aucun | Connecté |
| POST | saveTrip | id facultatif, from, to, date, capacity, pickup, delivery, notes | Propriétaire |
| POST | cancelTrip | id | Propriétaire |
| GET | parcels | aucun | Colis de l’utilisateur |
| GET | parcel | id | Propriétaire |
| GET | draft | aucun | Dernier brouillon de l’utilisateur |
| POST | saveDraft | id facultatif, tripId, type, description, weight, value, length, width, height, photo | Propriétaire |
| POST | sendRequest | parcelId | Expéditeur du colis |
| GET | requests | incoming=0 ou 1 | Demandes envoyées ou reçues |
| GET | request, requestParcel | id de la demande | Participants |
| POST | updateRequest | id, status=Acceptée/Refusée/Annulée | Voyageur accepte/refuse, expéditeur annule |
| GET | notifications | aucun | Destinataire |
| POST | readNotifications | aucun | Destinataire |
| GET | transport | id de la demande | Participants |
| POST | message | id, content | Participants |
| POST | pay | id | Expéditeur, demande acceptée |
| POST | pickup | id | Voyageur après paiement simulé |
| POST | deliver | id | Expéditeur après prise en charge |
| POST | review | id, note, comment | Participant après livraison |
| POST | report | id, reason | Participant |
| GET | admin | aucun | Administrateur |
| POST | adminAction | id, action=suspend/activate/cancelTrip/cancelRequest/resolve | Administrateur |

`transport` renvoie le devis de démonstration, le paiement, le remboursement éventuel, les dates de suivi, les messages et les avis. La messagerie est actualisée toutes les dix secondes lorsque la page est visible. Les listes de demandes et les notifications sont actualisées à l’ouverture de leur page.

`photo` est un data URL JPG/PNG lors de l’enregistrement, limité à 5 Mo et vérifié côté serveur. La réponse contient ensuite une URL de photo privée. Les images restent hors du dépôt et sont servies via `backend/photo.php` avec contrôle de droits. La suppression d’une référence photo conserve actuellement l’ancien fichier sur disque ; un nettoyage contrôlé des fichiers orphelins est à prévoir.

Les anciens fichiers API PHP restent des points d’entrée compatibles et délèguent au même traitement. Les nouvelles fonctions frontend utilisent le routeur `op` ci-dessus.

Codes : 400 JSON/jeton invalide ; 401 connexion requise ; 403 droits/CSRF ; 404 ressource introuvable ; 405 méthode ; 409 état métier ou doublon ; 422 champs ; 429 limitation des tentatives ; 500 erreur serveur ; 503 configuration/service indisponible. Le JSON d’erreur contient `message`.
