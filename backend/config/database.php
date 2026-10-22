<?php

declare(strict_types=1);

/**
 * Charge les identifiants de connexion depuis backend/config/.env si présent.
 * Le fichier .env est ignoré par Git et prime sur les variables d'environnement
 * du système, afin d'éviter les conflits avec d'autres projets locaux.
 */
function chargerEnvLocal(): array
{
    static $valeurs = null;

    if ($valeurs !== null) {
        return $valeurs;
    }

    $valeurs = [];
    $fichier = __DIR__ . '/.env';

    if (is_file($fichier)) {
        foreach (file($fichier, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ligne) {
            $ligne = trim($ligne);
            if ($ligne === '' || str_starts_with($ligne, '#')) {
                continue;
            }
            $parties = explode('=', $ligne, 2);
            if (count($parties) === 2) {
                $valeurs[trim($parties[0])] = trim($parties[1]);
            }
        }
    }

    return $valeurs;
}

function getConnexion(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $env = chargerEnvLocal();

    $hote = $env['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
    $port = $env['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
    $nom = $env['DB_NAME'] ?? getenv('DB_NAME') ?: 'weightaty_db';
    $utilisateurBd = $env['DB_USER'] ?? getenv('DB_USER') ?: 'root';
    $motDePasseBd = $env['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $hote, $port, $nom);

    $pdo = new PDO($dsn, $utilisateurBd, $motDePasseBd, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    return $pdo;
}
