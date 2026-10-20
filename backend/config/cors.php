<?php

declare(strict_types=1);

$origineAutorisee = getenv('CORS_ORIGIN') ?: '*';

header('Access-Control-Allow-Origin: ' . $origineAutorisee);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
