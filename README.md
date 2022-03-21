# Feedback form on JavaScript, AJAX and PHP
A small project containing an example of a page with a feedback/contact form built on pure JavaScript and PHP.

Check the on here Demo: https://itchief.ru/examples/lab.php?topic=php&file=feedback-form

Screenshots:

![](https://itchief.ru/assets/images/350/1.png)

![](https://itchief.ru/assets/images/350/2.png)

![](https://itchief.ru/assets/images/350/3.png)

## Step-by-step instructions

### 1. Add form in HTML
```html
<form id="form" action="/feedback/processing.php" enctype="multipart/form-data" novalidate>
  ...
</form>
```
An example of the form is given in "index.html".

### 2. Include files in HTML
```html
<link rel="stylesheet" href="css/style.css">
<script src="/feedback/js/form-processing.js"></script>
```
The logic of the success message output is written in the success event handler. In "index.html" this is done through the following code:
```js
document.querySelector('form').addEventListener('success', (e) => {
  const el = e.target.closest('.form-container').querySelector('.form-success');
  el.classList.remove('form-success_hide');
});
```
The success event occurs when we receive a response from the server and result="success".
The fragment that will be displayed is located in "index.html " after the form. It has the following structure:
```html
<div class="form-success form-success_hide">
  <div class="form-success__message">Форма успешно отправлена. Нажмите <button type="button" class="form-success__btn">здесь</button>, если нужно отправить ещё одну форму.</div>
</div>
```
When you click on the button `.form-success__btn:`
```js
document.querySelector('.form-success__btn').addEventListener('click', (e) => {
  form.reset();
  e.target.closest('.form-container').querySelector('.form-success').classList.add('form-success_hide');
});
```
The `reset()` method resets the form.

### 3. Initialize form as `ItcSubmitForm`
```js
// 'form' - selector
const form = new ItcSubmitForm('form');
```
Additional parameters are passed in the 2nd argument:
```js
const form = new ItcSubmitForm('form', {
  isCheckValidationOnClient: true, // проверять форму перед отправкой на сервер
  attachMaxItems: 5, // максимальное количество файлов, которые можно добавить к форме
  attachMaxFileSize: 512, // 512 Кбайт - максимальный размер файла
  attachExt: ['jpg', 'jpeg', 'bmp', 'gif', 'png'] // допустимые расширения файлов
});
```
Here are the values of the keys that they have by default.

### 4. Set values to constants in php script

4.1. Checking the captcha:
```php
define('HAS_CHECK_CAPTCHA', true);
```
4.2. Attached files:
```php
// не пропускать форму, если к ней не прикреплён хотя бы один файл
define('HAS_ATTACH_REQUIRED', true);
// разрешённые mime типы файлов
define('ALLOWED_MIME_TYPES', ['image/jpeg', 'image/gif', 'image/png']);
// максимальный размер файла
define('MAX_FILE_SIZE', 512 * 1024);
```

4.3. Mail settings:
```php
// отправлять письмо на указанный адрес email
define('HAS_SEND_EMAIL', true);
// добавить файлы в тело письма в виде ссылок (В противном случае прикрепить)
define('HAS_ATTACH_IN_BODY', false);
// базовый URL-адрес (используется, если составления полного URL для ссылок, добавляемых в тело письма)
define('BASE_URL', 'https://domain.com');
// настройка почты (отправка осуществляется через SMTP)
define('EMAIL_SETTINGS', [
  'addresses' => ['manager@domain.com'], // кому необходимо отправить письмо
  'from' => ['no-reply@domain.com', 'Имя сайта'], // от какого email и имени необходимо отправить письмо
  'subject' => 'Сообщение с формы обратной связи', // тема письма
  'host' => 'ssl://smtp.yandex.ru', // SMTP-хост
  'username' => 'name@yandex.ru', // // SMTP-пользователь
  'password' => '*********', // SMTP-пароль
  'port' => '465' // SMTP-порт
]);
```

4.4. Notifications to user:
```php
// необходимо ли отправлять уведомление пользователю на почту
define('HAS_SEND_NOTIFICATION', false);
// тема письма
define('SUBJECT_FOR_CLIENT', 'Ваше сообщение доставлено');
```

4.5. Logs:
```php
// писать предупреждения и ошибки в лог
define('HAS_WRITE_LOG', true);
```

4.6. Saving form in txt:
```php
// записывать успешные формы в файл forms.log
define('HAS_WRITE_TXT', true);
```

### 5. Copy "feedback" folder to the root directory of site

By default, the "feedback" folder contains the file "index.html". It can be used to test the form.
On a website with a domain name "domain.com " this form will be available at the following URL: `http://domain.com/feedback/` (or `https://domain.com/feedback/`).
