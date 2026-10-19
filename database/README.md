# Weight’Aty — Base MySQL

Nom officiel : `weightaty_db`. MySQL **8.0.16 ou plus récent**.

## Installation dans MySQL Workbench
1. Sur une base locale **neuve**, ouvrir `01_creation_weightaty_securisee.sql`, puis exécuter tout le script.
2. Pour une base de **démonstration uniquement**, ouvrir et exécuter `02_donnees_test.sql` **une seule fois**. Ne pas l'utiliser sur une base réelle.
3. Exécuter `03_requetes_verification.sql` et vérifier les résultats.

Le script 01 n'utilise ni DROP ni TRUNCATE. `CREATE TABLE IF NOT EXISTS` évite de supprimer les tables, **mais ne migre pas une structure existante** : vérifier les différences manuellement. Il n'est pas recommandé de lancer les scripts sur une base de production sans sauvegarde.

Le script 02 contient des identifiants explicites et échoue s'il est relancé : c'est volontaire pour éviter de mélanger des données fictives et réelles. Les valeurs `TEST_NO_LOGIN` **ne sont pas des hash de mots de passe valides** ; le backend devra créer de vrais hash avant tout test de connexion. Les images de démonstration sont des chemins indicatifs, pas des fichiers livrés.

## Limitations connues
- Le schéma actuel ne contient pas de dates de prise en charge ni de livraison ; à définir en équipe avant la logique de suivi et les avis.
- Les règles d'autorisation, les changements d'état, la réservation atomique de capacité et l'unicité d'une acceptation par colis doivent être contrôlés par le backend et des transactions.
- Le choix d'une authentification par sessions doit être confirmé avec l'équipe.
- Les fichiers SQL ne contiennent aucun mot de passe MySQL personnel. Ne pas committer de `.env` réel.
- Scripts préparés à partir de l'export Workbench fourni ; **pas de serveur MySQL disponible pour un test d'exécution réel dans cet environnement**.
