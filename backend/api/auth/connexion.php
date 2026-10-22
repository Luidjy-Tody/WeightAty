<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ]);
    exit;
}

try {
    $pdo = getConnexion();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Service momentanément indisponible.'
    ]);
    exit;
}

$donnees = json_decode(file_get_contents('php://input'), true);

if (!is_array($donnees)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Corps de requête invalide.'
    ]);
    exit;
}

$email = trim((string) ($donnees['email'] ?? ''));
$motDePasse = (string) ($donnees['password'] ?? '');

$erreurs = [];

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $erreurs['email'] = 'Adresse e-mail invalide.';
}

if ($motDePasse === '') {
    $erreurs['password'] = 'Le mot de passe est obligatoire.';
}

if ($erreurs !== []) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Veuillez corriger les champs indiqués.',
        'errors' => $erreurs
    ]);
    exit;
}

$requete = $pdo->prepare(
    'SELECT id, prenom, nom, email, mot_de_passe_hash, statut
     FROM utilisateur
     WHERE email = :email
     LIMIT 1'
);
$requete->execute([':email' => $email]);
$utilisateur = $requete->fetch(PDO::FETCH_ASSOC);

if ($utilisateur === false || !password_verify($motDePasse, $utilisateur['mot_de_passe_hash'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Adresse e-mail ou mot de passe incorrect.'
    ]);
    exit;
}

if ($utilisateur['statut'] !== 'actif') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Votre compte est suspendu.'
    ]);
    exit;
}

if (password_needs_rehash($utilisateur['mot_de_passe_hash'], PASSWORD_DEFAULT)) {
    $miseAJour = $pdo->prepare('UPDATE utilisateur SET mot_de_passe_hash = :hash WHERE id = :id');
    $miseAJour->execute([
        ':hash' => password_hash($motDePasse, PASSWORD_DEFAULT),
        ':id' => $utilisateur['id']
    ]);
}

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();
session_regenerate_id(true);

$_SESSION['utilisateur_id'] = (int) $utilisateur['id'];
$_SESSION['email'] = $utilisateur['email'];
$_SESSION['prenom'] = $utilisateur['prenom'];
$_SESSION['nom'] = $utilisateur['nom'];
$_SESSION['date_connexion'] = time();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Connexion réussie.',
    'utilisateur' => [
        'id' => (int) $utilisateur['id'],
        'prenom' => $utilisateur['prenom'],
        'nom' => $utilisateur['nom'],
        'email' => $utilisateur['email']
    ]
]);
