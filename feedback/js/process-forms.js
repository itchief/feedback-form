/*!
 * Форма обратной связи (https://itchief.ru/lessons/php/feedback-form-for-website)
 * Copyright 2016-2018 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/feedback-form/blob/master/LICENSE)
 */

"use strict";

var ProcessForm = function (config) {
  var _config = {
    selector: '#feedback-form', // селектор формы обратной связи
    isCaptcha: true, // наличие капчи
    isAgreement: true,  // наличие пользовательского соглашения
    isAttachments: true, // наличие блока для прикрепления файлов
    customFileText: '',
    maxSizeFile: 0.5, // максмальный размер файла в мегабайтах
    validFileExtensions: ['jpg', 'jpeg', 'bmp', 'gif', 'png'],
    codeFragmentAttachment: '<div class="form-group">' +
      '<div class="custom-file">' +
      '<input name="attachment[]" type="file" class="custom-file-input" id="validatedCustomFile" lang="ru">' +
      '<label class="custom-file-label" for="validatedCustomFile">Выберите файл...</label>' +
      '<div class="invalid-feedback"></div>' +
      '</div>' +
      '</div>'
  }
  for (var prop in config) {
    _config[prop] = config[prop];
  }
  this.getConfig = function () {
    return _config;
  }
  this.getForm = function () {
    return $(_config.selector)[0];
  }
  this.setIsCaptcha = function (value) {
    _config.isCaptcha = value;
  }
  this.setIsAgreement = function (value) {
    _config.isAgreement = value;
  }
  this.setIsAttachments = function (value) {
    _config.isAttachments = value;
  }
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
  var _validateForm = function (form) {
    var valid = true;
    $(form).find('input, textarea').not('[type="file"], [name="agree"]').each(function () {
      if (this.checkValidity()) {
        _setStateValidaion(this, 'success');
      } else {
        _setStateValidaion(this, 'error', this.validationMessage);
        valid = false;
      }
    });
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
    if (_this.getConfig().isAgreeCheckbox) {
      _changeStateSubmit(form, true);
    } else {
      _changeStateSubmit(form, false);
    }
    if (_this.getConfig().isAttachments) {
      $('.attachments').html(_this.getConfig().codeFragmentAttachment);
    }
    if ($(_this.getConfig().selector + ' .progress-bar').length) {
      $(_this.getConfig().selector + ' .progress-bar')
        .attr('aria-valuenow', '0')
        .width('0')
        .find('.sr-only').text('0%');
    }
  };

  // изменение элемента input с type="file"
  var _changeInputFile = function (e, _this) {
    $(e.currentTarget)
      .removeClass('is-invalid is-valid')
      .parent()
      .find('.invalid-feedback')
      .text('');

    // условия для добавления нового элемента input с type="file"
    var isSelectFile = e.currentTarget.files.length > 0;
    var isNextInput = $(e.currentTarget).closest('.custom-files').next('.custom-files').length === 0;
    var isMaxInput = $(_this.getConfig().selector + ' input[name="attachment[]"]').length < $(_this.getConfig().selector + ' .attachments').attr('data-counts');
    if (isSelectFile && isNextInput && isMaxInput) {
      $(e.currentTarget).closest('.form-group').after(_this.getConfig().codeFragmentAttachment);
    }
    // если файл выбран, то выполняем следующие действия...
    if (e.currentTarget.files.length > 0) {
      // получим файл
      var file = e.currentTarget.files[0];
      if ($(e.target).next('label').length > 0) {
        $(e.target).next('label').text(file.name);
      }
      // проверим размер и расширение файла
      if (file.size > _this.getConfig().maxSizeFile * 1024 * 1024) {
        $(e.currentTarget)
          .addClass('is-invalid')
          .parent()
          .find('.invalid-feedback')
          .text('*Файл не будет отправлен, т.к. его размер больше ' + _this.getConfig().maxSizeFile * 1024 + 'Кбайт');
      } else if (!_validateFileExtension(file.name, _this.getConfig().validFileExtensions)) {
        $(e.currentTarget)
          .addClass('is-invalid')
          .parent()
          .find('.invalid-feedback')
          .text('*Файл не будет отправлен, т.к. его тип не соответствует разрешённому');
      } else {
        $(e.currentTarget).addClass('is-valid');

        if ($(e.currentTarget).next('p')) {
          $(e.currentTarget).next('p').text('');
        }
      }
    } else {
      // если после изменения файл не выбран, то сообщаем об этом пользователю
      $(e.currentTarget).next('p').text('* Файл не будет отправлен, т.к. он не выбран');
      $(e.target).next('label').text('Выберите файл...');
    }
  };

  var _changeStateImages = function (config, state) {
    if (!config.isAttachments) {
      return;
    }
    var 
      files = $(config.selector).find('[name="attachment[]"]'),
      index = 0;
    for (var i = 0; i < files.length; i++) {
      // получить список файлов элемента input с type="file"
      var fileList = files[i].files;
      // если элемент не содержит файлов, то перейти к следующему
      if (fileList.length > 0) {
        // получить первый файл из списка
        var file = fileList[0];
        // проверить тип файла и размер
        if (!_validateFileExtension(file.name, config.validFileExtensions) && (file.size < config.maxSizeFile * 1024 * 1024)) {
          $(files[i]).prop('disabled', state);
          $(files[i]).attr('data-index','-1');
        } else {
          $(files[i]).attr('data-index', index++);
        }
      } else {
        $(files[i]).prop('disabled', state);
        $(files[i]).attr('data-index','-1');
      }
    }
  };

  // собираем данные для отправки на сервер
  var _collectData = function (_this, config) {
    _changeStateImages(config, true);
    var output = new FormData(_this);
    _changeStateImages(config, false);
    return output;
  };

  // отправка формы
  var _sendForm = function (_this, config) {
    if (!_validateForm(_this)) {
      if ($(_this).find('.is-invalid').length > 0) {
        $(_this).find('.is-invalid')[0].focus();
      }
      return;
    }
    if (!$(_this).find('.form-error').hasClass('d-none')) {
      $(_this).find('.form-error').addClass('d-none');
    }
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
      $(this).parent().find('.form-result-success')
        .removeClass('d-none')
        .addClass('d-flex');
      return;
    }
    // если произошли ошибки при отправке
    $(this).find('.form-error').removeClass('d-none');
    _changeStateSubmit(this, false);
  
    // выводим ошибки которые прислал сервер
    for (var error in data) {
      if (!data.hasOwnProperty(error)) {
        continue;
      };
      switch (error) {
        case 'captcha':
          _refreshCaptcha($(this));
          _setStateValidaion($(this).find('[name="' + error + '"]'), 'error', data[error]);
          break;
        case 'attachment':
          $.each(data[error], function (key, value) {
            console.log('[name="attachment[]"][data-index="' + key + '"]');
            _setStateValidaion($(_this).find('[name="attachment[]"][data-index="' + key + '"]'), 'error', value);
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
      // устанавливаем фокус на 1 невалидный элемент
      if ($(this).find('.is-invalid').length > 0) {
        $(this).find('.is-invalid')[0].focus();
      }
    }
  };

  // если не получили успешный ответ от сервера 
  var _error = function (request) {
    $(this).find('.form-error').removeClass('d-none');
  };

  // функция для инициализации 
  var _init = function () {
    this.setIsCaptcha($(this.getForm()).find('.captcha').length > 0); // имеется ли у формы секция captcha
    this.setIsAgreement($(this.getForm()).find('.agreement').length > 0); // имеется ли у формы секция agreement
    this.setIsAttachments($(this.getForm()).find('.attachments').length > 0); // имеется ли у формы секция attachments
    _setupListener(this);
  }

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
    if (_this.getConfig().isAttachments) {
      //$('#' + this.idForm + ' .countFiles').text(this.countFiles);
      // добавление нового элемента input с type="file"
      $(document).on('change', _this.getConfig().selector + ' input[name="attachment[]"]', function (e) {
        _changeInputFile(e, _this);
      });
    }
  }
  return {
    init: _init
  }
}();