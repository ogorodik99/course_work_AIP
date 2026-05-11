<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Необходима авторизация']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — получить медкарту
if ($method === 'GET') {
    $patientId = $_SESSION['role'] === 'admin' && isset($_GET['patient_id'])
        ? $_GET['patient_id']
        : $_SESSION['user_id'];

    // Основная информация
    $stmt = $pdo->prepare("
        SELECT mc.*, u.full_name, u.birth_date, u.phone, u.email
        FROM medical_cards mc
        JOIN users u ON mc.patient_id = u.id
        WHERE mc.patient_id = ?
    ");
    $stmt->execute([$patientId]);
    $card = $stmt->fetch();

    if (!$card) {
        echo json_encode(['success' => false, 'error' => 'Медкарта не найдена']);
        exit;
    }

    // История посещений
    $stmt = $pdo->prepare("
        SELECT mr.*, d.full_name AS doctor_name, sp.name AS specialization_name
        FROM medical_records mr
        JOIN doctors d ON mr.doctor_id = d.id
        JOIN specializations sp ON d.specialization_id = sp.id
        WHERE mr.medical_card_id = ?
        ORDER BY mr.record_date DESC
    ");
    $stmt->execute([$card['id']]);
    $records = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'card' => $card,
        'records' => $records
    ]);
    exit;
}

// PUT — обновить медкарту
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $patientId = $_SESSION['user_id'];

    $pick = function ($keys, $fallback = null) use ($data) {
        foreach ($keys as $key) {
            if (array_key_exists($key, $data) && $data[$key] !== null) {
                return $data[$key];
            }
        }
        return $fallback;
    };

    $stmt = $pdo->prepare("
        SELECT u.full_name, u.phone, u.birth_date,
               mc.blood_type, mc.allergies, mc.chronic_diseases, mc.insurance_number
        FROM users u
        LEFT JOIN medical_cards mc ON mc.patient_id = u.id
        WHERE u.id = ?
    ");
    $stmt->execute([$patientId]);
    $current = $stmt->fetch() ?: [];

    $stmt = $pdo->prepare("INSERT IGNORE INTO medical_cards (patient_id) VALUES (?)");
    $stmt->execute([$patientId]);

    // Обновляем данные пользователя
    $stmt = $pdo->prepare("UPDATE users SET full_name = ?, phone = ?, birth_date = ? WHERE id = ?");
    $stmt->execute([
        $pick(['full_name', 'fullName', 'name'], $current['full_name'] ?? null),
        $pick(['phone'], $current['phone'] ?? null),
        $pick(['birth_date', 'birthDate'], $current['birth_date'] ?? null),
        $patientId
    ]);

    // Обновляем медкарту
    $stmt = $pdo->prepare("
        UPDATE medical_cards
        SET blood_type = ?, allergies = ?, chronic_diseases = ?, insurance_number = ?
        WHERE patient_id = ?
    ");
    $stmt->execute([
        $pick(['blood_type', 'bloodType'], $current['blood_type'] ?? null),
        $pick(['allergies'], $current['allergies'] ?? null),
        $pick(['chronic_diseases', 'chronicDiseases'], $current['chronic_diseases'] ?? null),
        $pick(['insurance_number', 'insuranceNumber'], $current['insurance_number'] ?? null),
        $patientId
    ]);

    echo json_encode(['success' => true, 'message' => 'Данные обновлены']);
    exit;
}
?>
