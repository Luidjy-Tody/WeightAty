# Démonstration connectée

Consulter le README principal pour l’installation PHP/MySQL et la configuration des dossiers privés.

Deux comptes réels dans la base de démonstration sont nécessaires : un publie le trajet, l’autre prépare son colis et envoie la demande. Les mêmes comptes peuvent inverser les rôles pour d’autres transports. Le voyageur accepte ou refuse dans Demandes reçues.

Depuis le détail de la demande, ouvrir « Messages, paiement et suivi ». Le paiement puis le remboursement éventuel sont simulés. Les données de trajet, colis, demande, messages, suivi et avis sont enregistrées dans la base.

Le tarif pédagogique par défaut est de 200 MUR/kg, plus 50 MUR de frais. Il ne représente pas un tarif commercial validé. Aucun numéro de carte ni CVV n’est demandé.

L’acceptation réserve la capacité ; une demande en attente ne réserve rien. L’annulation avant prise en charge libère le poids et rembourse uniquement de manière simulée. Après prise en charge, les annulations ordinaires sont refusées. Les cas litigieux nécessitent un signalement et une procédure humaine encore à définir.

Pour les réinitialisations, `MAIL_OUTBOX` permet de consulter localement le lien temporaire sans envoyer de véritable e-mail. Les pages informatives et Contact restent une démonstration ; Contact indique explicitement qu’il n’envoie aucun message réel.
