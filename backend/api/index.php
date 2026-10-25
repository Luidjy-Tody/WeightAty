<?php
declare(strict_types=1);
require_once __DIR__.'/../lib/bootstrap.php';
try {
    $op=$_GET['op']??'';
    $write=$_SERVER['REQUEST_METHOD']==='POST';
    need(in_array($_SERVER['REQUEST_METHOD'],['GET','POST'],true),'Méthode interdite.',405);
    $data=[];
    if ($write) {
        need(hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''),'Session expirée ou jeton CSRF invalide.',403);
        need((int)($_SERVER['CONTENT_LENGTH']??0)<=8*1024*1024,'Requête trop volumineuse.',413);
        $data=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR);
        need(is_array($data),'Objet JSON attendu.');
    }
    $readOps=['session','user','trips','trip','myTrips','parcels','parcel','draft','requests','request','requestParcel','notifications','transport','admin'];
    need($write ? !in_array($op,$readOps,true) : in_array($op,$readOps,true),'Méthode incorrecte.',405);
    $result=$write ? atomic(fn()=>dispatch($op,$data)) : dispatch($op,$data);
    echo json_encode($result, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
} catch (DomainException $e) { fail($e->getCode()?:422,$e->getMessage()); }
catch (JsonException $e) { fail(400,'JSON invalide.'); }
catch (PDOException $e) { error_log('WeightAty SQL: '.$e->getCode()); fail($e->getCode()==='23000'?409:500,$e->getCode()==='23000'?'Cette opération entre en conflit avec les données existantes.':'Base de données indisponible.'); }
catch (Throwable $e) { error_log('WeightAty: '.$e->getMessage()); fail(500,'Une erreur interne est survenue.'); }

function dispatch(string $op, array $d): mixed {
    if ($op==='session') return ['csrf'=>$_SESSION['csrf'],'user'=>($u=me(false))?publicUser($u,true):null];
    if ($op==='register') {
        $email=mb_strtolower(text($d,'email',255)); need((bool)filter_var($email,FILTER_VALIDATE_EMAIL),'Adresse e-mail invalide.');
        $first=text($d,'firstName',100); $last=text($d,'lastName',100); $pass=text($d,'password',72);
        need(strlen($pass)>=8 && strlen($pass)<=72,'Le mot de passe doit contenir entre 8 et 72 octets.');
        need(preg_match('/\p{L}/u',$pass)===1 && preg_match('/\d/',$pass)===1,'Le mot de passe doit contenir au moins une lettre et un chiffre.');
        need(one('SELECT id FROM utilisateur WHERE email=?',[$email])===null,'Cette adresse e-mail est déjà utilisée.',409);
        query('INSERT INTO utilisateur(prenom,nom,email,mot_de_passe_hash) VALUES (?,?,?,?)',[$first,$last,$email,password_hash($pass,PASSWORD_DEFAULT)]);
        return ['id'=>(string)db()->lastInsertId()];
    }
    if ($op==='login') {
        $email=mb_strtolower(text($d,'email',255)); $password=text($d,'password',500);
        $key=hash('sha256',($_SERVER['REMOTE_ADDR']??'').'|'.$email);
        $attempt=one('SELECT * FROM tentative_connexion WHERE cle=?',[$key]);
        if ($attempt && strtotime($attempt['debut'].' UTC')<time()-900) { query('DELETE FROM tentative_connexion WHERE cle=?',[$key]); $attempt=null; }
        need(!$attempt || $attempt['essais']<10,'Trop de tentatives. Réessayez dans 15 minutes.',429);
        $u=one('SELECT * FROM utilisateur WHERE email=?',[$email]);
        if (!$u || !password_verify($password,$u['mot_de_passe_hash']) || $u['statut']!=='actif') {
            query('INSERT INTO tentative_connexion(cle,essais,debut) VALUES (?,1,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE essais=essais+1',[$key]);
            // Retour normal pour conserver le compteur lors du commit.
            http_response_code(401); return ['message'=>'Adresse e-mail ou mot de passe incorrect.'];
        }
        query('DELETE FROM tentative_connexion WHERE cle=?',[$key]); query('DELETE FROM sessions_actives WHERE empreinte=?',[hash('sha256',session_id())]);session_regenerate_id(true);
        query('INSERT INTO sessions_actives(empreinte,utilisateur_id) VALUES (?,?)',[hash('sha256',session_id()),$u['id']]);
        $_SESSION['uid']=$u['id']; $_SESSION['last']=time(); $_SESSION['csrf']=bin2hex(random_bytes(32));
        return ['user'=>publicUser($u,true),'csrf'=>$_SESSION['csrf']];
    }
    if ($op==='forgot') {
        $email=mb_strtolower(text($d,'email',255)); need((bool)filter_var($email,FILTER_VALIDATE_EMAIL),'Adresse invalide.');
        $key=hash('sha256','reset|'.($_SERVER['REMOTE_ADDR']??''));
        $a=one('SELECT * FROM tentative_connexion WHERE cle=?',[$key]);
        if ($a && strtotime($a['debut'].' UTC')<time()-900) {query('DELETE FROM tentative_connexion WHERE cle=?',[$key]);$a=null;}
        need(!$a || $a['essais']<5,'Trop de demandes. Réessayez plus tard.',429);
        query('INSERT INTO tentative_connexion(cle,essais,debut) VALUES (?,1,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE essais=essais+1',[$key]);
        if ($u=one("SELECT * FROM utilisateur WHERE email=? AND statut='actif'",[$email])) {
            $token=bin2hex(random_bytes(32));
            query('UPDATE reinitialisation_mot_de_passe SET date_utilisation=UTC_TIMESTAMP() WHERE utilisateur_id=? AND date_utilisation IS NULL',[$u['id']]);
            query('INSERT INTO reinitialisation_mot_de_passe(utilisateur_id,empreinte_jeton,date_expiration) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 MINUTE))',[$u['id'],hash('sha256',$token)]);
            $url=(getenv('APP_URL')?:'http://localhost:8000').'/frontend/pages/reinitialisation.html?token='.$token;
            $dir=getenv('MAIL_OUTBOX');
            if ($dir) need(realpath($dir)!==false && !str_starts_with(realpath($dir).DIRECTORY_SEPARATOR,dirname(__DIR__,2).DIRECTORY_SEPARATOR),'La boîte locale doit être hors du dépôt public.',503);
            if ($dir) { need(is_dir($dir) && is_writable($dir),'Boîte de démonstration indisponible.',503);
                $file=$dir.'/'.bin2hex(random_bytes(12)).'.json';
                need(file_put_contents($file,json_encode(['to'=>$email,'resetUrl'=>$url]),LOCK_EX)!==false,'Envoi indisponible.',503);chmod($file,0600);
            } else { need(mail($email,'WeightAty - Nouveau mot de passe',$url),'Service e-mail indisponible.',503); }
        }
        return ['message'=>getenv('MAIL_OUTBOX') ? 'Si ce compte existe, un lien temporaire a été préparé dans la boîte locale du serveur (démonstration).' : 'Si ce compte existe, un lien temporaire a été envoyé.'];
    }
    if ($op==='reset') {
        $token=text($d,'token',128);$pass=text($d,'password',72);need(strlen($pass)>=8 && strlen($pass)<=72,'Mot de passe : 8 à 72 octets.');
        $r=one('SELECT * FROM reinitialisation_mot_de_passe WHERE empreinte_jeton=? AND date_utilisation IS NULL AND date_expiration>UTC_TIMESTAMP()',[hash('sha256',$token)]);
        need((bool)$r,'Lien expiré ou déjà utilisé.',400);
        query('UPDATE utilisateur SET mot_de_passe_hash=? WHERE id=?',[password_hash($pass,PASSWORD_DEFAULT),$r['utilisateur_id']]);
        query('UPDATE reinitialisation_mot_de_passe SET date_utilisation=UTC_TIMESTAMP() WHERE utilisateur_id=?',[$r['utilisateur_id']]);
        query('DELETE FROM sessions_actives WHERE utilisateur_id=?',[$r['utilisateur_id']]);
        return ['ok'=>true];
    }
    if ($op==='user') {
        $self=me(false);$id=isset($_GET['id'])?ident($_GET['id']):($self['id']??null);
        if (!$id) return null;
        $u=one("SELECT * FROM utilisateur WHERE id=? AND statut='actif'",[$id]);return $u?publicUser($u,$self && $self['id']==$id):null;
    }
    if ($op==='trips') {
        $args=[];$where="t.statut='publie' AND t.date_depart>=UTC_DATE() AND u.statut='actif'";
        foreach(['from'=>'depart','to'=>'destination'] as $k=>$col) if (!empty($_GET[$k])) { $where.=" AND t.$col LIKE ?";$args[]='%'.str_replace(['!','%','_'],['!!','!%','!_'],(string)$_GET[$k]).'%';$where.=" ESCAPE '!'"; }
        if (!empty($_GET['date'])) {$where.=' AND DATE(t.date_depart)=?';$args[]=$_GET['date'];}
        $trips=array_map('tripView',rows('SELECT t.* FROM trajet t JOIN utilisateur u ON u.id=t.voyageur_id WHERE '.$where,$args));
        $trips=array_values(array_filter($trips,fn($t)=>$t['capacity']>=max(0,(float)($_GET['minWeight']??0))));
        usort($trips,($_GET['sort']??'')==='weight'?fn($a,$b)=>$b['capacity']<=>$a['capacity']:fn($a,$b)=>strcmp($a['date'],$b['date']));return $trips;
    }
    if ($op==='trip') { $t=one('SELECT * FROM trajet WHERE id=?',[ident($_GET['id']??null)]);return $t?tripView($t):null; }
    $u=me();$uid=(int)$u['id'];
    if ($op!=='logout') {
        $sid=hash('sha256',session_id());
        $revoked=one('SELECT utilisateur_id FROM sessions_actives WHERE empreinte=?',[$sid]);
        need((bool)$revoked,'Session expirée. Reconnectez-vous.',401);
    }
    switch($op) {
    case 'logout':
        query('DELETE FROM sessions_actives WHERE empreinte=?',[hash('sha256',session_id())]);$_SESSION=[];session_regenerate_id(true);return ['ok'=>true];
    case 'profile':
        $fields=['firstName'=>'prenom','lastName'=>'nom','location'=>'localisation','about'=>'description','email'=>'email','phone'=>'telephone'];$set=[];$args=[];
        foreach($fields as $k=>$col) if (array_key_exists($k,$d)) { $v=text($d,$k, $k==='about'?2000:($k==='email'?255:($k==='phone'?30:100)),in_array($k,['firstName','lastName','email']));
            if ($k==='email') need((bool)filter_var($v,FILTER_VALIDATE_EMAIL),'Adresse e-mail invalide.');$set[]="$col=?";$args[]=$v; }
        need(count($set)>0,'Aucune modification.');$args[]=$uid;query('UPDATE utilisateur SET '.implode(',',$set).' WHERE id=?',$args);return publicUser(me(),true);
    case 'myTrips': return array_map('tripView',rows('SELECT * FROM trajet WHERE voyageur_id=? ORDER BY date_depart',[$uid]));
    case 'saveTrip':
        $from=text($d,'from',150);$to=text($d,'to',150);need(mb_strtolower($from)!==mb_strtolower($to),'Départ et destination identiques.');
        $date=text($d,'date',10);$parsed=DateTimeImmutable::createFromFormat('!Y-m-d',$date);
        need($parsed && $parsed->format('Y-m-d')===$date && $date>=gmdate('Y-m-d'),'Date de départ invalide ou passée.');
        $weight=number($d,'capacity');$args=[$from,$to,$date,$weight,text($d,'pickup',255),text($d,'delivery',255),text($d,'notes',5000,false)];
        if (!empty($d['id'])) {
            $id=ident($d['id']);$t=one('SELECT * FROM trajet WHERE id=?',[$id]);need($t && $t['voyageur_id']==$uid,'Accès interdit.',403);
            need($t['statut']==='publie','Trajet non modifiable.',409);
            need(!one("SELECT id FROM demande_transport WHERE trajet_id=? AND statut IN ('en_attente','acceptee')",[$id]),'Des demandes actives empêchent cette modification.',409);
            query('UPDATE trajet SET depart=?,destination=?,date_depart=?,poids_total=?,lieu_remise=?,lieu_recuperation=?,informations=? WHERE id=?',[...$args,$id]);
        } else {query('INSERT INTO trajet(depart,destination,date_depart,poids_total,lieu_remise,lieu_recuperation,informations,voyageur_id) VALUES (?,?,?,?,?,?,?,?)',[...$args,$uid]);$id=(int)db()->lastInsertId();}
        return tripView(one('SELECT * FROM trajet WHERE id=?',[$id]));
    case 'cancelTrip': return cancelTrip(ident($d['id']??null),$u);
    case 'parcels':return array_map('parcelView',rows('SELECT * FROM colis WHERE expediteur_id=? ORDER BY id DESC',[$uid]));
    case 'parcel':$p=one('SELECT * FROM colis WHERE id=? AND expediteur_id=?',[ident($_GET['id']??null),$uid]);return $p?parcelView($p):null;
    case 'draft':$p=one("SELECT c.* FROM colis c JOIN brouillon_trajet b ON b.colis_id=c.id WHERE c.expediteur_id=? AND c.statut='brouillon' ORDER BY c.date_modification DESC,c.id DESC LIMIT 1",[$uid]);return $p?parcelView($p):null;
    case 'saveDraft':
        $trip=one("SELECT t.* FROM trajet t JOIN utilisateur u ON u.id=t.voyageur_id WHERE t.id=? AND t.statut='publie' AND t.date_depart>=UTC_DATE() AND u.statut='actif'",[ident($d['tripId']??null)]);
        need((bool)$trip,'Trajet indisponible.',409);$weight=number($d,'weight');need((float)$weight<=capacity((int)$trip['id']),'Poids supérieur à la capacité disponible.',409);
        $args=[text($d,'type',100),text($d,'description',5000),$weight,number($d,'value',true,9999999999.99),number($d,'length'),number($d,'width'),number($d,'height')];
        if (!empty($d['id'])) {
            $id=ident($d['id']);$p=one('SELECT * FROM colis WHERE id=?',[$id]);need($p && $p['expediteur_id']==$uid,'Accès interdit.',403);
            need(in_array($p['statut'],['brouillon','pret']) && !one("SELECT id FROM demande_transport WHERE colis_id=? AND statut IN ('en_attente','acceptee')",[$id]),'Colis déjà engagé.',409);
            query("UPDATE colis SET type=?,description=?,poids=?,valeur_declaree=?,longueur=?,largeur=?,hauteur=?,statut='brouillon' WHERE id=?",[...$args,$id]);
        } else { query('INSERT INTO colis(type,description,poids,valeur_declaree,longueur,largeur,hauteur,expediteur_id) VALUES (?,?,?,?,?,?,?,?)',[...$args,$uid]);$id=(int)db()->lastInsertId(); }
        query('INSERT INTO brouillon_trajet(colis_id,trajet_id) VALUES (?,?) ON DUPLICATE KEY UPDATE trajet_id=VALUES(trajet_id)',[$id,$trip['id']]);
        savePhoto($id,text($d,'photo',7500000,false));
        return parcelView(one('SELECT * FROM colis WHERE id=?',[$id]));
    case 'sendRequest':
        $pid=ident($d['parcelId']??null);$p=one('SELECT c.*,b.trajet_id FROM colis c JOIN brouillon_trajet b ON b.colis_id=c.id WHERE c.id=?',[$pid]);
        need($p && $p['expediteur_id']==$uid,'Colis introuvable.',404);
        $t=one('SELECT * FROM trajet WHERE id=?',[$p['trajet_id']]);need($t['voyageur_id']!=$uid,'Impossible de demander votre propre trajet.');
        $existing=one('SELECT d.*,c.expediteur_id FROM demande_transport d JOIN colis c ON c.id=d.colis_id WHERE d.colis_id=? AND d.trajet_id=?',[$pid,$t['id']]);
        if ($existing && in_array($existing['statut'],['en_attente','acceptee'])) return requestView($existing);
        need(!$existing,'Une demande existe déjà pour ce colis et ce trajet. Choisissez un autre trajet ou créez un nouveau colis.',409);
        need(in_array($p['statut'],['brouillon','pret']) && !one("SELECT id FROM demande_transport WHERE colis_id=? AND statut IN ('en_attente','acceptee')",[$pid]),'Colis déjà engagé.',409);
        need($t['statut']==='publie' && $t['date_depart']>=gmdate('Y-m-d') && $p['poids']<=capacity((int)$t['id']),'Trajet indisponible ou capacité insuffisante.',409);
        need((bool)one("SELECT id FROM utilisateur WHERE id=? AND statut='actif'",[$t['voyageur_id']]),'Voyageur indisponible.',409);
        query('INSERT INTO demande_transport(colis_id,trajet_id) VALUES (?,?)',[$pid,$t['id']]);$id=(int)db()->lastInsertId();
        query("UPDATE colis SET statut='pret' WHERE id=?",[$pid]);notify((int)$t['voyageur_id'],$id,'Nouvelle demande de transport.');notify($uid,$id,'Votre demande a été envoyée.');return requestView(requestRow($id,$u));
    case 'requests':
        $col=($_GET['incoming']??'')==='1'?'t.voyageur_id':'c.expediteur_id';
        return array_map('requestView',rows("SELECT d.*,c.expediteur_id FROM demande_transport d JOIN colis c ON c.id=d.colis_id JOIN trajet t ON t.id=d.trajet_id WHERE $col=? ORDER BY d.id DESC",[$uid]));
    case 'request':return requestView(requestRow(ident($_GET['id']??null),$u));
    case 'requestParcel':$r=requestRow(ident($_GET['id']??null),$u);return parcelView(one('SELECT * FROM colis WHERE id=?',[$r['colis_id']]));
    case 'updateRequest':
        $id=ident($d['id']??null);$r=requestRow($id,$u);$status=['Acceptée'=>'acceptee','Refusée'=>'refusee','Annulée'=>'annulee'][$d['status']??'']??'';need($status!=='','Statut invalide.');
        if ($status==='annulee') {need($uid==$r['expediteur_id'],'Accès interdit.',403);need(in_array($r['statut'],['en_attente','acceptee']) && $r['colis_statut']==='pret','Annulation impossible.',409);refundDemo($id);}
        else {need($uid==$r['voyageur_id'],'Accès interdit.',403);need($r['statut']==='en_attente','Demande déjà traitée.',409);}
        if ($status==='acceptee') {
            need($r['trajet_statut']==='publie' && $r['date_depart']>=gmdate('Y-m-d') && $r['colis_statut']==='pret','Transport indisponible.',409);
            need(!one("SELECT id FROM demande_transport WHERE colis_id=? AND statut='acceptee'",[$r['colis_id']]),'Colis déjà réservé.',409);
            $left=capacity((int)$r['trajet_id']);
            if ((float)$r['poids']>$left) {http_response_code(409);return ['message'=>capacityAlert($r,$left)];}
        }
        query('UPDATE demande_transport SET statut=?,date_reponse=UTC_TIMESTAMP(),date_annulation=? WHERE id=?',[$status,$status==='annulee'?gmdate('Y-m-d H:i:s'):null,$id]);
        notify((int)$r['expediteur_id'],$id,'Demande : '.$status);notify((int)$r['voyageur_id'],$id,'Demande : '.$status);audit($uid,'demande_'.$status,$id);return requestView(requestRow($id,$u));
    case 'notifications': return array_map(fn($n)=>['id'=>(string)$n['id'],'userId'=>(string)$uid,'text'=>$n['message'],'route'=>'/demande/'.$n['demande_id'],'date'=>substr($n['date_creation'],0,10),'read'=>$n['date_lecture']!==null],rows('SELECT * FROM notification WHERE utilisateur_id=? ORDER BY id DESC',[$uid]));
    case 'readNotifications':query('UPDATE notification SET date_lecture=COALESCE(date_lecture,UTC_TIMESTAMP()) WHERE utilisateur_id=?',[$uid]);return ['ok'=>true];
    case 'transport':
        $r=requestRow(ident($_GET['id']??null),$u);$id=(int)$r['id'];return transportView($r,$uid);
    case 'message':
        $r=requestRow(ident($d['id']??null),$u);$content=text($d,'content',2000);
        query('INSERT INTO message(demande_id,auteur_id,contenu) VALUES (?,?,?)',[$r['id'],$uid,$content]);
        notify($uid==$r['expediteur_id']?(int)$r['voyageur_id']:(int)$r['expediteur_id'],(int)$r['id'],'Nouveau message.');return ['ok'=>true];
    case 'pay':
        need((getenv('PAYMENT_MODE')?:'simulation')==='simulation','Fournisseur de paiement non configuré.',503);
        $r=requestRow(ident($d['id']??null),$u);need($uid==$r['expediteur_id'],'Accès interdit.',403);
        need($r['statut']==='acceptee' && $r['colis_statut']==='pret' && $r['trajet_statut']==='publie','Paiement impossible : la demande doit être acceptée et le trajet encore publié.',409);
        $p=one('SELECT * FROM paiement WHERE demande_id=?',[$r['id']]);
        need(!$p || $p['statut']!=='valide','Cette demande a déjà été payée.',409);
        need(!$p || $p['statut']!=='en_attente','Paiement déjà déclaré : en attente de la validation du voyageur.',409);
        $q=quotePrice($r);$ref=text($d,'reference',100,false);$ref=$ref!=='' ? $ref : null;
        if ($p) query("UPDATE paiement SET statut='en_attente',reference=?,transport=?,frais=?,date_creation=UTC_TIMESTAMP(),date_validation=NULL,motif_refus=NULL WHERE id=?",[$ref,$q['transport'],$q['fees'],$p['id']]);
        else query("INSERT INTO paiement(demande_id,transport,frais,statut,reference,date_creation) VALUES (?,?,?,'en_attente',?,UTC_TIMESTAMP())",[$r['id'],$q['transport'],$q['fees'],$ref]);
        notify((int)$r['voyageur_id'],(int)$r['id'],'Paiement déclaré par l’expéditeur ('.$q['total'].' MUR, simulation'.($ref!==null?', référence '.$ref:'').') : vérifiez la réception puis validez ou refusez.');
        notify($uid,(int)$r['id'],'Paiement déclaré. En attente de la validation du voyageur.');
        audit($uid,'paiement_declare',(int)$r['id']);
        return ['ok'=>true,'mode'=>'simulation','status'=>'en_attente','total'=>$q['total'],'currency'=>$q['currency']];
    case 'validatePayment':
        $r=requestRow(ident($d['id']??null),$u);need($uid==$r['voyageur_id'],'Seul le voyageur valide le paiement.',403);
        need($r['statut']==='acceptee' && $r['colis_statut']==='pret' && $r['trajet_statut']==='publie','Validation impossible : la demande n’est plus active.',409);
        $p=one('SELECT * FROM paiement WHERE demande_id=?',[$r['id']]);need((bool)$p && $p['statut']==='en_attente','Aucun paiement en attente de validation.',409);
        $left=capacity((int)$r['trajet_id']);
        if ((float)$r['poids']>$left) {
            // Pas d’exception : la transaction doit conserver le refus et les alertes.
            $message=capacityAlert($r,$left);
            query("UPDATE paiement SET statut='refuse',motif_refus=?,date_validation=UTC_TIMESTAMP() WHERE id=?",[$message,$p['id']]);
            audit($uid,'paiement_refuse_capacite',(int)$r['id']);
            http_response_code(409);return ['message'=>$message];
        }
        query("UPDATE paiement SET statut='valide',date_validation=UTC_TIMESTAMP(),motif_refus=NULL WHERE id=?",[$p['id']]);
        $left=capacity((int)$r['trajet_id']);
        notify((int)$r['expediteur_id'],(int)$r['id'],'Paiement validé par le voyageur : le transport de votre colis est confirmé.');
        notify($uid,(int)$r['id'],'Paiement validé : '.kg((float)$r['poids']).' kg retirés de la capacité du trajet, il reste '.kg($left).' kg.');
        audit($uid,'paiement_valide',(int)$r['id']);
        return ['ok'=>true,'status'=>'valide','remaining'=>$left];
    case 'rejectPayment':
        $r=requestRow(ident($d['id']??null),$u);need($uid==$r['voyageur_id'],'Seul le voyageur peut refuser le paiement.',403);
        $p=one('SELECT * FROM paiement WHERE demande_id=?',[$r['id']]);need((bool)$p && $p['statut']==='en_attente','Aucun paiement en attente de validation.',409);
        $reason=text($d,'reason',500);
        query("UPDATE paiement SET statut='refuse',motif_refus=?,date_validation=UTC_TIMESTAMP() WHERE id=?",[$reason,$p['id']]);
        notify((int)$r['expediteur_id'],(int)$r['id'],'Paiement refusé par le voyageur : '.$reason.'. Vous pouvez payer à nouveau ou signaler un problème.');
        audit($uid,'paiement_refuse',(int)$r['id']);
        return ['ok'=>true,'status'=>'refuse'];
    case 'pickup':
        $r=requestRow(ident($d['id']??null),$u);need($uid==$r['voyageur_id'],'Accès interdit.',403);
        need($r['statut']==='acceptee' && $r['colis_statut']==='pret' && $r['trajet_statut']==='publie' && (bool)one("SELECT id FROM paiement WHERE demande_id=? AND statut='valide'",[$r['id']]),'Prise en charge impossible avant acceptation et validation du paiement.',409);
        query('INSERT INTO suivi_transport(demande_id,date_prise_en_charge) VALUES (?,UTC_TIMESTAMP())',[$r['id']]);query("UPDATE colis SET statut='pris_en_charge' WHERE id=?",[$r['colis_id']]);
        notify((int)$r['expediteur_id'],(int)$r['id'],'Colis pris en charge.');return ['ok'=>true];
    case 'deliver':
        $r=requestRow(ident($d['id']??null),$u);need($uid==$r['voyageur_id'],'Seul le voyageur déclare la livraison.',403);
        need($r['statut']==='acceptee' && $r['colis_statut']==='pris_en_charge','Colis non pris en charge.',409);
        $s=one('SELECT date_livraison_declaree FROM suivi_transport WHERE demande_id=?',[$r['id']]);need((bool)$s && $s['date_livraison_declaree']===null,'Livraison déjà déclarée : en attente de la confirmation de l’expéditeur.',409);
        query('UPDATE suivi_transport SET date_livraison_declaree=UTC_TIMESTAMP() WHERE demande_id=?',[$r['id']]);
        notify((int)$r['expediteur_id'],(int)$r['id'],'Le voyageur indique avoir livré votre colis. Confirmez la réception, ou signalez un problème si vous ne l’avez pas reçu.');
        notify($uid,(int)$r['id'],'Livraison déclarée. En attente de la confirmation de l’expéditeur.');audit($uid,'livraison_declaree',(int)$r['id']);return ['ok'=>true,'status'=>'livraison_declaree'];
    case 'confirmReceipt':
        $r=requestRow(ident($d['id']??null),$u);need($uid==$r['expediteur_id'],'Seul l’expéditeur confirme la réception.',403);
        need($r['statut']==='acceptee' && $r['colis_statut']==='pris_en_charge','Colis non pris en charge.',409);
        need((bool)one('SELECT demande_id FROM suivi_transport WHERE demande_id=? AND date_livraison_declaree IS NOT NULL',[$r['id']]),'Le voyageur n’a pas encore déclaré la livraison.',409);
        query('UPDATE suivi_transport SET date_livraison=UTC_TIMESTAMP() WHERE demande_id=?',[$r['id']]);query("UPDATE colis SET statut='livre' WHERE id=?",[$r['colis_id']]);
        if (!one("SELECT d.id FROM demande_transport d JOIN colis c ON c.id=d.colis_id WHERE d.trajet_id=? AND (d.statut='en_attente' OR (d.statut='acceptee' AND c.statut<>'livre'))",[$r['trajet_id']])) query("UPDATE trajet SET statut='termine' WHERE id=?",[$r['trajet_id']]);
        notify((int)$r['voyageur_id'],(int)$r['id'],'Réception confirmée par l’expéditeur : livraison terminée. Vous pouvez laisser un avis.');
        notify($uid,(int)$r['id'],'Réception confirmée. Vous pouvez laisser un avis.');audit($uid,'reception_confirmee',(int)$r['id']);return ['ok'=>true,'status'=>'livre'];
    case 'review':
        $r=requestRow(ident($d['id']??null),$u);need($r['colis_statut']==='livre' && (bool)one('SELECT demande_id FROM suivi_transport WHERE demande_id=? AND date_livraison IS NOT NULL',[$r['id']]),'Avis possible seulement après livraison.',409);
        $note=ident($d['note']??null);need($note<=5,'La note doit être comprise entre 1 et 5.');
        query('INSERT INTO avis(demande_id,auteur_id,destinataire_id,note,commentaire) VALUES (?,?,?,?,?)',[$r['id'],$uid,$uid==$r['expediteur_id']?$r['voyageur_id']:$r['expediteur_id'],$note,text($d,'comment',2000,false)]);return ['ok'=>true];
    case 'report':
        $r=requestRow(ident($d['id']??null),$u);query('INSERT INTO signalement(auteur_id,demande_id,motif) VALUES (?,?,?)',[$uid,$r['id'],text($d,'reason',2000)]);return ['ok'=>true];
    case 'admin':
        admin($u);return ['users'=>rows('SELECT id,prenom,nom,email,statut FROM utilisateur'), 'trips'=>rows('SELECT id,depart,destination,statut FROM trajet'),
          'requests'=>rows('SELECT id,colis_id,trajet_id,statut FROM demande_transport'),'payments'=>rows('SELECT p.*,r.date_creation date_remboursement FROM paiement p LEFT JOIN remboursement r ON r.paiement_id=p.id'),'reports'=>rows("SELECT s.id,s.demande_id,s.motif,s.statut,s.date_creation,u.prenom,u.nom,u.email,t.depart,t.destination FROM signalement s JOIN utilisateur u ON u.id=s.auteur_id JOIN demande_transport d ON d.id=s.demande_id JOIN trajet t ON t.id=d.trajet_id ORDER BY (s.statut='ouvert') DESC,s.id DESC"),
          'stats'=>one("SELECT (SELECT COUNT(*) FROM utilisateur) utilisateurs,(SELECT COUNT(*) FROM trajet) trajets,(SELECT COUNT(*) FROM demande_transport) demandes,(SELECT COUNT(*) FROM signalement WHERE statut='ouvert') signalements_ouverts,(SELECT COUNT(*) FROM signalement) signalements_total,(SELECT COUNT(*) FROM paiement WHERE statut='en_attente') paiements_en_attente,(SELECT COALESCE(SUM(transport+frais),0) FROM paiement p WHERE p.statut='valide' AND NOT EXISTS (SELECT 1 FROM remboursement r WHERE r.paiement_id=p.id)) total_simule")];
    case 'adminAction':
        admin($u);$id=ident($d['id']??null);$action=text($d,'action',50);
        if ($action==='suspend' || $action==='activate') {need($id!==$uid,'Vous ne pouvez pas suspendre votre propre compte.');need((bool)one('SELECT id FROM utilisateur WHERE id=?',[$id]),'Compte introuvable.',404);query('UPDATE utilisateur SET statut=? WHERE id=?',[$action==='suspend'?'suspendu':'actif',$id]);query('DELETE FROM sessions_actives WHERE utilisateur_id=?',[$id]);}
        elseif ($action==='cancelRequest') {
            $r=one('SELECT d.*,c.statut colis_statut,c.expediteur_id,t.voyageur_id FROM demande_transport d JOIN colis c ON c.id=d.colis_id JOIN trajet t ON t.id=d.trajet_id WHERE d.id=?',[$id]);
            need($r && in_array($r['statut'],['en_attente','acceptee']) && $r['colis_statut']==='pret','Annulation impossible.',409);
            query("UPDATE demande_transport SET statut='annulee',date_annulation=UTC_TIMESTAMP(),motif_annulation='Administration' WHERE id=?",[$id]);refundDemo($id);
            notify((int)$r['expediteur_id'],$id,'Demande annulée par l’administration.');notify((int)$r['voyageur_id'],$id,'Demande annulée par l’administration.');
        }
        elseif ($action==='cancelTrip') return cancelTrip($id,$u,true);
        elseif ($action==='resolve') {$s=one('SELECT statut FROM signalement WHERE id=?',[$id]);need((bool)$s,'Signalement introuvable.',404);need($s['statut']==='ouvert','Ce signalement est déjà résolu.',409);query("UPDATE signalement SET statut='resolu' WHERE id=?",[$id]);}
        else need(false,'Action inconnue.');audit($uid,'admin_'.$action,$id);return ['ok'=>true];
    default: throw new DomainException('Opération inconnue.',404);
    }
}
function quotePrice(array $r): array {
    // Tarif de démonstration, sans valeur contractuelle. Centimes entiers pour les montants.
    $rate=(int)(getenv('DEMO_RATE_CENTS')?:20000);$fees=(int)(getenv('DEMO_FEE_CENTS')?:5000);
    need($rate>0 && $fees>=0,'Tarif de démonstration invalide.',503);
    $cents=(int)round((float)$r['poids']*$rate);
    return ['transport'=>number_format($cents/100,2,'.',''),'fees'=>number_format($fees/100,2,'.',''),'total'=>number_format(($cents+$fees)/100,2,'.',''),'currency'=>'MUR','mode'=>'simulation'];
}
function transportView(array $r, int $uid): array {
    $id=(int)$r['id'];$p=one('SELECT * FROM paiement WHERE demande_id=?',[$id]);
    return ['quote'=>quotePrice($r),'payment'=>$p,'refund'=>one('SELECT r.* FROM remboursement r JOIN paiement p ON p.id=r.paiement_id WHERE p.demande_id=?',[$id]),'tracking'=>one('SELECT * FROM suivi_transport WHERE demande_id=?',[$id]),
      'messages'=>rows('SELECT m.id,m.auteur_id,m.contenu,m.date_creation,u.prenom FROM message m JOIN utilisateur u ON u.id=m.auteur_id WHERE demande_id=? ORDER BY m.id',[$id]),
      'reviews'=>rows('SELECT auteur_id,note,commentaire FROM avis WHERE demande_id=?',[$id]),
      'sender'=>$uid==$r['expediteur_id'],'traveler'=>$uid==$r['voyageur_id'],'parcelStatus'=>$r['colis_statut'],'requestStatus'=>$r['statut'],'tripStatus'=>$r['trajet_statut']];
}
function savePhoto(int $id, string $photo): void {
    if ($photo==='') {query('DELETE FROM photo_colis WHERE colis_id=?',[$id]);return;}
    $existing=one('SELECT photo_url FROM photo_colis WHERE colis_id=?',[$id]); if ($existing && $existing['photo_url']===$photo) return;
    need(preg_match('~^data:image/(jpeg|png);base64,([A-Za-z0-9+/=]+)$~D',$photo,$m)===1,'Photo JPG ou PNG attendue.');
    $bytes=base64_decode($m[2],true);need($bytes!==false && strlen($bytes)<=5*1024*1024,'Photo trop volumineuse.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->buffer($bytes);$info=@getimagesizefromstring($bytes);
    need(in_array($mime,['image/jpeg','image/png'],true) && $info && $info[0]*$info[1]<=20000000,'Image invalide.');
    $dir=getenv('UPLOAD_DIR');need($dir && realpath($dir)!==false && !str_starts_with(realpath($dir).DIRECTORY_SEPARATOR,dirname(__DIR__,2).DIRECTORY_SEPARATOR),'Le dossier des photos doit être hors du dépôt public.',503);need($dir && is_dir($dir) && is_writable($dir),'Configurez UPLOAD_DIR hors du dossier public.',503);
    $name=bin2hex(random_bytes(20)).($mime==='image/png'?'.png':'.jpg');
    need(file_put_contents($dir.'/'.$name,$bytes,LOCK_EX)!==false,'Écriture de la photo impossible.',503);
    query('DELETE FROM photo_colis WHERE colis_id=?',[$id]);query('INSERT INTO photo_colis(colis_id,photo_url) VALUES (?,?)',[$id,'/backend/photo.php?file='.$name]);
}
