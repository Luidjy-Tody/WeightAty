<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ]);
    exit;
}

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();

if (empty($_SESSION['utilisateur_id'])) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'connecte' => false,
        'utilisateur' => null
    ]);
    exit;
}

$profil = [
    'id' => (int) $_SESSION['utilisateur_id'],
    'prenom' => $_SESSION['prenom'] ?? '',
    'nom' => $_SESSION['nom'] ?? '',
    'email' => $_SESSION['email'] ?? null,
    'localisation' => ''
];

try {
    $pdo = getConnexion();
    $requete = $pdo->prepare(
        'SELECT id, prenom, nom, email, localisation
         FROM utilisateur
         WHERE id = :id
         LIMIT 1'
    );
    $requete->execute([':id' => (int) $_SESSION['utilisateur_id']]);
    $ligne = $requete->fetch(PDO::FETCH_ASSOC);

    if ($ligne === false) {
        // LE COMPTE A ÉTÉ SUPPRIMÉ : LA SESSION N'EST PLUS VALIDE
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'connecte' => false,
            'utilisateur' => null
        ]);
        exit;
    }

    $profil = [
        'id' => (int) $ligne['id'],
        'prenom' => (string) $ligne['prenom'],
        'nom' => (string) $ligne['nom'],
        'email' => (string) $ligne['email'],
        'localisation' => (string) ($ligne['localisation'] ?? '')
    ];
} catch (Throwable $e) {
    // BASE INDISPONIBLE : ON CONSERVE LE PROFIL ENREGISTRÉ EN SESSION
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'connecte' => true,
    'utilisateur' => $profil
]);
