const SECTIONS = [
  ['hero', 'hero'],
  ['trust', 'trust'],
  ['services', 'services'],
  ['about', 'about'],
  ['contact', 'contact'],
];

const THEME_TOGGLE = document.querySelector('.ThemeToggle');
const SYSTEM_THEME = window.matchMedia('(prefers-color-scheme: dark)');

/** Применяет выбранную тему, обновляет цвет браузера и подпись кнопки. */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#26312b' : '#f6f5f0',
  );

  if (THEME_TOGGLE) {
    const nextTheme = theme === 'dark' ? 'světlý' : 'tmavý';
    THEME_TOGGLE.setAttribute('aria-label', `Přepnout na ${nextTheme} režim`);
    THEME_TOGGLE.setAttribute('title', `Přepnout na ${nextTheme} režim`);
  }
}

/** Переключает тему по нажатию и сохраняет выбор на этом устройстве. */
function handleThemeToggle() {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('pomoc-theme', nextTheme);
  applyTheme(nextTheme);
}

/** Подстраивает тему под систему, только пока пользователь сам её не выбрал. */
function handleSystemThemeChange(event) {
  if (!localStorage.getItem('pomoc-theme')) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
}

applyTheme(localStorage.getItem('pomoc-theme') || (SYSTEM_THEME.matches ? 'dark' : 'light'));
THEME_TOGGLE?.addEventListener('click', handleThemeToggle);
SYSTEM_THEME.addEventListener('change', handleSystemThemeChange);

/** Загружает HTML одного раздела в соответствующий контейнер страницы. */
async function loadSection([elementId, fileName]) {
  const response = await fetch(`sections/${fileName}.html`);

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst ${fileName}`);
  }

  document.getElementById(elementId).innerHTML = await response.text();
}

/** Запускает инициализацию интерактивных элементов после загрузки всех разделов. */
function initializePage() {
  document.getElementById('year').textContent = new Date().getFullYear();
  initializeContactForm();
  initializeMobileNavigation();
}

/** Подключает обработчик отправки формы и защищает её от простых ботов. */
function initializeContactForm() {
  const form = document.getElementById('contact-form');
  const formStartedAt = Date.now();

  /** Проверяет форму и отправляет её содержимое в настроенный сервис FormSubmit. */
  async function handleContactSubmit(event) {
    event.preventDefault();

    const note = document.getElementById('form-note');
    const data = new FormData(form);
    const honeypot = String(data.get('_honey') || '').trim();

    if (honeypot || Date.now() - formStartedAt < 2500) {
      note.textContent = 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.';
      return;
    }

    if (!form.reportValidity()) return;

    const recipient = window.CONTACT_FORM_CONFIG?.recipient;
    if (!recipient) {
      note.textContent = 'Odeslání zprávy není momentálně nastavené. Zavolejte nám nebo napište e-mail.';
      return;
    }

    const submitButton = form.querySelector('.FormSubmit');
    submitButton.disabled = true;
    note.textContent = 'Odesíláme zprávu…';

    const payload = Object.fromEntries(data.entries());
    payload._subject = `Poptávka z webu — ${payload.topic}`;
    payload._replyto = payload.email;
    payload._template = 'table';

    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();

      if (!response.ok || result.success === 'false' || result.success === false) {
        throw new Error('FormSubmit submission failed');
      }

      form.reset();
      note.textContent = 'Děkujeme, zpráva byla odeslána. Brzy se vám ozveme.';
    } catch {
      note.textContent = 'Odeslání se nezdařilo. Napište nám prosím přímo na uvedený e-mail.';
    } finally {
      submitButton.disabled = false;
    }
  }

  form.addEventListener('submit', handleContactSubmit);
}

/** Запускает мобильное меню и закрывает его после выбора ссылки. */
function initializeMobileNavigation() {
  const menuToggle = document.querySelector('.MenuToggle');
  const navigation = document.querySelector('nav');

  /** Меняет состояние кнопки и показывает или скрывает навигацию. */
  function toggleNavigation() {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';

    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('NavOpen', !isOpen);
  }

  /** Закрывает мобильное меню после перехода по ссылке. */
  function closeNavigation() {
    navigation.classList.remove('NavOpen');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  menuToggle.addEventListener('click', toggleNavigation);
  for (const link of navigation.querySelectorAll('a')) {
    link.addEventListener('click', closeNavigation);
  }
}

/** Показывает подсказку, если браузеру не удалось загрузить HTML-разделы. */
function showSectionLoadError() {
  document.querySelector('main').innerHTML =
    '<p class="LoadError">Obsah se nepodařilo načíst. Spusťte web přes lokální HTTP server, například příkazem <code>python -m http.server</code> ve složce webu.</p>';
}

Promise.all(SECTIONS.map(loadSection))
  .then(initializePage)
  .catch(showSectionLoadError);