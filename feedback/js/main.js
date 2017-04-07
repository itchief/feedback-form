//после загрузки веб-страницы
$(function() {

  var ProcessForm = function(parameters) {

      // id формы обратной связи
      this.idForm = parameters['idForm'] || 'feedbackForm';
      // скрыть форму после отправки
      this.hideForm = parameters['hideForm'] || true;
      // наличие у формы блока загрузки файлов
      this.existenceUploadsFile = parameters['existenceUploadsFile'] || true;
      // наличие у формы капчи
      this.existenceCaptcha = parameters['existenceCaptcha'] || true;
      // количество элементов input для загрузки файлов
      this.countFiles = parameters['countFiles'] || 5;
      // максимальный размер файла для загрузки (по умолчанию 512 Кбайт)
      this.maxSizeFile = parameters['maxSizeFile'] || 524288;
      // допустимые разрешения файлов
      this.validFileExtensions = parameters['validFileExtensions'] || ['jpg', 'jpeg', 'bmp', 'gif', 'png'];
      // инициализация
      this.init = function() {
        // получаем форму
        var submitForm = document.getElementById(this.idForm);
        // отправка формы 
        $(submitForm).submit($.proxy(this.submitForm, this));
        if (this.existenceCaptcha) {
          // обновление капчи
          $(submitForm).find('.refresh-captcha').click($.proxy(this.refreshCaptcha, this));
        }
        if (this.existenceUploadsFile) {
          $('#' + this.idForm + ' .countFiles').text(this.countFiles);
          // добавление нового элемента input с type="file"
          $(document).on('change', '#' + this.idForm + ' input[name="images[]"]', $.proxy(this.changeInputFile, this));
        }
        if (this.hideForm) {
          $(submitForm).parent().find('.success-message').click(function() {
            $(this).addClass('hidden');
            $(submitForm).show();
          })
        }
      };
    }
    // метод, возвращающий результат проверки расширения файла допустимому
  ProcessForm.prototype.validateFileExtension = function(filename) {
    // получаем расширение файла
    var fileExtension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    // если есть расширение, то проверяем соотвествует ли оно допустимому
    if (fileExtension) {
      for (var i = 0; i <= this.validFileExtensions.length; i++) {
        if (this.validFileExtensions[i] == fileExtension) {
          return true;
        }
      }
    }
    return false;
  };
  // валилация формы
  ProcessForm.prototype.validateForm = function() {
    var _this = this;
    var validForm = true;
    var submitForm = document.getElementById(this.idForm);
    $(submitForm).find('input,textarea').each(function() {
      if (this.checkValidity()) {
        _this.changeStateInput(this, 'success');
      } else {
        _this.changeStateInput(this, 'error');
        $.jGrowl('Поле: "<strong>' + $(this).attr('data-name') + '</strong>"<br>' + this.validationMessage, { theme: 'jgrowl-error', life: 5000 });
        validForm = false;
      }
    });
    return validForm;
  };
  // изменение состояния валидация элемента формы
  ProcessForm.prototype.changeStateInput = function(input, state) {
    var input = $(input);
    inputGroup = input.parents('.form-group');
    glyphiconInput = inputGroup.find('.form-control-feedback');
    if (state == 'error') {
      inputGroup.removeClass('has-success').addClass('has-error');
      if (input.prop("tagName").toLowerCase() != 'textarea') {
        glyphiconInput.removeClass('glyphicon-ok').addClass('glyphicon-remove');
      }
    } else if (state == 'success') {
      inputGroup.removeClass('has-error').addClass('has-success');
      if (input.prop("tagName").toLowerCase() != 'textarea') {
        glyphiconInput.removeClass('glyphicon-remove').addClass('glyphicon-ok');
      }
    } else {
      inputGroup.removeClass('has-success has-error');
      glyphiconInput.removeClass('glyphicon-ok glyphicon-remove');
    }
  };
  // обработка изображений для FormData
  ProcessForm.prototype.changeStateImages = function(state) {
    if (!this.existenceUploadsFile) {
      return;
    }
    var submitForm = document.getElementById(this.idForm);
    var files = $(submitForm).find('[name="images[]"]');
    for (var i = 0; i < files.length; i++) {
      // получить список файлов элемента input с type="file"
      var fileList = files[i].files;
      // если элемент не содержит файлов, то перейти к следующему
      if (fileList.length > 0) {
        // получить первый файл из списка
        var file = fileList[0];
        // проверить тип файла и размер
        if (!((this.validateFileExtension(file.name)) && (file.size < this.maxSizeFile))) {
          $(files[i]).prop('disabled', state);
        }
      } else {
        $(files[i]).prop('disabled', state);
      }
    }
  };
  ProcessForm.prototype.collectData = function() {
    this.changeStateImages(true);
    this.dataForm = new FormData(document.getElementById(this.idForm));
    this.changeStateImages(false);
  };
  // отправка формы
  ProcessForm.prototype.submitForm = function(e) {
    var _this = this;
    e.preventDefault();
    if (this.validateForm() === false) {
      return;
    };
    this.collectData();
    $.ajax({
      type: "POST",
      url: $('#' + _this.idForm).attr('action'),
      data: _this.dataForm,
      contentType: false,
      processData: false,
      cache: false,
      success: function(data) {
        var data = JSON.parse(data);
        //устанавливаем элементу, содержащему текст ошибки, пустую строку
        $('#' + _this.idForm + '.error').text('');
        // если сервер вернул ответ success, то значит двнные отправлены
        if (data.result == "success") {
          $.jGrowl('Форма успешно отправлена!', { theme: 'jgrowl-success', life: 5000 });
          document.getElementById(_this.idForm).reset();
          $('#' + _this.idForm).find('input,textarea').each(function() {
            _this.changeStateInput(this, 'clear');
          });
          if (_this.existenceUploadsFile) {
            $('#' + _this.idForm + ' .countFiles').parents('.form-group').html(
              '<p style="font-weight: 700;">Прикрепить к сообщению файлы (максимум <span class="countFiles">' +
              _this.countFiles + '</span>):</p><input type="file" name="images[]">' +
              '<p style="margin-top: 3px; margin-bottom: 3px; color: #ff0000;"></p>');
          }
          if (_this.existenceCaptcha) {
            _this.refreshCaptcha();
          }
          if (_this.hideForm) {
            $('#' + _this.idForm).hide();
            $('#' + _this.idForm).parent().find('.success-message').removeClass('hidden');
          }
        } else if (data.result == 'invalidCaptcha') {
          // если сервер вернул ответ invalidcaptcha...
          $.jGrowl('<strong>Внимание:</strong><br>Не верно был введён проверочный код!', { theme: 'jgrowl-error', life: 5000 });
          captcha = $('#' + _this.idForm).find('[name="captcha"]').eq(0);
          _this.changeStateInput(captcha, 'error');
          $(captcha).val('');
          var imgCaptcha = $('#' + _this.idForm).find('.img-captcha');
          imgCaptcha.attr('src', imgCaptcha.attr('data-src') + '?id=' + Math.random() + '');
        } else {
          // если сервер вернул ответ error...
          $.jGrowl('<strong>Ошибка!</strong><br>Форму не удалось отправить.', { theme: 'jgrowl-warning', life: 5000 });
          // отображаем все ошибки
          for (var error in data) {
            if (error == 'result') {
              continue;
            }
            $.jGrowl(data[error], { theme: 'jgrowl-error', life: 5000 });
            _this.changeStateInput($('#' + _this.idForm).find('[name="' + error + '"]').eq(0), 'error');
          }
        }
      },
      error: function(request) {
        $.jGrowl('Произошла ошибка ' + request.responseText + ' при отправке данных.', { theme: 'jgrowl-error', life: 5000 });
      }
    });
  };
  // обновление капчи
  ProcessForm.prototype.refreshCaptcha = function() {
    var imgCaptcha = $('#' + this.idForm).find('.img-captcha');
    imgCaptcha.attr('src', imgCaptcha.attr('data-src') + '?id=' + Math.random() + '');
  };
  // изменение элемента input с type="file"
  ProcessForm.prototype.changeInputFile = function(e) {
    // условие для добавления нового элемента input с type="file"
    if ((e.currentTarget.files.length > 0) && ($(e.currentTarget).next('p').next('input[name="images[]"]').length == 0) && ($('#' + this.idForm + ' input[name="images[]"]').length < this.countFiles)) {
      $(e.currentTarget).next('p').after('<input type="file" name="images[]"><p style="margin-top: 3px; margin-bottom: 3px; color: #ff0000;"></p>');
    }
    // если файл выбран, то выполняем следующие действия...
    if (e.currentTarget.files.length > 0) {
      // получим файл
      var file = e.currentTarget.files[0];
      // проверим размер и расширение файла
      if (file.size > this.maxSizeFile) {
        $(e.currentTarget).next('p').text('*Файл не будет отправлен, т.к. его размер больше ' + this.maxSizeFile / 1024 + 'Кбайт');
      } else if (!this.validateFileExtension(file.name)) {
        $(e.currentTarget).next('p').text('*Файл не будет отправлен, т.к. его тип не соответствует разрешённому');
      } else {
        if ($(e.currentTarget).next('p')) {
          $(e.currentTarget).next('p').text('');
        }
      }
    } else {
      // если после изменения файл не выбран, то сообщаем об этом пользователю
      $(e.currentTarget).next('p').text('* Файл не будет отправлен, т.к. он не выбран');
    }
  };

  /*
    Параметры указываются в виде:
    {
      ключ: значение;
      ключ: значение;
      ...
    }
    idForm - id формы обратной связи (по умолчанию feedbackForm)
    existenceUploadsFile - наличие у формы блока загрузки файлов (по умолчанию true)
    countFiles - количество файлов для загрузки (по умолчанию 5)
    maxSizeFile - максиальный размер файла в байтах (по умолчанию 524288 байт)
    validFileExtensions - допустимые расширения файлов (по умолчанию 'jpg','jpeg','bmp','gif','png')
    existenceCaptcha - наличие у формы капчи (по умолчанию true)
    hideForm - скрыть форму после отправки данных
  */
  var formFeedback = new ProcessForm({ idForm: 'feedbackForm' });
  formFeedback.init();

  //var contactForm = new ProcessForm({ idForm: 'contactForm', existenceUploadsFile: false, existenceCaptcha: false });
  //contactForm.init();

});