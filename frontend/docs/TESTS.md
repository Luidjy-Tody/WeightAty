# Vérifications de la version HTML classique

Date : 19 octobre 2026.

## Exécuté

- Syntaxe vérifiée avec `node --check` pour tous les scripts JavaScript.
- `node --test tests/frontend.test.cjs` : **16 tests réussis, 0 échec**.
- Présence des 27 pages HTML et des ressources locales auxquelles elles renvoient.
- Présence des vrais formulaires dans les fichiers HTML.
- Accueil : trois cartes, textes, formulaire, deux panneaux d’étapes et seulement deux scripts.
- Absence de `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` et de balises de page générées dans les scripts.
- Suppression des anciennes vues JavaScript et du générateur de pages.
- Tests logiques des filtres, poids, brouillons, demandes, capacités, annulations, notifications et stockage fictif sans mot de passe.

## Non exécuté dans cet environnement

Les tests Node ne sont pas des tests de navigateur. Ils ne valident pas l’apparence CSS, les événements réels du navigateur, le focus, le décodage des photos ou l’affichage sur téléphone.

Le script Playwright est fourni mais n’a pas été exécuté ici : le dispositif autorisé de prévisualisation locale n’était pas disponible. Aucun navigateur local n’a été installé pour contourner cette limite.

## À vérifier sur le poste de l’équipe

1. Ouvrir avec Live Server ou un serveur statique HTTP.
2. Tester les liens des pages et le menu mobile.
3. Rechercher Paris → Montréal depuis l’accueil.
4. Ouvrir le trajet de Sarah, saisir un colis trop lourd, puis un colis valide.
5. Ajouter/supprimer une photo, revenir avec « Modifier », simuler l’envoi.
6. Vérifier Mes colis, Mes demandes, les notifications et les compteurs.
7. Accepter/refuser une demande reçue et tester l’annulation d’un trajet.
8. Tester les formulaires de profil et d’accès simulé.
9. Vérifier les largeurs 360, 390, 768 et 1440 px sur plusieurs navigateurs.

Aucun test de serveur, base de données, authentification réelle, e-mail ou paiement : ces éléments sont hors périmètre.
