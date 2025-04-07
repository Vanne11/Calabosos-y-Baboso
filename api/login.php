<?php
header('Content-Type: application/json');
$user = $_GET['user'] ?? '';
$password = $_GET['password'] ?? '';

$usuarios = json_decode(file_get_contents('usuarios.json'), true)['usuarios'];
$success = false;

foreach ($usuarios as $u) {
  if ($u['usuario'] === $user && $u['password'] === $password) {
    $success = true;
    break;
  }
}

echo json_encode(['success' => $success]);
?>
