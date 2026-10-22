<?php
require_once __DIR__.'/lib/bootstrap.php';
try {
 $u=me();$file=$_GET['file']??'';need(is_string($file) && preg_match('/^[a-f0-9]{40}\.(png|jpg)$/D',$file)===1,'Image introuvable.',404);
 $p=one('SELECT c.id,c.expediteur_id FROM photo_colis p JOIN colis c ON c.id=p.colis_id WHERE p.photo_url=?',['/backend/photo.php?file='.$file]);
 need($p && ($p['expediteur_id']==$u['id'] || (bool)one('SELECT d.id FROM demande_transport d JOIN trajet t ON t.id=d.trajet_id WHERE d.colis_id=? AND t.voyageur_id=?',[$p['id'],$u['id']])),'Accès interdit.',403);
 $path=(getenv('UPLOAD_DIR')?:'').'/'.$file;need(is_file($path),'Image introuvable.',404);
 header('Content-Type: '.(str_ends_with($file,'.png')?'image/png':'image/jpeg'));readfile($path);
} catch (DomainException $e) {fail($e->getCode()?:422,$e->getMessage());} catch(Throwable $e) {fail(500,'Image indisponible.');}
