<?php
// DOSSIER DU PROJET
$root = realpath(__DIR__ . '/..');

if ($root === false) {
    http_response_code(500);
    exit('Dossier du projet introuvable.');
}

// ADRESSE DEMANDÉE
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (!is_string($path)) {
    http_response_code(400);
    exit('Adresse invalide.');
}

$path = rawurldecode($path);

if ($path === '/') {
    header('Location: /frontend/index.html');
    return true;
}

// RECHERCHER LE FICHIER
$file = realpath($root . $path);

if ($file === false || !is_file($file)) {
    http_response_code(404);
    exit('Page introuvable.');
}

// UNIFORMISER LES CHEMINS WINDOWS ET LINUX
$root = str_replace('\\', '/', $root);
$file = str_replace('\\', '/', $file);

// AUTORISER LES FICHIERS DU FRONTEND
$extensions = [
    'html', 'css', 'js', 'svg',
    'png', 'jpg', 'jpeg', 'webp'
];

$public = str_starts_with($file, $root . '/frontend/')
    && in_array(
        strtolower(pathinfo($file, PATHINFO_EXTENSION)),
        $extensions,
        true
    );

if ($public) {
    header('X-Content-Type-Options: nosniff');
    return false;
}

// AUTORISER LES API PHP
$api = (
    str_starts_with($file, $root . '/backend/api/')
    && str_ends_with($file, '.php')
) || $file === $root . '/backend/photo.php';

if ($api) {
    require $file;
    return true;
}

// REFUSER LES AUTRES FICHIERS
http_response_code(404);
echo 'Page introuvable.';
return true;