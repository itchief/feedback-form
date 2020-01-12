/*!
 * Форма обратной связи (https://github.com/itchief/feedback-form)
 * Страница с описанием: https://itchief.ru/lessons/php/feedback-form-for-website
 * Copyright 2016-2020 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/feedback-form/blob/master/LICENSE)
 */

'use strict';

var ProcessForm = function (config) {
  var _config = {
    selector: '#feedback-form', // селектор формы обратной связи
    isCaptcha: true, // наличие капчи
    isAgreement: true,  // наличие пользовательского соглашения
    isAttachments: false, // наличие блока для прикрепления файлов
    isShowSuccessMessage: true, // отображение дефолтного сообщения после отправки
    customFileText: '',
    maxSizeFile: 0.5, // максмальный размер файла в мегабайтах
    validFileExtensions: ['jpg', 'jpeg', 'bmp', 'gif', 'png'],
    attachmentsIdCounter: 0, // счетчик количества прикреплённых файлов
    attachmentsMaxItems: 5, // максимальное количество файлов, которые можно прикрепить к форме
    attachmentsItems: [] // файлы для прикреплению к сообщению для отправки
  };
  for (var prop in config) {
    _config[prop] = config[prop];
  }
  this.getConfig = function () {
    return _config;
  };
  this.getForm = function () {
    return $(_config.selector)[0];
  };
  this.setIsCaptcha = function (value) {
    _config.isCaptcha = value;
  };
  this.setIsAgreement = function (value) {
    _config.isAgreement = value;
  };
  this.setIsAttachments = function (value) {
    _config.isAttachments = value;
  };
  this.setAttachmentsMaxItems = function (value) {
    _config.attachmentsMaxItems = value;
  };
};

ProcessForm.prototype = function () {
  // переключить во включенное или выключенное состояние кнопку submit
  var _changeStateSubmit = function (form, state) {
    $(form).find('[type="submit"]').prop('disabled', state);
  };

  // изменение состояния кнопки submit в зависимости от состояния checkbox agree
  var _changeAgreement = function (form, state) {
    _changeStateSubmit(form, state);
  };

  // обновление капчи
  var _refreshCaptcha = function (form) {
    var
      captchaImg = $(form).find('.img-captcha'),
      captchaSrc = captchaImg.attr('data-src'),
      captchaPrefix = captchaSrc.indexOf('?id') !== -1 ? '&rnd=' : '?rnd=',
      captchaNewSrc = captchaSrc + captchaPrefix + (new Date()).getTime();
    captchaImg.attr('src', captchaNewSrc);
  };

  // изменение состояния элемента формы (success, error, clear)
  var _setStateValidaion = function (input, state, message) {
    input = $(input);
    if (state === 'error') {
      input
        .removeClass('is-valid').addClass('is-invalid')
        .siblings('.invalid-feedback').text(message);
    } else if (state === 'success') {
      input.removeClass('is-invalid').addClass('is-valid');
    } else {
      input.removeClass('is-valid is-invalid');
    }
  };

  // метод, возвращающий результат проверки расширения файла допустимому
  var _validateFileExtension = function (filename, validFileExtensions) {
    // получаем расширение файла
    var fileExtension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    // если есть расширение, то проверяем соотвествует ли оно допустимому
    if (fileExtension) {
      for (var i = 0; i <= validFileExtensions.length; i++) {
        if (validFileExtensions[i] === fileExtension.toLowerCase()) {
          return true;
        }
      }
    }
    return false;
  };

  // валилация формы
  var _validateForm = function (form, config) {
    var valid = true;
    $(form).find('input, textarea').not('[type="file"], [name="agree"]').each(function () {
      if (this.checkValidity()) {
        _setStateValidaion(this, 'success');
      } else {
        _setStateValidaion(this, 'error', this.validationMessage);
        valid = false;
      }
    });
    if (config.attachmentsItems.length > 0) {
      var files = config.attachmentsItems;
      for (var i = 0, length = files.length; i < length; i++) {
        // проверим размер и расширение файла
        if (files[i].file.size > config.maxSizeFile * 1024 * 1024) {
          $(form).find('.form-attachments__item').eq(i).attr('title', 'Размер файла больше ' + config.maxSizeFile * 1024 + 'Кбайт').addClass('is-invalid');
          valid = false;
        } else if (!_validateFileExtension(files[i].file.name, config.validFileExtensions)) {
          $(form).find('.form-attachments__item').eq(i).attr('title', 'Тип не соответствует разрешённым').addClass('is-invalid');
          valid = false;
        } else {
          $(form).find('.form-attachments__item').eq(i).attr('title', '').addClass('is-valid');
        }
      }
    }
    return valid;
  };

  var _showForm = function (_this) {
    var
      form = _this.getForm(),
      $form = $(form);
    if (!$form.find('.form-error').hasClass('d-none')) {
      $form.find('.form-error').addClass('d-none');
    }
    $form.siblings('.form-result-success').addClass('d-none').removeClass('d-flex');
    form.reset();
    $form.find('input, textarea').each(function () {
      _setStateValidaion(this, 'clear');
    });
    if (_this.getConfig().isCaptcha) {
      _refreshCaptcha(form);
    }
    if (_this.getConfig().isAgreement) {
      _changeStateSubmit(form, true);
    } else {
      _changeStateSubmit(form, false);
    }
    if (_this.getConfig().isAttachments) {
      $form.find('.form-attachments__item').remove();
    }
    if ($(_this.getConfig().selector + ' .progress-bar').length) {
      $(_this.getConfig().selector + ' .progress-bar')
        .attr('aria-valuenow', '0')
        .width('0')
        .find('.sr-only').text('0%');
    }
  };

  var _changeStateImages = function (config, state) {
    if (!config.isAttachments) {
      return;
    }
    $(config.selector).find('[name="attachment[]"]').prop('disabled', state);
  };

  // собираем данные для отправки на сервер
  var _collectData = function (_this, config) {
    _changeStateImages(config, true);
    var output = new FormData(_this);
    _changeStateImages(config, false);
    for (var i = 0, length = config.attachmentsItems.length; i < length; i++) {
      output.append('attachment[]', config.attachmentsItems[i].file);
    }
    return output;
  };

  // отправка формы
  var _sendForm = function (_this, config) {
    if (!_validateForm(_this, config)) {
      if ($(_this).find('.is-invalid').length > 0) {
        if ($(_this).find('.is-invalid').hasClass('file')) {
          $(_this).find('input[type="file"]').focus();
        } else {
          $(_this).find('.is-invalid')[0].focus();
        }
      }
      return;
    }

    if (!$(_this).find('.form-error').hasClass('d-none')) {
      $(_this).find('.form-error').addClass('d-none');
    }

    _this.configForm = config;

    $.ajax({
      context: _this,
      type: "POST",
      url: $(_this).attr('action'),
      data: _collectData(_this, config), // данные для отправки на сервер
      contentType: false,
      processData: false,
      cache: false,
      beforeSend: function () {
        _changeStateSubmit(_this, true);
      },
      xhr: function () {
        var myXhr = $.ajaxSettings.xhr();
        if ($(config.selector + ' .progress').hasClass('d-none')) {
          $(config.selector + ' .progress').removeClass('d-none');
        }
        if (myXhr.upload) {
          myXhr.upload.addEventListener('progress', function (event) {
            // если известно количество байт для пересылки
            if (event.lengthComputable) {
              // получаем общее количество байт для пересылки
              var total = event.total;
              // получаем какое количество байт уже отправлено
              var loaded = event.loaded;
              // определяем процент отправленных данных на сервер
              var progress = ((loaded * 100) / total).toFixed(1);
              // обновляем состояние прогресс бара Bootstrap
              var progressBar = $(config.selector + ' .progress-bar');
              progressBar.attr('aria-valuenow', progress);
              progressBar.width(progress + '%');
              progressBar.find('.sr-only').text(progress + '%');
            }
          }, false);
        }
        return myXhr;
      }
    })
      .done(_success)
      .fail(_error)
  };

  // при получении успешного ответа от сервера 
  var _success = function (data) {
    var _this = this;
    if ($(this).find('.progress').length) {
      $(this)
        .find('.progress').addClass('d-none')
        .find('.progress-bar').attr('aria-valuenow', '0').width('0')
        .find('.sr-only').text('0%');
    }
    // при успешной отправки формы
    if (data.result === "success") {
      $(document).trigger('pf_success', { data: _this });
      if (_this.configForm.isShowSuccessMessage) {
        $(this).parent().find('.form-result-success')
          .removeClass('d-none')
          .addClass('d-flex');
      }
      return;
    }
    // если произошли ошибки при отправке
    $(this).find('.form-error').removeClass('d-none');
    _changeStateSubmit(this, false);

    $(_this).find('.form-attachments__item').attr('title', '').removeClass('is-valid is-invalid');

    // выводим ошибки которые прислал сервер
    for (var error in data) {
      if (!data.hasOwnProperty(error)) {
        continue;
      }
      switch (error) {
        case 'captcha':
          _refreshCaptcha($(this));
          _setStateValidaion($(this).find('[name="' + error + '"]'), 'error', data[error]);
          break;
        case 'attachment':
          $.each(data[error], function (key, value) {
            $(_this).find('.form-attachments__item').eq(key).attr('title', value).addClass('is-invalid');
            //_setStateValidaion($(_this).find('[name="attachment[]"][data-index="' + key + '"]'), 'error', value);
          });
          break;
        case 'log':
          $.each(data[error], function (key, value) {
            console.log(value);
          });
          break;
        default:
          _setStateValidaion($(this).find('[name="' + error + '"]'), 'error', data[error]);
      }
    }
    // устанавливаем фокус на 1 невалидный элемент
    if ($(this).find('.is-invalid').length > 0) {
      if ($(this).find('.is-invalid').hasClass('file')) {
        $(this).find('input[type="file"]').focus();
      } else {
        $(this).find('.is-invalid')[0].focus();
      }
    }
    $(_this).find('.form-attachments__item').not('.is-invalid').addClass('is-valid');
  };

  // если не получили успешный ответ от сервера 
  var _error = function () {
    $(this).find('.form-error').removeClass('d-none');
  };

  // функция для инициализации 
  var _init = function () {
    this.setIsCaptcha($(this.getForm()).find('.captcha').length > 0); // имеется ли у формы секция captcha
    this.setIsAgreement($(this.getForm()).find('.agreement').length > 0); // имеется ли у формы секция agreement\
    var attachmentsElement = $(this.getForm()).find('.form-attachments');
    if (attachmentsElement.length) {
      this.setIsAttachments(true); // имеется ли у формы секция attachments
      if (attachmentsElement.attr('data-count')) {
        this.setAttachmentsMaxItems(+attachmentsElement.attr('data-count'));
      }
    }
    _setupListener(this);
  };

  var _reset = function () {
    _showForm(this);
  };

  // устанавливаем обработчики событий
  var _setupListener = function (_this) {
    $(document).on('change', _this.getConfig().selector + ' [name="agree"]', function () {
      _changeAgreement(_this.getForm(), !this.checked);
    });
    $(document).on('submit', _this.getConfig().selector, function (e) {
      e.preventDefault();
      _sendForm(_this.getForm(), _this.getConfig());
    });
    $(document).on('click', _this.getConfig().selector + ' .refresh-captcha', function (e) {
      e.preventDefault();
      _refreshCaptcha(_this.getForm());
    });
    $(document).on('click', '[data-reloadform="' + _this.getConfig().selector + '"]', function (e) {
      e.preventDefault();
      _showForm(_this);
    });
    // если у формы имеется .form-attachment
    if (_this.getConfig().isAttachments) {
      // события для удаления прикреплённого файла
      $(document).on('click', _this.getConfig().selector + ' .form-attachments__item-link', function () {
        var file = $(this).closest('.form-attachments__item');
        var fileId = +$(this).attr('data-id');
        for (var i = 0, length = _this.getConfig().attachmentsItems.length; i < length; i++) {
          if (_this.getConfig().attachmentsItems[i].id === fileId) {
            _this.getConfig().attachmentsItems.splice(i, 1);
            break;
          }
        }
        file.remove();
      });
      // событие при изменении элемента input с type="file" (name="attachment[])
      $(document).on('change', _this.getConfig().selector + ' input[name="attachment[]"]', function (e) {
        var output = [];
        for (var i = 0, length = e.target.files.length; i < length; i++) {
          if (_this.getConfig().attachmentsItems.length === _this.getConfig().attachmentsMaxItems) {
            e.target.value = null;
            break;
          }
          var file = e.target.files[i];
          var fileId = _this.getConfig().attachmentsIdCounter++;
          _this.getConfig().attachmentsItems.push({
            id: fileId,
            file: file
          });
          var removeLink = '<div class="form-attachments__item">' +
            '<div class="form-attachments__item-wrapper">' +
            '<div class="form-attachments__item-name">' + file.name + '</div>' +
            '<div class="form-attachments__item-size">' + (file.size / 1024).toFixed(1) + 'Кб' + '</div>' +
            '<div class="form-attachments__item-link" data-id=' + fileId + '>×</div>' +
            '</div>' +
            '</div>';
          output.push(removeLink);
        }
        $('.form-attachments__items').append(output.join(""));
        e.target.value = null;
      });
    }
  };
  return {
    init: _init,
    reset: _reset
  }
}();