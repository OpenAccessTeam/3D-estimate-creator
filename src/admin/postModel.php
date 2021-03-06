<?php
// This script lacks security features, do not open to the public!

if($_SERVER['REQUEST_METHOD'] !== "POST") {
    http_response_code(400);
    echo "bad method ".$_SERVER['REQUEST_METHOD']." instead of POST";
    exit;
}

if(!isset($_POST["fileName"])) {
    http_response_code(400);
    echo "the field 'fileName' is required";
    exit;
}

if (!file_exists(__DIR__.'/../models/'.explode("/", $_POST["fileName"])[0])) {
    mkdir(__DIR__.'/../models/'.explode("/", $_POST["fileName"])[0], 0755, true);
}
// archive one previous version
if(file_exists(__DIR__."/../models/".$_POST["fileName"].".old"))
    unlink(__DIR__."/../models/".$_POST["fileName"].".old");
if(file_exists(__DIR__."/../models/".$_POST["fileName"]))
    rename(__DIR__."/../models/".$_POST["fileName"], __DIR__."/../models/".$_POST["fileName"].".old");
    
if (move_uploaded_file($_FILES['model']['tmp_name'], __DIR__."/../models/".$_POST["fileName"])) {
    echo "uploaded file ".$_POST["fileName"];
} else {
    http_response_code(500);
    exit;
}