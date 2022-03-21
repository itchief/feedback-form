# Feedback form on JavaScript (AJAX) and PHP
A small project containing an example of a page with a feedback/contact form built on pure JavaScript and PHP.

Check the on here Demo: https://itchief.ru/examples/lab.php?topic=php&file=feedback-form

Screenshots:
!["Форма обратной связи"](https://itchief.ru/assets/images/350/1.png | width=400)
!["Валидация формы обратной связи"](https://itchief.ru/assets/images/350/2.png | width=400)
!["Успешно отправленная форма обратной связи"](https://itchief.ru/assets/images/350/3.png | width=400)

## Step-by-step instructions
1. Add a form to the HTML (it allows us to collect data).
An example of the form is located in "index.html".
```html
<form id="form" action="/feedback/processing.php" enctype="multipart/form-data" novalidate>
  ...
</form>
```
The handler is set using the action attribute.
An example of the form is located in "index.html".

2. Connect the files "style.css" and "form-processing.js":
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
