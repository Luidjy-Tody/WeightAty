<?php
declare(strict_types=1);
require_once __DIR__.'/env.php';
function db(): PDO {
    static $pdo;
    if (!$pdo) {
        $pdo = new PDO(getenv('DB_DSN') ?: 'mysql:host=127.0.0.1;dbname=weightaty_db;charset=utf8mb4',
            getenv('DB_USER') ?: 'weightaty', getenv('DB_PASSWORD') ?: '', [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}
