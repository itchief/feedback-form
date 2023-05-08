/*!
 * Форма обратной связи (https://github.com/itchief/feedback-form)
 * Описание: https://itchief.ru/php/feedback-form
 * Copyright 2016-2022 Alexander Maltsev
 * Licensed under MIT (https://github.com/itchief/feedback-form/blob/master/LICENSE)
 */

class ItcSubmitForm {

  static instances = [];

  static getOrCreateInstance(target, config) {
    const elForm = typeof target === 'string' ? document.querySelector(target) : target;
    const found = this.instances.find(el => el.target === elForm);
    if (found) {
      return found.instance;
    }
    const form = new this(elForm, config);
    this.instances.push({target: elForm, instance: form});
    return this;
  }

  constructor(target, config = {}) {
    this._attach = {
      index: 0,
      maxItems: config['attachMaxItems'] || 5,
      maxFileSize: config['attachMaxFileSize'] || 512, // максимальный размер файла
      ext: config['attachExt'] || ['jpg', 'jpeg', 'bmp', 'gif', 'png'], // дефолтные допустимые расширения для файлов
      items: []
    };
    this._isCheckValidationOnClient = config['isCheckValidationOnClient'] !== false;
    this._elForm = target;
    this._init();
  }

  // проверка расширения файла
  static _checkExt(filename, ext) {
    // расширение файла
    const extFile = filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
    // проверка на соответствие допустимому
    return ext.indexOf(extFile.toLowerCase()) !== -1;
  }

  // статический метод для получения шаблона form-attach__item
  static _getAttachTemplate(id, file, target) {
    const itemImg = target ? `<img class="form-attach__image" src="${target.result}" alt="${file.name}"></img>` : '';
    return `<div class="form-attach__item" data-index="${id}" data-id="${id}">
      ${itemImg}
      <div class="form-attach__name">${file.name}</div>
      <div class="form-attach__size">${(file.size / 1024).toFixed(1)}Кб</div>
      <div class="form-attach__link" data-id="${id}">×</div>
    </div>`;
  }

  // получение новой капчи
  _reloadСaptcha() {
    var captchaImg = this._elForm.querySelector('.form-captcha__image');
    var captchaSrc = captchaImg.getAttribute('data-src');
    var captchaPrefix = captchaSrc.indexOf('?id') !== -1 ? '&rnd=' : '?rnd=';
    var captchaNewSrc = captchaSrc + captchaPrefix + new Date().getTime();
    captchaImg.setAttribute('src', captchaNewSrc);
  }

  // установка статуса валидации
  _setStateValidaion(input, state, message) {
    const className = state === 'success' ? 'is-valid' : 'is-invalid';
    const text = state === 'success' ? '' : message;
    if (input.classList.contains('form-attach__item')) {
      input.setAttribute('title', text);
      input.classList.add(className);
      return;
    }
    input.classList.remove('is-valid');
    input.classList.remove('is-invalid');
    input.closest('.form-group').querySelector('.invalid-feedback').textContent = '';
    if (state === 'error' || state === 'success') {
      input.classList.add(className);
      input.closest('.form-group').querySelector('.invalid-feedback').textContent = text;
    }
  }

  // валидация формы
  _checkValidity() {
    let valid = true;
    // input, textarea
    this._elForm.querySelectorAll('input, textarea').forEach(el => {
      if (el.type === 'file') {
        return;
      }
      if (el.checkValidity()) {
        this._setStateValidaion(el, 'success');
      } else {
        this._setStateValidaion(el, 'error', el.validationMessage);
        valid = false;
      }
    })
    // attach
    const elAttach = this._elForm.querySelector('.form-attach');
    if (elAttach) {
      elAttach.classList.remove('is-invalid');
      elAttach.querySelector('.invalid-feedback').textContent = '';
      const isRequired = elAttach.querySelector('[type="file"]').required;
      if (isRequired && this._attach.items.length === 0) {
        elAttach.classList.add('is-invalid');
        elAttach.querySelector('.invalid-feedback').textContent = 'Заполните это поле.';
      }
    }
    this._attach.items.forEach((item) => {
      const elAttach = this._elForm.querySelector('.form-attach__item[data-index="' + item.index + '"]');
      if (item.file.size > this._attach.maxFileSize * 1024) {
        this._setStateValidaion(elAttach, 'error', `Размер файла больше ${this._attach.maxFileSize}Кб`);
        valid = false;
      } else if (!this.constructor._checkExt(item.file.name, this._attach.ext)) {
        this._setStateValidaion(elAttach, 'error', 'Тип не является допустимым');
        valid = false;
      } else {
        this._setStateValidaion(elAttach, 'success', '');
      }
    })
    return valid;
  }

  // собираем данные для отправки на сервер
  _getFormData() {
    const formData = new FormData(this._elForm);
    formData.delete('attach[]');
    this._attach.items.forEach(item => {
      formData.append('attach[]', item.file);
    });
    return formData;
  };

  // при получении успешного ответа от сервера
  _successXHR(data) {
    const elAttach = this._elForm.querySelector('.form-attach');
    if (elAttach) {
      elAttach.classList.remove('is-invalid');
      elAttach.querySelector('.invalid-feedback').textContent = '';
    }
    this._elForm.querySelectorAll('input, textarea').forEach(el => {
      this._setStateValidaion(el);
    });

    // при успешной отправки формы
    if (data['result'] === 'success') {
      this._elForm.dispatchEvent(new Event('itc.successSendForm', {bubbles: true}));
      return;
    }

    this._elForm.querySelector('.form-error').classList.add('form-error_hide');
    // this._elForm.querySelector('.form-error').classList.remove('form-error_hidden');

    if (!Object.keys(data['errors']).length) {
      this._elForm.querySelector('.form-error').textContent = 'При отправке сообщения произошла ошибка. Пожалуйста, попробуйте ещё раз позже.';
    } else {
      this._elForm.querySelector('.form-error').textContent = 'В форме содержатся ошибки!';
    }

    this._elForm.querySelector('.form-error').classList.remove('form-error_hide');

    // выводим ошибки
    for (let key in data['errors']) {
      if (key === 'attach') {
        const attachs = data['errors'][key];
        if (typeof attachs === 'string') {
          if (elAttach.querySelector('[type="file"]').required) {
            elAttach.classList.add('is-invalid');
            elAttach.querySelector('.invalid-feedback').textContent = attachs;
          }
        } else {
          for (let attach in attachs) {
            const index = this._attach.items[attach].index;
            const elAttach = this._elForm.querySelector('.form-attach__item[data-index="' + index + '"]');
            this._setStateValidaion(elAttach, 'error', attachs[attach]);
          }
        }
      } else {
        key === 'captcha' ? this._reloadСaptcha() : null;
        const el = this._elForm.querySelector('[name="' + key + '"]');
        el ? this._setStateValidaion(el, 'error', data['errors'][key]) : null;
      }
    }
    // к полям, отвечающим требованиям, добавляем класс is-valid
    this._elForm.querySelectorAll('.form-attach__item:not(.is-invalid), input:not(.is-invalid), textarea:not(.is-invalid)').forEach(el => {
      this._setStateValidaion(el, 'success', '');
    })

    data['logs'].forEach((message) => {
      console.log(message);
    });

    // устанавливаем фокус на не валидный элемент
    const elInvalid = this._elForm.querySelector('.is-invalid');
    if (elInvalid) {
      if (elInvalid.classList.contains('form-attach')) {
        elInvalid.querySelector('input[type="file"]').focus();
      } else {
        elInvalid.focus();
      }
    }
  }

  _errorXHR() {
    this._elForm.querySelector('.form-error').classList.remove('d-none');
  }

  // отправка формы
  _onSubmit() {
    this._elForm.dispatchEvent(new Event('before-send'));
    if (this._isCheckValidationOnClient) {
      if (!this._checkValidity()) {
        const elInvalid = this._elForm.querySelector('.is-invalid');
        if (elInvalid) {
          if (elInvalid.classList.contains('form-attach')) {
            elInvalid.querySelector('input[type="file"]').focus();
          } else {
            elInvalid.focus();
          }
        }
        return;
      }
    }

    const submitWidth = this._elForm.querySelector('[type="submit"]').getBoundingClientRect().width;
    const submitHeight = this._elForm.querySelector('[type="submit"]').getBoundingClientRect().height;
    this._elForm.querySelector('[type="submit"]').textContent = '';
    this._elForm.querySelector('[type="submit"]').disabled = true;
    this._elForm.querySelector('[type="submit"]').style.width = `${submitWidth}px`;
    this._elForm.querySelector('[type="submit"]').style.height = `${submitHeight}px`;

    this._elForm.querySelector('.form-error').classList.add('form-error_hide');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', this._elForm.action);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.responseType = 'json';
    xhr.onload = () => {
      this._elForm.querySelector('[type="submit"]').textContent = this._submitText;
      this._elForm.querySelector('[type="submit"]').disabled = false;
      this._elForm.querySelector('[type="submit"]').style.width = '';
      this._elForm.querySelector('[type="submit"]').style.height = '';
      if (xhr.status == 200) {
        this._successXHR(xhr.response);
      } else {
        this._errorXHR();
      }
    }
    xhr.send(this._getFormData());
  };

  // функция для инициализации
  _init() {
    const elFormAttachCount = this._elForm.querySelector('.form-attach__count');
    elFormAttachCount ? elFormAttachCount.textContent = this._attach.maxItems : null;
    this._submitText = this._elForm.querySelector('[type="submit"]').textContent;
    this._addEventListener();
  }

  // добавляем обработчики для событий
  _addEventListener() {
    // обработка события submit
    this._elForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this._onSubmit();
    });
    // обработка события click
    this._elForm.addEventListener('click', (e) => {
      const target = e.target;
      if (target.closest('.form-captcha__refresh')) {
        e.preventDefault();
        this._reloadСaptcha();
      } else if (target.closest('.form-attach__link')) {
        const el = target.closest('.form-attach__item');
        const index = +el.dataset.index;
        this._attach.items.forEach((item, i) => {
          if (item['index'] === index) {
            this._attach.items.splice(i, 1);
            el.remove();
            return;
          }
        });
      }
    })
    // обработка события change
    this._elForm.addEventListener('change', (e) => {
      const target = e.target;
      if (target.name !== 'attach[]') {
        return;
      }
      for (let i = 0, length = target.files.length; i < length; i++) {
        if (this._attach.items.length >= this._attach.maxItems) {
          target.value = '';
          break;
        }
        const index = this._attach.index++;
        const file = target.files[i];
        this._attach.items.push({
          index,
          file
        });
        if (file.type.match(/image.*/)) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.addEventListener('load', (e) => {
            this._elForm.querySelector('.form-attach__items').innerHTML += this.constructor._getAttachTemplate(index, file, e.target);
          });
        } else {
          this._elForm.querySelector('.form-attach__items').innerHTML += this.constructor._getAttachTemplate(index, file);
        }
      }
      target.value = '';
    });
  }
  // сброс формы
  reset() {
    if (this._elForm.querySelector('.form-error')) {
      this._elForm.querySelector('.form-error').classList.add('form-error_hide');
    }
    this._elForm.reset();
    this._elForm.querySelectorAll('input, textarea').forEach(el => {
      this._setStateValidaion(el);
    });
    document.querySelector('[name="captcha"]') ? this._reloadСaptcha() : null;
    if (this._elForm.querySelector('.form-attach')) {
      this._attach['index'] = 0;
      this._attach['items'] = [];
      this._elForm.querySelector('.form-attach__items').textContent = '';
      if (this._elForm.querySelector('.is-invalid')) {
        this._elForm.querySelector('.is-invalid').classList.remove('is-invalid');
      }
    }
  }
}
