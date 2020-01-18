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
        isUseDefaultSuccessMessage: true // отображать дефолтное сообщение об успешной отправки формы
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
    this._form = $(this._settings.selector).eq(0);
};

ProcessForm.prototype = function () {
    // переключить во включенное или выключенное состояние кнопку submit
    var _changeStateSubmit = function (_this, state) {
        _this._form.find('[type="submit"]').prop('disabled', state);
    };

    // обновление капчи
    var _refreshCaptcha = function (_this) {
        var
            captchaImg = _this._form.find('.form-captcha__image'),
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
    var _validateForm = function (_this) {
        var valid = true;
        _this._form.find('input, textarea').not('[type="file"], [name="agree"]').each(function () {
            if (this.checkValidity()) {
                _setStateValidaion(this, 'success');
            } else {
                _setStateValidaion(this, 'error', this.validationMessage);
                valid = false;
            }
        });
        if (_this._attachmentsItems.length > 0) {
            var files = _this._attachmentsItems;
            for (var i = 0, length = files.length; i < length; i++) {
                // проверим размер и расширение файла
                if (files[i].file.size > _this._settings.attachmentsMaxFileSize * 1024) {
                    _this._form.find('.form-attachments__item[data-id="' + i + '"]').attr('title', 'Размер файла больше ' + _this._settings.attachmentsMaxFileSize + 'Кб').addClass('is-invalid');
                    valid = false;
                } else if (!_validateFileExtension(files[i].file.name, _this._settings.attachmentsFileExt)) {
                    _this._form.find('.form-attachments__item[data-id="' + i + '"]').attr('title', 'Тип не соответствует разрешённым').addClass('is-invalid');
                    valid = false;
                } else {
                    _this._form.find('.form-attachments__item[data-id="' + i + '"]').attr('title', '').addClass('is-valid');
                }
            }
        }
        return valid;
    };

    var _showForm = function (_this) {
        if (!_this._form.find('.form-error').hasClass('d-none')) {
            _this._form.find('.form-error').addClass('d-none');
        }
        _this._form.siblings('.form-result-success').addClass('d-none').removeClass('d-flex');
        _this._form[0].reset();
        _this._form.find('input, textarea').each(function () {
            _setStateValidaion(this, 'clear');
        });
        if (_this._isCaptchaSection) {
            _refreshCaptcha(_this);
        }
        if (_this._isAgreementSection) {
            _changeStateSubmit(_this, true);
        } else {
            _changeStateSubmit(_this, false);
        }
        if (_this._isAttachmentsSection) {
            _this._form.find('.form-attachments__item').remove();
        }
        if (_this._form.find('.progress-bar').length) {
            _this._form.find('.progress-bar')
                .attr('aria-valuenow', '0')
                .width('0')
                .find('.sr-only').text('0%');
        }
    };

    var _changeStateImages = function (_this, state) {
        if (!_this._isAttachmentsSection) {
            return;
        }
        _this._form.find('[name="attachment[]"]').prop('disabled', state);
    };

    // собираем данные для отправки на сервер
    var _collectData = function (_this) {
        var output;
        _changeStateImages(_this, true);
        output = new FormData(_this._form[0]);
        _changeStateImages(_this, false);
        for (var i = 0, length = _this._attachmentsItems.length; i < length; i++) {
            output.append('attachment[]', _this._attachmentsItems[i].file);
        }
        return output;
    };

    // отправка формы
    var _sendForm = function (_this) {
        if (!_validateForm(_this)) {
            if (_this._form.find('.is-invalid').length > 0) {
                if (_this._form.find('.is-invalid').hasClass('file')) {
                    _this._form.find('input[type="file"]').focus();
                } else {
                    _this._form.find('.is-invalid')[0].focus();
                }
            }
            return;
        }

        if (!_this._form.find('.form-error').hasClass('d-none')) {
            _this._form.find('.form-error').addClass('d-none');
        }

        $.ajax({
            context: _this,
            type: "POST",
            url: _this._form.attr('action'),
            data: _collectData(_this), // данные для отправки на сервер
            contentType: false,
            processData: false,
            cache: false,
            beforeSend: function () {
                _changeStateSubmit(_this, true);
            },
            xhr: function () {
                var myXhr = $.ajaxSettings.xhr();
                if (_this._form.find('.progress').hasClass('d-none')) {
                    _this._form.find('.progress').removeClass('d-none');
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
                            var progressBar = _this._form.find('.progress-bar');
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
        if (_this._form.find('.progress').length) {
            _this._form
                .find('.progress').addClass('d-none')
                .find('.progress-bar').attr('aria-valuenow', '0').width('0')
                .find('.sr-only').text('0%');
        }
        // при успешной отправки формы
        if (data.result === "success") {
            $(document).trigger('pf_success', {data: this});
            if (_this._settings.isUseDefaultSuccessMessage) {
                _this._form.parent().find('.form-result-success')
                    .removeClass('d-none')
                    .addClass('d-flex');
            }
            return;
        }
        // если произошли ошибки при отправке
        _this._form.find('.form-error').removeClass('d-none');
        _changeStateSubmit(this, false);

        _this._form.find('.form-attachments__item').attr('title', '').removeClass('is-valid is-invalid');

        // выводим ошибки которые прислал сервер
        for (var error in data) {
            if (!data.hasOwnProperty(error)) {
                continue;
            }
            switch (error) {
                case 'captcha':
                    _refreshCaptcha(_this);
                    _setStateValidaion(_this._form.find('[name="' + error + '"]'), 'error', data[error]);
                    break;
                case 'attachment':
                    $.each(data[error], function (key, value) {
                        _this._form.find('.form-attachments__item[data-id="' + _this._attachmentsItems[key].id + '"]').attr('title', value).addClass('is-invalid');
                    });
                    break;
                case 'log':
                    $.each(data[error], function (key, value) {
                        console.log(value);
                    });
                    break;
                default:
                    _setStateValidaion(_this._form.find('[name="' + error + '"]'), 'error', data[error]);
            }
        }
        // устанавливаем фокус на 1 невалидный элемент
        if (_this._form.find('.is-invalid').length > 0) {
            if (_this._form.find('.is-invalid').hasClass('file')) {
                _this._form.find('input[type="file"]').focus();
            } else {
                _this._form.find('.is-invalid')[0].focus();
            }
        }
        _this._form.find('.form-attachments__item').not('.is-invalid').addClass('is-valid');
    };

    // если не получили успешный ответ от сервера
    var _error = function () {
        this._form.find('.form-error').removeClass('d-none');
    };

    // функция для инициализации
    var _init = function () {
        // устанавливаем значение свойства _isCaptchaSection в завимости от того имеется ли у формы секция с капчей или нет
        this._isCaptchaSection = this._form.find('.form-captcha').length > 0;
        // устанавливаем значение свойства _isAgreementSection в завимости от того имеется ли у формы секция с пользовательским соглашением или нет
        this._isAgreementSection = this._form.find('.form-agreement').length > 0;
        // устанавливаем значения свойств _isAttachmentsSection и _attachmentsMaxItems в завимости от того имеется ли у формы секция с секцией для добавления к ней файлов
        var formAttachments = this._form.find('.form-attachments');
        if (formAttachments.length) {
            this._isAttachmentsSection = true;
            if (formAttachments.attr('data-count')) {
                this._attachmentsMaxItems = +formAttachments.attr('data-count');
            }
        }
        _setupListener(this);
    };

    var _reset = function () {
        _showForm(this);
    };

    // устанавливаем обработчики событий
    var _setupListener = function (_this) {
        $(document).on('change', _this._settings.selector + ' [name="agree"]', function () {
            _changeStateSubmit(_this, !this.checked);
        });
        $(document).on('submit', _this._settings.selector, function (e) {
            e.preventDefault();
            _sendForm(_this);
        });
        $(document).on('click', _this._settings.selector + ' .form-captcha__refresh', function (e) {
            e.preventDefault();
            _refreshCaptcha(_this);
        });
        $(document).on('click', '[data-target="' + _this._settings.selector + '"]', function (e) {
            e.preventDefault();
            _showForm(_this);
        });
        // если у формы имеется .form-attachment
        if (_this._isAttachmentsSection) {
            // события для удаления добавленного к форме файла
            $(document).on('click', _this._settings.selector + ' .form-attachments__item-link', function () {
                var
                    link = $(this),
                    fileId = +link.attr('data-id'),
                    file = link.closest('.form-attachments__item');
                for (var i = 0, length = _this._attachmentsItems.length; i < length; i++) {
                    if (_this._attachmentsItems[i].id === fileId) {
                        _this._attachmentsItems.splice(i, 1);
                        break;
                    }
                }
                file.remove();
            });
            // событие при изменении элемента input с type="file" (name="attachment[])
            $(document).on('change', _this._settings.selector + ' input[name="attachment[]"]', function (e) {
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
                        file: file
                    });
                    if (file.type.match(/image.*/)) {
                        var reader = new FileReader();
                        reader.readAsDataURL(file);
                        (function (file, fileId) {
                            reader.addEventListener('load', function (e) {
                                var removeLink = '<div class="form-attachments__item" data-id="' + fileId + '">' +
                                    '<div class="form-attachments__item-wrapper">' +
                                    '<img class="form-attachments__item-image" src="' + e.target.result + '" alt="' + file.name + '">' +
                                    '<div class="form-attachments__item-name">' + file.name + '</div>' +
                                    '<div class="form-attachments__item-size">' + (file.size / 1024).toFixed(1) + 'Кб' + '</div>' +
                                    '<div class="form-attachments__item-link" data-id="' + fileId + '">×</div>' +
                                    '</div>' +
                                    '</div>';
                                _this._form.find('.form-attachments__items').append(removeLink);
                            });
                        })(file, fileId);
                        continue;
                    }
                    removeLink = '<div class="form-attachments__item" data-id="' + fileId + '">' +
                        '<div class="form-attachments__item-wrapper">' +
                        '<div class="form-attachments__item-name">' + file.name + '</div>' +
                        '<div class="form-attachments__item-size">' + (file.size / 1024).toFixed(1) + 'Кб' + '</div>' +
                        '<div class="form-attachments__item-link" data-id="' + fileId + '">×</div>' +
                        '</div>' +
                        '</div>';
                    _this._form.find('.form-attachments__items').append(removeLink);
                }
                e.target.value = null;
            });
        }
    };
    return {
        init: _init,
        reset: _reset
    }
}();