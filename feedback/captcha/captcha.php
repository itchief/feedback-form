<?php

/*
 * Форма обратной связи (https://itchief.ru/lessons/php/feedback-form-for-website)
 * Copyright 2016-2018 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/feedback-form/blob/master/LICENSE)
 */

//открываем сессию
session_start();

$id = 'captcha';
if (isset($_GET['id'])) {
    $id = filter_var($_GET['id'], FILTER_SANITIZE_STRING);
}

// присваиваем PHP переменной captchastring строку символов
$captchastring = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz';
// получаем первые 6 символов после их перемешивания с помощью функции str_shuffle
$captchastring = substr(str_shuffle($captchastring), 0, 6);
// инициализируем переменной сессии с помощью сгенерированной подстроки captchastring,
// содержащей 6 символов
$_SESSION[$id] = $captchastring;

// генерируем CAPTCHA

// создаем новое изображение из файла background.png
$image = imagecreatefrompng(dirname(__FILE__) . '/background.png');
// устанавливаем цвет (R-200, G-240, B-240) изображению, хранящемуся в $image
$colour = imagecolorallocate($image, 200, 240, 240);
// присваиваем переменной font название шрифта
$font = dirname(__FILE__) . '/oswald.ttf';
// устанавливаем случайное число между -10 и 10 градусов для поворота текста
$rotate = rand(-10, 10);
// рисуем текст на изображении шрифтом TrueType (1 параметр - изображение ($image),
// 2 - размер шрифта (18), 3 - угол поворота текста ($rotate),
// 4, 5 - начальные координаты x и y для текста (18,30), 6 - индекс цвета ($colour),
// 7 - путь к файлу шрифта ($font), 8 - текст ($captchastring)
imagettftext($image, 18, $rotate, 28, 32, $colour, $font, $captchastring);
// будем передавать изображение в формате png
header('Content-type: image/png');
//выводим изображение
imagepng($image);
