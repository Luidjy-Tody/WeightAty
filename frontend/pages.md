# Pages et routes

Chaque entrée ci-dessous est un vrai fichier HTML. Les identifiants sont transmis dans la chaîne de requête.

| Page | Fichier |
| --- | --- |
| Accueil | `index.html` |
| Connexion | `pages/connexion.html` |
| Inscription | `pages/inscription.html` |
| Mot de passe oublié | `pages/mot-de-passe-oublie.html` |
| Recherche | `pages/recherche.html` |
| Détail d’un trajet | `pages/trajet-details.html?id=TRA-2` |
| Publication | `pages/publier-trajet.html` |
| Modification d’un trajet | `pages/publier-trajet.html?edit=MT-1` |
| Tableau de bord | `pages/dashboard.html` |
| Mes trajets | `pages/mes-trajets.html` |
| Détail de mon trajet | `pages/mon-trajet.html?id=MT-1` |
| Mes demandes | `pages/mes-demandes.html` |
| Demandes reçues | `pages/demandes-recues.html` |
| Détail d’une demande | `pages/demande-details.html?id=DEM-204` |
| Mes colis | `pages/mes-colis.html` |
| Détail d’un colis | `pages/colis-details.html?id=WAT-1048` |
| Informations colis WAT-26 | `pages/colis.html?trip=TRA-2` |
| Reprendre un brouillon | `pages/colis.html?parcel=WAT-1048` |
| Envoyer une demande WAT-27 | `pages/demande-transport.html` |
| Profil | `pages/profil.html` |
| Modification du profil | `pages/modifier-profil.html` |
| Profil du voyageur | `pages/voyageur.html?id=sarah` |
| Notifications | `pages/notifications.html` |
| À propos | `pages/a-propos.html` |
| Contact | `pages/contact.html` |
| Conditions | `pages/conditions.html` |
| Confidentialité | `pages/confidentialite.html` |
| Centre d’aide | `pages/aide.html` |
| Page introuvable | `pages/introuvable.html` |

Les pages de détail disposent d’un exemple par défaut lorsqu’elles sont ouvertes sans identifiant. Un identifiant inconnu affiche un message d’élément introuvable. WAT-26 sans trajet et WAT-27 sans brouillon invitent à préparer l’envoi plutôt que d’inventer une demande.

Les vues personnelles demandent uniquement l’ouverture du profil fictif. Cela ne constitue pas une autorisation sécurisée.
