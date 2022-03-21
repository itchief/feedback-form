# Feedback form on JavaScript (AJAX) and PHP
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

### 2. Include files in HTML:
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
