# API à développer — contrat proposé

Ce document décrit des **propositions d’interface**, pas des endpoints existants. Aucun serveur n’est inclus. Validez ces choix avec l’équipe avant de développer le backend.

## Intégration

- Les scripts d’interaction appellent `WAT.services` ; ils ne construisent pas les pages HTML.
- En démonstration, `js/services/demo.js` affecte `WAT.services = WAT.mock`.
- Remplacer cette affectation par un service HTTP quand l’équipe aura validé et implémenté les API.
- `js/services/api.js` est un client fetch d’exemple non chargé par défaut. Il faut adapter les appels à votre contrat final ; il n’existe pas de commutateur qui connecterait automatiquement tout le projet.
- L’authentification, le contact, le stockage des brouillons et les photos nécessitent une intégration explicite.
- Ne pas stocker d’identifiants MySQL ni de secrets dans le frontend.
- Le client HTTP proposé utilise `credentials: 'include'`. Adapter CORS, cookies et protections à la stratégie d’authentification retenue.

## Routes par domaine

| Domaine | Méthode et route proposées | Fonction frontend / résultat attendu |
| --- | --- | --- |
| Connexion | `POST /api/auth/login` | À relier au formulaire ; session sécurisée, pas une validation locale |
| Inscription | `POST /api/auth/register` | À relier au formulaire ; validation serveur et politique de mot de passe |
| Déconnexion | `POST /api/auth/logout` | `logout()` ; 204 |
| Récupération | `POST /api/auth/forgot-password` | À relier ; réponse générique, sans révéler les comptes existants |
| Réinitialisation | `POST /api/auth/reset-password` | À concevoir avec le futur parcours serveur |
| Profil courant | `GET /api/me` | `getUser()` ; utilisateur privé ou null si session absente selon contrat final |
| Profil | `PATCH /api/me` | `updateProfile(data)` ; utilisateur mis à jour |
| Profil public | `GET /api/utilisateurs/:id` | `getUser(id)` ; données publiques seulement |
| Recherche | `GET /api/trajets?from=&to=&date=&minWeight=&sort=` | `getTrips(filters)` ; tableau de trajets |
| Détail trajet | `GET /api/trajets/:id` | `getTrip(id)` ; trajet ou 404 |
| Mes trajets | `GET /api/me/trajets` | `getMyTrips()` ; tableau de trajets |
| Publication | `POST /api/trajets` | `saveTrip(data)` ; trajet créé |
| Modification | `PATCH /api/trajets/:id` | `saveTrip(data,id)` ; trajet modifié |
| Annulation | `POST /api/trajets/:id/annulation` | `cancelTrip(id)` ; trajet annulé |
| Mes colis | `GET /api/me/colis` | `getParcels()` ; tableau de colis |
| Colis | `GET /api/colis/:id` | `getParcel(id)` ; accès propriétaire |
| Création brouillon | `POST /api/colis` | `saveDraft(data)` ; colis créé |
| Modification brouillon | `PATCH /api/colis/:id` | `saveDraft(data)` ; colis modifié |
| Brouillon courant | `GET /api/me/colis/brouillon` | À relier à `getDraft()` au lieu du cache local |
| Photo | `POST /api/colis/:id/photo` | À intégrer : multipart/form-data, retour photoUrl |
| Suppression photo | `DELETE /api/colis/:id/photo` | À intégrer ; 204 |
| Demandes | `GET /api/demandes?direction=envoyees` ou `recues` | `getRequests(incoming)` ; tableau de demandes |
| Détail demande | `GET /api/demandes/:id` | `getRequest(id)` ; demande autorisée |
| Colis de la demande | `GET /api/demandes/:id/colis` | `getRequestParcel(id)` ; accès expéditeur ou propriétaire du trajet |
| Envoyer demande | `POST /api/demandes` | `sendRequest(parcelId)` ; demande créée |
| Statut demande | `PATCH /api/demandes/:id` | `updateRequest(id,status)` ; demande mise à jour |
| Notifications | `GET /api/me/notifications` | `getNotifications()` ; tableau |
| Lecture | `POST /api/me/notifications/lecture` | `markNotificationsRead()` ; 204 |
| Contact | `POST /api/contact` | À intégrer ; confirmation réelle uniquement après succès serveur |

La façade actuelle attend des objets et tableaux directs. Si votre API utilise `{data: ...}`, adapter la façade. Prévoir une pagination lorsque les listes réelles seront volumineuses.

## Formats manipulés par les scripts de page

Dates civiles : `YYYY-MM-DD`. Les nombres sont des nombres JSON, pas des textes avec virgule. Les identifiants sont des chaînes opaques générées par le serveur.

### Trajet

```json
{
  "id": "TRA-2",
  "ownerId": "sarah",
  "from": "Paris",
  "to": "Montréal",
  "date": "2026-11-18",
  "capacity": 5,
  "pickup": "Paris 11e, place de la République",
  "delivery": "Montréal, Plateau-Mont-Royal",
  "notes": "Documents et petits colis acceptés.",
  "status": "Publié"
}
```

`capacity` représente la capacité restante. Le serveur doit gérer les réservations atomiquement. La démo la réduit à l’acceptation d’une demande.

### Colis

```json
{
  "id": "WAT-1234",
  "ownerId": "marie",
  "tripId": "TRA-2",
  "type": "Documents",
  "description": "Documents fictifs",
  "weight": 2,
  "value": 100,
  "length": 20,
  "width": 15,
  "height": 10,
  "photo": "",
  "createdAt": "2026-10-19",
  "status": "Brouillon"
}
```

Unités : kg, cm et MUR. La démo emploie une data URL pour `photo`. En production, téléverser le fichier séparément puis mapper `photoUrl` vers l’attribut utilisé par la vue. Ne pas envoyer aveuglément une image base64 dans les requêtes JSON préparées.

### Demande

```json
{
  "id": "DEM-1234",
  "parcelId": "WAT-1234",
  "tripId": "TRA-2",
  "senderId": "marie",
  "createdAt": "2026-10-19",
  "status": "En attente"
}
```

États de demande utilisés : `En attente`, `Acceptée`, `Refusée`, `Annulée`. La progression du transport et la livraison sont à définir séparément avec l’équipe.

### Utilisateur et notification

L’utilisateur public contient `id`, `name`, `initials`, `location`, `about`, `rating`, `completed`, `since`. L’utilisateur courant ajoute `firstName`, `lastName`, `email`, `phone`. Ne jamais renvoyer les coordonnées privées d’un autre utilisateur via l’API publique.

Notification : `id`, `userId`, `text`, `route`, `date`, `read`. La route reste une route interne autorisée de l’application.

## Erreurs

Le client préparé accepte les réponses d’erreur suivantes :

```json
{"message":"Le poids dépasse la capacité disponible."}
```

Codes à convenir : 400/422 validation, 401 session absente, 403 action interdite, 404 introuvable, 409 conflit/doublon/capacité, 413 fichier trop volumineux, 429 limitation et 500 erreur interne. Les erreurs par champ pourront être ajoutées et reliées à `WAT.dom.errors`.

## Garanties attendues du backend

- Déduire le propriétaire de la session, jamais d’un identifiant reçu du navigateur.
- Vérifier les droits pour chaque colis, trajet, demande, photo et notification.
- Revalider les champs et les transitions de statut.
- Garantir l’idempotence de l’envoi (contrainte d’unicité ou clé d’idempotence).
- Réserver/restituer la capacité dans une transaction et gérer les accès concurrents.
- Générer les identifiants et les dates côté serveur.
- Valider et stocker les photos avec des règles adaptées aux fichiers réels.
- Prévoir une vraie stratégie d’authentification, de journalisation et de protection des données.

Ces éléments sont des travaux futurs pour le backend ; aucun n’est présenté comme une sécurité fournie par le localStorage.
