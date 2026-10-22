<?php
// OUTIL LOCAL : AUCUNE ROUTE WEB POUR ATTRIBUER LES DROITS
if (PHP_SAPI!=='cli') {http_response_code(404);exit;}
require_once __DIR__.'/config/database.php';
if (($argv[1]??'')==='admin' && filter_var($argv[2]??'',FILTER_VALIDATE_EMAIL)) {
 $s=db()->prepare('SELECT id FROM utilisateur WHERE email=?');$s->execute([$argv[2]]);$id=$s->fetchColumn();
 if (!$id) {fwrite(STDERR,"Compte introuvable : inscrivez-le d’abord.\n");exit(1);}
 db()->prepare('INSERT IGNORE INTO administrateur(utilisateur_id) VALUES (?)')->execute([$id]);
 echo "Droits administrateur attribués au compte demandé.\n";
} else {fwrite(STDERR,"Usage : php backend/cli.php admin adresse@example.com\n");exit(1);}
