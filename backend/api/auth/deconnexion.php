<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ]);
    exit;
}

session_start();

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $parametres = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $parametres['path'],
        $parametres['domain'],
        $parametres['secure'],
        $parametres['httponly']
    );
}

session_destroy();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie.'
]);
