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

$from = trim((string) ($_GET['from'] ?? ''));
$to = trim((string) ($_GET['to'] ?? ''));
$date = trim((string) ($_GET['date'] ?? ''));
$minWeight = $_GET['minWeight'] ?? null;
$sort = ($_GET['sort'] ?? 'date') === 'weight' ? 'weight' : 'date';

$erreurs = [];

if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    $erreurs['date'] = 'Format de date attendu : AAAA-MM-JJ.';
}

if ($minWeight !== null && $minWeight !== '' && (!is_numeric($minWeight) || (float) $minWeight < 0)) {
    $erreurs['minWeight'] = 'Indiquez un poids positif ou nul.';
}

if ($erreurs !== []) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Critères de recherche invalides.',
        'errors' => $erreurs
    ]);
    exit;
}

$sql = 'SELECT t.id, t.voyageur_id, t.depart, t.destination, t.date_depart,
               t.poids_total, t.lieu_remise, t.lieu_recuperation, t.informations,
               t.statut, t.date_creation,
               u.prenom, u.nom, u.photo_url
        FROM trajet t
        INNER JOIN utilisateur u ON u.id = t.voyageur_id
        WHERE t.statut = :statut
          AND t.date_depart >= NOW()
          AND u.statut = :statut_utilisateur';

$parametres = [
    ':statut' => 'publie',
    ':statut_utilisateur' => 'actif'
];

if ($from !== '') {
    $sql .= ' AND t.depart LIKE :depart';
    $parametres[':depart'] = '%' . $from . '%';
}

if ($to !== '') {
    $sql .= ' AND t.destination LIKE :destination';
    $parametres[':destination'] = '%' . $to . '%';
}

if ($date !== '') {
    $sql .= ' AND DATE(t.date_depart) = :date';
    $parametres[':date'] = $date;
}

if ($minWeight !== null && $minWeight !== '') {
    $sql .= ' AND t.poids_total >= :poids_minimum';
    $parametres[':poids_minimum'] = (float) $minWeight;
}

$sql .= $sort === 'weight'
    ? ' ORDER BY t.poids_total DESC, t.date_depart ASC'
    : ' ORDER BY t.date_depart ASC';

$requete = $pdo->prepare($sql);
$requete->execute($parametres);

$trajets = [];

foreach ($requete->fetchAll(PDO::FETCH_ASSOC) as $ligne) {
    $trajets[] = [
        'id' => (int) $ligne['id'],
        'ownerId' => (int) $ligne['voyageur_id'],
        'ownerName' => trim($ligne['prenom'] . ' ' . $ligne['nom']),
        'ownerPhoto' => $ligne['photo_url'],
        'from' => $ligne['depart'],
        'to' => $ligne['destination'],
        'date' => date('Y-m-d', strtotime($ligne['date_depart'])),
        'capacity' => (float) $ligne['poids_total'],
        'pickup' => $ligne['lieu_remise'],
        'delivery' => $ligne['lieu_recuperation'],
        'notes' => $ligne['informations'],
        'status' => $ligne['statut']
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'total' => count($trajets),
    'sort' => $sort,
    'trajets' => $trajets
]);
