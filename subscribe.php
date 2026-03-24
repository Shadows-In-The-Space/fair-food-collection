<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = '/home/sonny/goldencrumb/emails.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);
    $email = $payload['email'] ?? '';
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige E-Mail-Adresse']);
        exit;
    }
    
    $emails = [];
    if (file_exists($dataFile)) {
        $emails = json_decode(file_get_contents($dataFile), true) ?: [];
    }
    
    $exists = false;
    foreach ($emails as $e) {
        if (strtolower($e['email']) === strtolower($email)) {
            $exists = true;
            break;
        }
    }
    
    if ($exists) {
        http_response_code(409);
        echo json_encode(['error' => 'Diese E-Mail ist bereits registriert']);
        exit;
    }
    
    $emails[] = ['email' => strtolower($email), 'timestamp' => date('c')];
    file_put_contents($dataFile, json_encode($emails, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    echo json_encode(['success' => true, 'message' => 'Willkommen! Du hörst von uns.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $emails = [];
    if (file_exists($dataFile)) {
        $emails = json_decode(file_get_contents($dataFile), true) ?: [];
    }
    echo json_encode(['count' => count($emails), 'emails' => $emails]);
    exit;
}
?>
