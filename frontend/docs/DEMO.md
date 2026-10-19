# Fonctionnalités simulées

## Fonctionnement navigateur

- Navigation entre fichiers HTML, menu mobile, retour en haut et lien d’évitement.
- Accueil avec cartes de trajets accessibles et explication expéditeur/voyageur.
- Recherche, filtres cumulés, date exacte, recherche insensible aux accents, tri et réinitialisation.
- Conservation des critères saisis depuis l’accueil.
- Détails liés au bon trajet, lieux de remise et profil du voyageur.
- Formulaire colis, validation, refus du poids excessif, prévisualisation et suppression de photo.
- Préparation du brouillon et retour « Modifier » prérempli.
- Garde de WAT-27 sans données : aucune demande fictive par défaut.
- Envoi local idempotent : un seul envoi par colis.
- Synchronisation colis, demandes, notifications et compteurs.
- Publication, consultation, modification et annulation locale des trajets personnels.
- Demandes reçues, acceptation/refus et annulation avec confirmation.
- Réduction de la capacité lors de l’acceptation, pas lors d’une simple demande.
- Refus de modification d’un trajet avec demandes actives pour éviter une incohérence de démo.
- Profil public/privé, modification locale, sortie du profil et réinitialisation.
- Notifications et marquage comme lu.
- Validation des formulaires connexion/inscription/récupération sans authentification réelle.
- Contact simulé et FAQ avec accordéons natifs.

## Scénario de démonstration conseillé

1. Ouvrir `index.html` ; Marie est le profil fictif courant.
2. Rechercher Paris → Montréal depuis l’accueil.
3. Ouvrir le trajet de Sarah et consulter les lieux de remise.
4. Cliquer sur « Envoyer un colis » ; entrer un poids de 6 kg pour constater le refus (5 kg maximum).
5. Renseigner Documents, une description, 2 kg, 100 MUR et 20 × 15 × 10 cm.
6. Ajouter une photo JPG/PNG facultative, puis valider.
7. Utiliser « Modifier » pour retrouver les valeurs, puis valider à nouveau.
8. Simuler l’envoi et consulter la demande, le colis et le tableau de bord.
9. Depuis Mes trajets, consulter la demande de Nadia sur le trajet de Marie ; l’accepter pour voir la capacité passer de 8 à 7 kg.
10. Modifier le profil et consulter les notifications.
11. Revenir au profil et réinitialiser la démo pour une autre présentation.

## Hors périmètre

Aucune API serveur, base MySQL, authentification sécurisée, vérification d’identité, envoi d’e-mail, contact réel avec un voyageur, paiement, chat temps réel, suivi GPS ou déploiement distant. Les pages juridiques sont explicitement provisoires.
