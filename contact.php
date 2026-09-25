<?php
// ONES — contact form handler (Hostinger). Not executed on GitHub Pages preview.
header('Content-Type: text/html; charset=utf-8');
$to = 'office@onesprod.com';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: /contact/'); exit; }
if (!empty($_POST['website'])) { header('Location: /contact/?sent=1'); exit; } // honeypot
$name = trim(strip_tags($_POST['name'] ?? '')); $email = trim($_POST['email'] ?? '');
$company = trim(strip_tags($_POST['company'] ?? '')); $msg = trim(strip_tags($_POST['message'] ?? ''));
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $msg === '') { header('Location: /contact/?error=1'); exit; }
$subject = 'Website brief from ' . $name . ($company ? ' (' . $company . ')' : '');
$body = "Name: $name\nEmail: $email\nCompany: $company\n\n$msg\n";
$headers = "From: ONES website <no-reply@onesprod.com>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=utf-8\r\n";
$ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
header('Location: /contact/?' . ($ok ? 'sent=1' : 'error=1')); exit;
