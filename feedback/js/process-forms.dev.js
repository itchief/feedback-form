/*!
 * Форма обратной связи (https://github.com/itchief/feedback-form)
 * Страница с описанием: https://itchief.ru/lessons/php/feedback-form-for-website
 * Copyright 2016-2022 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/feedback-form/blob/master/LICENSE)
 */

'use strict';

class ItcSubmitForm {
  constructor(target, config) {
    this._form = typeof target === 'string' ? document.querySelector(target) : target;
    const defaultConfig = {
      attachMaxSize: 512, // дефолтный максимальный размер файла в Кб
      attachExt: ['jpg', 'jpeg', 'bmp', 'gif', 'png'], // дефолтные допустимые расширения для файлов
      isUseDefaultSuccessMessage: true, // отображать дефолтное сообщение об успешной отправки формы
    };
    this._config = Object.assign(defaultConfig, config);
    this._isCaptchaSection = false; // имеется ли в форме блок с капчей
    this._isAgreementSection = false; // имеется ли в форме блок с пользовательским соглашением
    this._isAttachmentsSection = false; // имеется ли в форме блок для добавления к ней файлов
    this._attachmentsIdCounter = 0; // счетчик, хранящий количество добавленных к форме файлов
    this._attachmentsMaxItems = 5; // переменная, определяющее максимальное количество файлов, которые можно прикрепить к форме
    this._attachItems = []; // переменная, хранящая массив файлов, которые нужно прекрепить к форме
    // инициализация формы
    this._init();
  }
  // проверка расширения файла
  _checkExt(filename) {
    // расширение файла
    const ext = filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
    // проверка на соответствие допустимому
    return this._config.attachExt.indexOf(ext.toLowerCase()) !== -1;
  }
  _setElAttach(elAttach, title, state) {
    elAttach.setAttribute('title', title);
    elAttach.classList.add(state);
  }
  // переключение состояния disabled у кнопки submit
  _changeStateSubmit(state) {
    this._form.querySelector('[type="submit"]').disabled = state;
  }
  // обновление капчи
  _refreshCaptcha() {
    var captchaImg = this._form.querySelector('.form-captcha__image');
    var captchaSrc = captchaImg.getAttribute('data-src');
    var captchaPrefix = captchaSrc.indexOf('?id') !== -1 ? '&rnd=' : '?rnd=';
    var captchaNewSrc = captchaSrc + captchaPrefix + new Date().getTime();
    captchaImg.setAttribute('src', captchaNewSrc);
  }
  // изменение состояния элемента формы (success, error, clear)
  _setStateValidaion(input, state, message) {
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
  }
  // валидация формы
  _validate() {
    let result = true;
    // валидация input и textarea
    this._form.querySelectorAll('input, textarea').forEach((el) => {
      if (el.type === 'file' || el.name === 'agree') {
        return;
      }
      if (el.checkValidity()) {
        this._setStateValidaion(el, 'success');
      } else {
        this._setStateValidaion(el, 'error', el.validationMessage);
        result = false;
      }
    });
    if (!this._attachItems.length) {
      return result;
    }
    // валидация файлов
    this._attachItems.forEach((el, index) => {
      const elAttach = this._form.querySelector(`.form-attachments__item[data-id="${index}"]`);
      if (el.file.size > this._config.attachMaxSize * 1024) {
        this._setElAttach(elAttach, `Размер файла больше ${this._config.attachMaxSize}Кб`, 'is-invalid');
        result = false;
      } else if (!this._checkExt(el.file.name)) {
        this._setElAttach(elAttach, 'Тип не соответствует разрешённым', 'is-invalid');
        result = false;
      } else {
        if (elAttach) {
          this._setElAttach(elAttach, '', 'is-valid');
        }
      }
    })
    return result;
  }

  _showForm() {
    this._form.querySelector('.form-error').classList.add('d-none');
    var $resultSuccess = this._form.parentElement.querySelector('.form-result-success');
    $resultSuccess.classList.add('d-none');
    $resultSuccess.classList.remove('d-flex');
    this._form.reset();
    var $elements = this._form.querySelectorAll('input, textarea');
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
    var $attachs = this._form.querySelectorAll('.form-attachments__item');
    if ($attachs.length > 0) {
      for (var i = 0, length = $attachs.length; i < length; i++) {
        $attachs[i].parentElement.removeChild($attachs[i]);
      }
    }

    if (this._form.querySelector('.progress-bar').length) {
      var $progressBar = this._form.querySelector('.progress-bar');
      $progressBar.setAttribute('aria-valuenow', '0');
      $progressBar.style.width = 0;
    }
  };

  // переключение disabled для name="attachment[]"
  _disabledAttach(state) {
    var $attach = this._form.querySelector('[name="attachment[]"]');
    if ($attach) {
      $attach.disabled = state;
    }
  };

  // данные для отправки на сервер
  _getFormData() {
    // отключаем добавление данных из name="attachment[]" в FormData
    this._disabledAttach(true);
    let formData = new FormData(this._form);
    // включаем доступность name="attachment[]"
    this._disabledAttach(false);
    // добавляем данные из name="attachment[]" в FormData
    this._attachItems.forEach(el => {
      formData.append('attachment[]', el.file);
    })
    return formData;
  };

  // отправка формы
  _send() {
    this._form.dispatchEvent(new Event('beforeSubmit'));
    if (!this._validate()) {
      if (this._form.querySelectorAll('.is-invalid').length > 0) {
        if (this._form.querySelectorAll('.is-invalid')[0].classList.contains('file')) {
          this._form.querySelector('input[type="file"]').focus();
        } else {
          this._form.querySelectorAll('.is-invalid')[0].focus();
        }
      }
      return;
    }

    if (!this._form.querySelector('.form-error').classList.contains('d-none')) {
      this._form.querySelector('.form-error').classList.add('d-none');
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
    if (this._form.querySelector('.progress').classList.contains('d-none')) {
      this._form.querySelector('.progress').classList.remove('d-none');
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
        var progressBar = this._form.querySelector('.progress-bar');
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.style.width = progress + '%';
        //progressBar.querySelector('.sr-only').textContent = progress + '%';
      }
    }.bind(this);

    request.open('POST', this._form.getAttribute('action'), true);
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    //request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.send(this._getFormData());

    // при получении успешного ответа от сервера
    function _success(data, _this) {
      var _this = _this;

      var $progress = _this._form.querySelector('.progress');
      if ($progress) {
        $progress.classList.add('d-none');
        var progressBar = $progress.querySelector('.progress-bar');
        progressBar.setAttribute('aria-valuenow', '0');
        progressBar.style.width = '0';
        //progressBar.querySelector('.sr-only').textContent = '0%';
      }

      // при успешной отправки формы
      if (data.result === 'success') {
        _this._form.dispatchEvent(new Event('pf_success'));
        if (_this._config.isUseDefaultSuccessMessage) {
          var $resultSuccess = _this._form.parentElement.querySelector('.form-result-success');
          $resultSuccess.classList.remove('d-none');
          $resultSuccess.classList.add('d-flex');
        }
        return;
      }
      // если произошли ошибки при отправке
      _this._form.querySelector('.form-error').classList.remove('d-none');
      _this._changeStateSubmit(false);

      var attach = _this._form.querySelector('.form-attachments__item');
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
            var $element = _this._form.querySelector('[name="' + error + '"]');
            _this._setStateValidaion($element, 'error', data[error]);
            break;
          case 'attachment':
            var attachs = data[error];
            for (let key in attachs) {
              var id = _this._attachItems[key].id;
              var selector = '.form-attachments__item[data-id="' + id + '"]';
              var $attach = _this._form.querySelector(selector);
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
            var $element = _this._form.querySelector('[name="' + error + '"]');
            if ($element) {
              _this._setStateValidaion($element, 'error', data[error]);
            }
        }
      }
      // устанавливаем фокус на не валидный элемент
      if (_this._form.querySelectorAll('.is-invalid').length > 0) {
        if (_this._form.querySelectorAll('.is-invalid')[0].classList.contains('file')) {
          _this._form.querySelector('input[type="file"]').focus();
        } else {
          _this._form.querySelectorAll('.is-invalid')[0].focus();
        }
      }
      var its = _this._form.querySelectorAll('.form-attachments__item :not(.is-invalid)');
      for (var i = 0, length = its.lengt; i < length; i++) {
        its[i].classList.add('is-valid');
      }
    }

    // если не получили успешный ответ от сервера
    function _error(_this) {
      _this._form.querySelector('.form-error').classList.remove('d-none');
    }
  };

  // функция для инициализации
  _init() {
    // устанавливаем значение свойства _isCaptchaSection в завимости от того имеется ли у формы секция с капчей или нет
    this._isCaptchaSection = this._form.querySelectorAll('.form-captcha').length > 0;
    // устанавливаем значение свойства _isAgreementSection в завимости от того имеется ли у формы секция с пользовательским соглашением или нет
    this._isAgreementSection = this._form.querySelectorAll('.form-agreement').length > 0;
    // устанавливаем значения свойств _isAttachmentsSection и _attachmentsMaxItems в завимости от того имеется ли у формы секция с секцией для добавления к ней файлов
    var formAttachments = this._form.querySelectorAll('.form-attachments');
    if (formAttachments.length) {
      this._isAttachmentsSection = true;
      if (formAttachments[0].getAttribute('data-count')) {
        this._attachmentsMaxItems = +formAttachments[0].getAttribute('data-count');
      }
    }
    this._setupListener.call(this);
  };

  _reset() {
    this._showForm();
  }

  // устанавливаем обработчики событий
  _setupListener() {
    const $form = this._form;
    this._form.onchange = (e) => {
      const el = e.target;
      if (el.name === 'agree') {
        this._changeStateSubmit(!el.checked);
      }
    };
    this._form.onsubmit = (e) => {
      e.preventDefault();
      this._send(this);
    };
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
        var $attachs = this._attachItems;
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
      if ($element.dataset.target === ('#' + this._form.id)) {
        e.preventDefault();
        this._showForm();
      }
    }.bind(this);

    var _this = this;

    // если у формы имеется .form-attachment
    if (this._isAttachmentsSection) {
      // событие при изменении элемента input с type="file" (name="attachment[])
      _this._form.addEventListener('change', function (e) {
        if (e.target.name !== 'attachment[]') {
          return;
        }

        var file, fileId, removeLink;

        for (var i = 0, length = e.target.files.length; i < length; i++) {
          if (_this._attachItems.length === _this._attachmentsMaxItems) {
            e.target.value = '';
            break;
          }
          fileId = _this._attachmentsIdCounter++;
          file = e.target.files[i];
          _this._attachItems.push({
            id: fileId,
            file: file,
          });
          if (file.type.match(/image.*/)) {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            (function (file, fileId) {
              reader.addEventListener('load', (e) => {
                var removeLink = `<div class="form-attachments__item" data-id="${fileId}">
                  <div class="form-attachments__item-wrapper">
                    <img class="form-attachments__item-image" src="${e.target.result}" alt="${file.name}">
                    <div class="form-attachments__item-name">${file.name}</div>
                    <div class="form-attachments__item-size">${(file.size / 1024).toFixed(1)}Кб</div>
                   <div class="form-attachments__item-link" data-id="${fileId}">×</div>
                  </div></div>`;
                _this._form.querySelector('.form-attachments__items').innerHTML += removeLink;
              });
            })(file, fileId);
            continue;
          }
          removeLink = `<div class="form-attachments__item" data-id="${fileId}">
            <div class="form-attachments__item-wrapper">
              <div class="form-attachments__item-name">${file.name}</div>
              <div class="form-attachments__item-size">${(file.size / 1024).toFixed(1)}Кб</div>
              <div class="form-attachments__item-link" data-id="${fileId}">×</div>
            </div></div>`;
          _this._form.querySelector('.form-attachments__items').innerHTML += removeLink;
        }
        e.target.value = null;
      });
    }
  };

}
