/*!
 * Форма обратной связи (https://github.com/itchief/feedback-form)
 * Страница с описанием: https://itchief.ru/lessons/php/feedback-form-for-website
 * Copyright 2016-2020 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/feedback-form/blob/master/LICENSE)
 */

'use strict';

var ProcessForm = function (settings) {
  this._settings = {
    selector: '#feedback-form', // дефолтный селектор
    attachmentsMaxFileSize: 512, // дефолтный максимальный размер файла в Кб
    attachmentsFileExt: ['jpg', 'jpeg', 'bmp', 'gif', 'png'], // дефолтные допустимые расширения для файлов
    isUseDefaultSuccessMessage: true, // отображать дефолтное сообщение об успешной отправки формы
  };
  this._isCaptchaSection = false; // имеется ли в форме блок с капчей
  this._isAgreementSection = false; // имеется ли в форме блок с пользовательским соглашением
  this._isAttachmentsSection = false; // имеется ли в форме блок для добавления к ней файлов
  this._attachmentsIdCounter = 0; // счетчик, хранящий количество добавленных к форме файлов
  this._attachmentsMaxItems = 5; // переменная, определяющее максимальное количество файлов, которые можно прикрепить к форме
  this._attachmentsItems = []; // переменная, хранящая массив файлов, которые нужно прекрепить к форме

  for (var propName in settings) {
    if (settings.hasOwnProperty(propName)) {
      this._settings[propName] = settings[propName];
    }
  }
  this._$form = document.querySelector(this._settings.selector);
  // инициализация формы
  this._init();
};

// функция для проверки расширения файла
ProcessForm.validateFileExtension = function (filename, validFileExtensions) {
  // получаем расширение файла
  var fileExtension = filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  // если есть расширение, то проверяем соответствует ли оно допустимому
  if (fileExtension) {
    for (var i = 0; i <= validFileExtensions.length; i++) {
      if (validFileExtensions[i] === fileExtension.toLowerCase()) {
        return true;
      }
    }
  }
  return false;
};

// переключение состояния disabled у кнопки submit
ProcessForm.prototype._changeStateSubmit = function (state) {
  this._$form.querySelector('[type="submit"]').disabled = state;
};

// обновление капчи
ProcessForm.prototype._refreshCaptcha = function () {
  var captchaImg = this._$form.querySelector('.form-captcha__image');
  var captchaSrc = captchaImg.getAttribute('data-src');
  var captchaPrefix = captchaSrc.indexOf('?id') !== -1 ? '&rnd=' : '?rnd=';
  var captchaNewSrc = captchaSrc + captchaPrefix + new Date().getTime();
  captchaImg.setAttribute('src', captchaNewSrc);
};

// изменение состояния элемента формы (success, error, clear)
ProcessForm.prototype._setStateValidaion = function (input, state, message) {
  if (state === 'error') {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    input.parentElement.querySelector('.invalid-feedback').textContent = message;
  } else if (state === 'success') {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
  } else {
    input.classList.remove('is-valid');
    input.classList.remove('is-invalid');
  }
};

// валидация формы
ProcessForm.prototype._validateForm = function () {
  var valid = true;
  var $elements = this._$form.querySelectorAll('input, textarea');
  for (var i = 0; i < $elements.length; i++) {
    if ($elements[i].type === 'file' || $elements[i].name === 'agree') {
      continue;
    }
    if ($elements[i].checkValidity()) {
      this._setStateValidaion($elements[i], 'success');
    } else {
      this._setStateValidaion($elements[i], 'error', $elements[i].validationMessage);
      valid = false;
    }
  }

  // для теста >
  if (this._attachmentsItems.length === 0) {
    var files = this._attachmentsItems;
    for (var i = 0, length = files.length; i < length; i++) {
      // проверим размер и расширение файла
      if (files[i].file.size > this._settings.attachmentsMaxFileSize * 1024) {
        var attach = this._$form.querySelector('.form-attachments__item[data-id="' + i + '"]');
        attach.setAttribute(
          'title',
          'Размер файла больше ' + this._settings.attachmentsMaxFileSize + 'Кб'
        );
        attach.classList.add('is-invalid');
        valid = false;
      } else if (
        !ProcessForm.validateFileExtension(files[i].file.name, this._settings.attachmentsFileExt)
      ) {
        var attach = this._$form.querySelector('.form-attachments__item[data-id="' + i + '"]');
        attach.setAttribute('title', 'Тип не соответствует разрешённым');
        attach.classList.add('is-invalid');
        valid = false;
      } else {
        var attach = this._$form.querySelector('.form-attachments__item[data-id="' + i + '"]');
        if (attach) {
          attach.setAttribute('title', '');
          attach.classList.add('is-valid');
        }
      }
    }
  }
  return valid;
};

ProcessForm.prototype._showForm = function () {
  this._$form.querySelector('.form-error').classList.add('d-none');
  var $resultSuccess = this._$form.parentElement.querySelector('.form-result-success');
  $resultSuccess.classList.add('d-none');
  $resultSuccess.classList.remove('d-flex');
  this._$form.reset();
  var $elements = this._$form.querySelectorAll('input, textarea');
  for (var i = 0, length = $elements.length; i < length; i++) {
    this._setStateValidaion($elements[i], 'clear');
  }
  if (this._isCaptchaSection) {
    this._refreshCaptcha();
  }
  if (this._isAgreementSection) {
    this._changeStateSubmit(true);
  } else {
    this._changeStateSubmit(false);
  }

  // удаление attachment items
  var $attachs = this._$form.querySelectorAll('.form-attachments__item');
  if ($attachs.length > 0) {
    for (var i = 0, length = $attachs.length; i < length; i++) {
      $attachs[i].parentElement.removeChild($attachs[i]);
    }
  }

  if (this._$form.querySelector('.progress-bar').length) {
    var $progressBar = this._$form.querySelector('.progress-bar');
    $progressBar.setAttribute('aria-valuenow', '0');
    $progressBar.style.width = 0;
  }
};

// переключение disabled для name="attachment[]"
ProcessForm.prototype._disabledAttach = function (state) {
  var $attach = this._$form.querySelector('[name="attachment[]"]');
  if ($attach) {
    $attach.disabled = state;
  }
};

// собираем данные для отправки на сервер
ProcessForm.prototype._collectData = function () {
  var data;
  var $attachs = this._attachmentsItems;
  // отключаем добавление данных из name="attachment[]" в FormData
  this._disabledAttach(true);
  data = new FormData(this._$form);
  // включаем доступность name="attachment[]"
  this._disabledAttach(false);
  // добавляем данные из name="attachment[]" в FormData
  for (var i = 0, length = $attachs.length; i < length; i++) {
    data.append('attachment[]', $attachs[i].file);
  }
  return data;
};

// отправка формы
ProcessForm.prototype._sendForm = function () {
  this._$form.dispatchEvent(new Event('beforeSubmit'));
  if (!this._validateForm()) {
    if (this._$form.querySelectorAll('.is-invalid').length > 0) {
      if (this._$form.querySelectorAll('.is-invalid')[0].classList.contains('file')) {
        this._$form.querySelector('input[type="file"]').focus();
      } else {
        this._$form.querySelectorAll('.is-invalid')[0].focus();
      }
    }
    return;
  }

  if (!this._$form.querySelector('.form-error').classList.contains('d-none')) {
    this._$form.querySelector('.form-error').classList.add('d-none');
  }

  this._changeStateSubmit(true);

  var _this = this;

  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState === 0 || request.readyState === 4) {
      if (request.status == 200) {
        _success(JSON.parse(request.responseText), _this);
      } else {
        _error(_this);
      }
      //done();
    }
  };
  if (this._$form.querySelector('.progress').classList.contains('d-none')) {
    this._$form.querySelector('.progress').classList.remove('d-none');
  }
  request.upload.onprogress = function (e) {
    // если известно количество байт для пересылки
    if (e.lengthComputable) {
      // получаем общее количество байт для пересылки
      var total = e.total;
      // получаем какое количество байт уже отправлено
      var loaded = e.loaded;
      // определяем процент отправленных данных на сервер
      var progress = ((loaded * 100) / total).toFixed(1);
      // обновляем состояние прогресс бара Bootstrap
      var progressBar = this._$form.querySelector('.progress-bar');
      progressBar.setAttribute('aria-valuenow', progress);
      progressBar.style.width = progress + '%';
      //progressBar.querySelector('.sr-only').textContent = progress + '%';
    }
  }.bind(this);

  request.open('POST', this._$form.getAttribute('action'), true);
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  //request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  request.send(this._collectData());

  // при получении успешного ответа от сервера
  function _success(data, _this) {
    var _this = _this;

    var $progress = _this._$form.querySelector('.progress');
    if ($progress) {
      $progress.classList.add('d-none');
      var progressBar = $progress.querySelector('.progress-bar');
      progressBar.setAttribute('aria-valuenow', '0');
      progressBar.style.width = '0';
      //progressBar.querySelector('.sr-only').textContent = '0%';
    }

    // при успешной отправки формы
    if (data.result === 'success') {
      _this._$form.dispatchEvent(new Event('pf_success'));
      if (_this._settings.isUseDefaultSuccessMessage) {
        var $resultSuccess = _this._$form.parentElement.querySelector('.form-result-success');
        $resultSuccess.classList.remove('d-none');
        $resultSuccess.classList.add('d-flex');
      }
      return;
    }
    // если произошли ошибки при отправке
    _this._$form.querySelector('.form-error').classList.remove('d-none');
    _this._changeStateSubmit(false);

    var attach = _this._$form.querySelector('.form-attachments__item');
    if (attach) {
      attach.setAttribute('title', '');
      attach.classList.remove('is-valid');
      attach.classList.remove('is-invalid');
    }

    // выводим ошибки которые прислал сервер
    for (var error in data) {
      if (!data.hasOwnProperty(error)) {
        continue;
      }
      switch (error) {
        case 'captcha':
          _this._refreshCaptcha(_this);
          var $element = _this._$form.querySelector('[name="' + error + '"]');
          _this._setStateValidaion($element, 'error', data[error]);
          break;
        case 'attachment':
          var attachs = data[error];
          for (let key in attachs) {
            var id = _this._attachmentsItems[key].id;
            var selector = '.form-attachments__item[data-id="' + id + '"]';
            var $attach = _this._$form.querySelector(selector);
            $attach.setAttribute('title', attachs[key]);
            $attach.classList.add('is-invalid');
          }
          break;
        case 'log':
          var logs = data[error];
          for (var i = 0, length = logs.length; i < length; i++) {
            console.log(logs[i]);
          }
          break;
        default:
          var $element = _this._$form.querySelector('[name="' + error + '"]');
          if ($element) {
            _this._setStateValidaion($element, 'error', data[error]);
          }
      }
    }
    // устанавливаем фокус на не валидный элемент
    if (_this._$form.querySelectorAll('.is-invalid').length > 0) {
      if (_this._$form.querySelectorAll('.is-invalid')[0].classList.contains('file')) {
        _this._$form.querySelector('input[type="file"]').focus();
      } else {
        _this._$form.querySelectorAll('.is-invalid')[0].focus();
      }
    }
    var its = _this._$form.querySelectorAll('.form-attachments__item :not(.is-invalid)');
    for (var i = 0, length = its.lengt; i < length; i++) {
      its[i].classList.add('is-valid');
    }
  }

  // если не получили успешный ответ от сервера
  function _error(_this) {
    _this._$form.querySelector('.form-error').classList.remove('d-none');
  }
};

// функция для инициализации
ProcessForm.prototype._init = function () {
  // устанавливаем значение свойства _isCaptchaSection в завимости от того имеется ли у формы секция с капчей или нет
  this._isCaptchaSection = this._$form.querySelectorAll('.form-captcha').length > 0;
  // устанавливаем значение свойства _isAgreementSection в завимости от того имеется ли у формы секция с пользовательским соглашением или нет
  this._isAgreementSection = this._$form.querySelectorAll('.form-agreement').length > 0;
  // устанавливаем значения свойств _isAttachmentsSection и _attachmentsMaxItems в завимости от того имеется ли у формы секция с секцией для добавления к ней файлов
  var formAttachments = this._$form.querySelectorAll('.form-attachments');
  if (formAttachments.length) {
    this._isAttachmentsSection = true;
    if (formAttachments[0].getAttribute('data-count')) {
      this._attachmentsMaxItems = +formAttachments[0].getAttribute('data-count');
    }
  }
  this._setupListener.call(this);
};

ProcessForm.prototype._reset = function () {
  this._showForm();
};

// устанавливаем обработчики событий
ProcessForm.prototype._setupListener = function () {
  var $form = this._$form;
  $form.onchange = function (e) {
    var $element = e.target;
    if ($element.name === 'agree') {
      this._changeStateSubmit(!$element.checked);
    }
  }.bind(this);
  $form.onsubmit = function (e) {
    var $form = e.target;
    if ($form === this._$form) {
      e.preventDefault();
      this._sendForm(this);
    }
  }.bind(this);
  // обработка события click
  $form.onclick = function (e) {
    var $element = e.target;
    if ($element.classList.contains('form-captcha__refresh')) {
      // при нажатии click на form-captcha__refresh
      e.preventDefault();
      this._refreshCaptcha();
    } else if ($element.classList.contains('form-attachments__item-link')) {
      // при нажатии click на form-attachments__item-link
      var id = +$element.dataset.id;
      var $item = $form.querySelector('.form-attachments__item[data-id="' + id + '"]');
      var $attachs = this._attachmentsItems;
      for (var i = 0, length = $attachs.length; i < length; i++) {
        if ($attachs[i].id === id) {
          $attachs.splice(i, 1);
          break;
        }
      }
      $item.parentElement.removeChild($item);
    }
  }.bind(this);

  $form.parentElement.onclick = function (e) {
    var $element = e.target;
    if ($element.dataset.target === this._settings.selector) {
      e.preventDefault();
      this._showForm();
    }
  }.bind(this);

  var _this = this;

  // если у формы имеется .form-attachment
  if (this._isAttachmentsSection) {
    // событие при изменении элемента input с type="file" (name="attachment[])
    _this._$form.addEventListener('change', function (e) {
      if (e.target.name !== 'attachment[]') {
        return;
      }

      var file, fileId, removeLink;

      for (var i = 0, length = e.target.files.length; i < length; i++) {
        if (_this._attachmentsItems.length === _this._attachmentsMaxItems) {
          e.target.value = '';
          break;
        }
        fileId = _this._attachmentsIdCounter++;
        file = e.target.files[i];
        _this._attachmentsItems.push({
          id: fileId,
          file: file,
        });
        if (file.type.match(/image.*/)) {
          var reader = new FileReader();
          reader.readAsDataURL(file);
          (function (file, fileId) {
            reader.addEventListener('load', function (e) {
              var removeLink =
                '<div class="form-attachments__item" data-id="' +
                fileId +
                '">' +
                '<div class="form-attachments__item-wrapper">' +
                '<img class="form-attachments__item-image" src="' +
                e.target.result +
                '" alt="' +
                file.name +
                '">' +
                '<div class="form-attachments__item-name">' +
                file.name +
                '</div>' +
                '<div class="form-attachments__item-size">' +
                (file.size / 1024).toFixed(1) +
                'Кб' +
                '</div>' +
                '<div class="form-attachments__item-link" data-id="' +
                fileId +
                '">×</div>' +
                '</div>' +
                '</div>';
              _this._$form.querySelector('.form-attachments__items').innerHTML += removeLink;
            });
          })(file, fileId);
          continue;
        }
        removeLink =
          '<div class="form-attachments__item" data-id="' +
          fileId +
          '">' +
          '<div class="form-attachments__item-wrapper">' +
          '<div class="form-attachments__item-name">' +
          file.name +
          '</div>' +
          '<div class="form-attachments__item-size">' +
          (file.size / 1024).toFixed(1) +
          'Кб' +
          '</div>' +
          '<div class="form-attachments__item-link" data-id="' +
          fileId +
          '">×</div>' +
          '</div>' +
          '</div>';
        _this._$form.querySelector('.form-attachments__items').innerHTML += removeLink;
      }
      e.target.value = null;
    });
  }
};
