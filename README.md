# Feedback form on JavaScript (AJAX) and PHP
A small project containing an example of a page with a feedback/contact form built on pure JavaScript and PHP.

Check the on here Demo: https://itchief.ru/examples/lab.php?topic=php&file=feedback-form

Screenshots:

<img src="https://itchief.ru/assets/images/350/1.png" alt="Форма обратной связи" width="300">
![Валидация формы обратной связи](https://itchief.ru/assets/images/350/2.png)
![Успешно отправленная форма обратной связи](https://itchief.ru/assets/images/350/3.png)



## Step-by-step instructions for installing
1. Add a form to the HTML (it allows us to collect data).
An example of the form is located in "index.html".
```html
<form id="form" action="/feedback/processing.php" enctype="multipart/form-data" novalidate>
  ...
</form>
```
The handler is set using the action attribute.
An example of the form is located in "index.html".
