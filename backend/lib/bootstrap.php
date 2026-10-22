<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'");
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('weightaty');
session_set_cookie_params(['httponly'=>true, 'samesite'=>'Lax', 'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'path'=>'/']);
if (getenv('SESSION_DIR')) session_save_path(getenv('SESSION_DIR'));
if (!session_start()) {http_response_code(503);echo json_encode(['message'=>'Stockage des sessions indisponible.']);exit;}
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
function fail(int $status, string $message): never { http_response_code($status); echo json_encode(['message'=>$message], JSON_UNESCAPED_UNICODE); exit; }
function query(string $sql, array $args = []): PDOStatement { $s=db()->prepare($sql); $s->execute($args); return $s; }
function one(string $sql, array $args=[]): ?array { return query($sql,$args)->fetch() ?: null; }
function rows(string $sql, array $args=[]): array { return query($sql,$args)->fetchAll(); }
function need(bool $ok, string $message, int $status=422): void { if (!$ok) throw new DomainException($message,$status); }
function text(array $data, string $name, int $max=1000, bool $required=true): string {
    $v=$data[$name] ?? ''; need(is_string($v), 'Champ invalide : '.$name); $v=trim($v);
    need((!$required || $v!=='') && mb_strlen($v)<=$max, 'Champ requis ou trop long : '.$name); return $v;
}
function number(array $data, string $name, bool $zero=false, float $max=999999.99): string {
    $v=$data[$name] ?? null; need(is_scalar($v) && preg_match('/^\d{1,8}(\.\d{1,2})?$/D',(string)$v)===1, 'Nombre invalide : '.$name);
    need(is_finite((float)$v) && ($zero ? (float)$v>=0 : (float)$v>0) && (float)$v<=$max, 'Nombre hors limites : '.$name);
    return number_format((float)$v,2,'.','');
}
function ident(mixed $v): int { need(is_scalar($v) && preg_match('/^[0-9]+$/D',(string)$v)===1 && (int)$v>0, 'Identifiant invalide'); return (int)$v; }
function me(bool $required=true): ?array {
    $u=isset($_SESSION['uid']) ? one('SELECT * FROM utilisateur WHERE id=?',[$_SESSION['uid']]) : null;
    if ($u && (!one('SELECT utilisateur_id FROM sessions_actives WHERE empreinte=?',[hash('sha256',session_id())]) || $u['statut']!=='actif' || time()-($_SESSION['last']??0)>7200)) { unset($_SESSION['uid'],$_SESSION['last']); $u=null; }
    if ($required) need((bool)$u,'Connectez-vous pour continuer.',401);
    if ($u) $_SESSION['last']=time(); return $u;
}
function admin(array $u): void { need((bool)one('SELECT utilisateur_id FROM administrateur WHERE utilisateur_id=?',[$u['id']]),'Accès administrateur interdit.',403); }
function atomic(callable $action): mixed {
    db()->beginTransaction();
    try { query('SELECT id FROM verrou_application WHERE id=1 FOR UPDATE'); $r=$action(); db()->commit(); return $r; }
    catch (Throwable $e) { if (db()->inTransaction()) db()->rollBack(); throw $e; }
}
function notify(int $uid, int $rid, string $message): void { query('INSERT INTO notification(utilisateur_id,demande_id,type,message) VALUES (?,?,?,?)',[$uid,$rid,'demande',$message]); }
function audit(int $uid, string $action, int $target): void { query('INSERT INTO journal_action(acteur_id,action,cible_id) VALUES (?,?,?)',[$uid,$action,$target]); }
function requestRow(int $id, array $u): array {
    $r=one('SELECT d.*,c.expediteur_id,c.poids,c.statut colis_statut,t.voyageur_id,t.statut trajet_statut,t.date_depart FROM demande_transport d JOIN colis c ON c.id=d.colis_id JOIN trajet t ON t.id=d.trajet_id WHERE d.id=?',[$id]);
    need((bool)$r,'Demande introuvable.',404);
    need($u['id']==$r['expediteur_id'] || $u['id']==$r['voyageur_id'],'Accès interdit.',403); return $r;
}
function refundDemo(int $rid): void {
    query('INSERT IGNORE INTO remboursement(paiement_id) SELECT id FROM paiement WHERE demande_id=?',[$rid]);
}
function cancelTrip(int $id, array $u, bool $asAdmin=false): array {
    $t=one('SELECT * FROM trajet WHERE id=?',[$id]); need((bool)$t,'Trajet introuvable.',404);
    need($asAdmin || $t['voyageur_id']==$u['id'],'Accès interdit.',403);
    need($t['statut']==='publie','Ce trajet ne peut plus être annulé.',409);
    need(!one("SELECT c.id FROM colis c JOIN demande_transport d ON d.colis_id=c.id WHERE d.trajet_id=? AND d.statut='acceptee' AND c.statut IN ('pris_en_charge','livre')",[$id]),'Transport engagé : annulation impossible.',409);
    foreach(rows("SELECT d.*,c.expediteur_id FROM demande_transport d JOIN colis c ON c.id=d.colis_id WHERE d.trajet_id=? AND d.statut IN ('en_attente','acceptee')",[$id]) as $r) {
        query("UPDATE demande_transport SET statut='annulee',date_annulation=UTC_TIMESTAMP() WHERE id=?",[$r['id']]);
        query("UPDATE colis SET statut='pret' WHERE id=?",[$r['colis_id']]);
        refundDemo((int)$r['id']);
        notify((int)$r['expediteur_id'],(int)$r['id'],'Le trajet a été annulé. Paiement simulé remboursé si nécessaire.');
    }
    query("UPDATE trajet SET statut='annule' WHERE id=?",[$id]); audit((int)$u['id'],'annuler_trajet',$id); return ['ok'=>true];
}
function publicUser(array $u, bool $private=false): array {
    $id=$u['id']; $avg=one('SELECT AVG(note) rating FROM avis WHERE destinataire_id=?',[$id]);
    $result=['id'=>(string)$id,'firstName'=>$u['prenom'],'lastName'=>$u['nom'],'name'=>$u['prenom'].' '.$u['nom'],
      'initials'=>mb_substr($u['prenom'],0,1).mb_substr($u['nom'],0,1),'location'=>$u['localisation'],'about'=>$u['description'],
      'rating'=>(float)($avg['rating']??0),'completed'=>(int)query("SELECT COUNT(*) FROM trajet WHERE voyageur_id=? AND statut='termine'",[$id])->fetchColumn(),
      'since'=>substr($u['date_creation'],0,4),'admin'=>(bool)one('SELECT utilisateur_id FROM administrateur WHERE utilisateur_id=?',[$id])];
    if ($private) $result+=['email'=>$u['email'],'phone'=>$u['telephone']]; return $result;
}
function capacity(int $tid): float {
    return (float)query("SELECT t.poids_total-COALESCE((SELECT SUM(c.poids) FROM demande_transport d JOIN colis c ON c.id=d.colis_id WHERE d.trajet_id=t.id AND d.statut='acceptee'),0) FROM trajet t WHERE t.id=?",[$tid])->fetchColumn();
}
function tripView(array $t): array {
    return ['id'=>(string)$t['id'],'ownerId'=>(string)$t['voyageur_id'],'from'=>$t['depart'],'to'=>$t['destination'],
      'date'=>substr($t['date_depart'],0,10),'capacity'=>capacity((int)$t['id']),'totalCapacity'=>(float)$t['poids_total'],
      'pickup'=>$t['lieu_remise'],'delivery'=>$t['lieu_recuperation'],'notes'=>$t['informations'],
      'status'=>['publie'=>'Publié','annule'=>'Annulé','termine'=>'Terminé'][$t['statut']]];
}
function parcelView(array $p): array {
    $draft=one('SELECT trajet_id FROM brouillon_trajet WHERE colis_id=?',[$p['id']]);
    $photo=one('SELECT photo_url FROM photo_colis WHERE colis_id=? ORDER BY id LIMIT 1',[$p['id']]);
    return ['id'=>(string)$p['id'],'ownerId'=>(string)$p['expediteur_id'],'tripId'=>isset($draft['trajet_id'])?(string)$draft['trajet_id']:null,
      'type'=>$p['type'],'description'=>$p['description'],'weight'=>(float)$p['poids'],'value'=>(float)$p['valeur_declaree'],
      'length'=>(float)$p['longueur'],'width'=>(float)$p['largeur'],'height'=>(float)$p['hauteur'],'photo'=>$photo['photo_url']??'',
      'status'=>['brouillon'=>'Brouillon','pret'=>'Prêt','pris_en_charge'=>'En transport','livre'=>'Livré','annule'=>'Annulé'][$p['statut']],
      'createdAt'=>substr($p['date_creation'],0,10)];
}
function requestView(array $r): array {
    return ['id'=>(string)$r['id'],'parcelId'=>(string)$r['colis_id'],'tripId'=>(string)$r['trajet_id'],
      'senderId'=>(string)$r['expediteur_id'],'status'=>['en_attente'=>'En attente','acceptee'=>'Acceptée','refusee'=>'Refusée','annulee'=>'Annulée'][$r['statut']],
      'createdAt'=>substr($r['date_demande'],0,10)];
}
