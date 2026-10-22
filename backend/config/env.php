<?php
// CHARGER UNIQUEMENT LA CONFIGURATION LOCALE, SANS EXÉCUTER SON CONTENU
$file=getenv('APP_ENV_FILE') ?: dirname(__DIR__,2).'/.env';
if (is_readable($file)) foreach (file($file,FILE_IGNORE_NEW_LINES) as $line) {
    $line=trim($line);
    if ($line==='' || str_starts_with($line,'#') || !str_contains($line,'=')) continue;
    [$key,$value]=explode('=',$line,2);$key=trim($key);$value=trim($value);
    if (!preg_match('/^[A-Z][A-Z0-9_]*$/D',$key) || getenv($key)!==false) continue;
    if (strlen($value)>=2 && (($value[0]==='"' && str_ends_with($value,'"')) || ($value[0]==="'" && str_ends_with($value,"'")))) $value=substr($value,1,-1);
    putenv($key.'='.$value);
}
