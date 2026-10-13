const SECTIONS = [
  ['hero', 'hero'],
  ['trust', 'trust'],
  ['services', 'services'],
  ['about', 'about'],
  ['contact', 'contact'],
];

const THEME_TOGGLE = document.querySelector('.ThemeToggle');
const SYSTEM_THEME = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#26312b' : '#f6f5f0',
  );

  if (THEME_TOGGLE) {
    let nextTheme = theme === 'dark' ? 'světlý' : 'tmavý';
    THEME_TOGGLE.setAttribute('aria-label', `Přepnout na ${nextTheme} režim`);
    THEME_TOGGLE.setAttribute('title', `Přepnout na ${nextTheme} režim`);
  }
};

applyTheme(localStorage.getItem('pomoc-theme') || (SYSTEM_THEME.matches ? 'dark' : 'light'));

THEME_TOGGLE?.addEventListener('click', () => {
  let nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('pomoc-theme', nextTheme);
  applyTheme(nextTheme);
});

SYSTEM_THEME.addEventListener('change', (event) => {
  if (!localStorage.getItem('pomoc-theme')) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});

Promise.all(
  SECTIONS.map(async ([elementId, fileName]) => {
    const response = await fetch(`sections/${fileName}.html`);

    if (!response.ok) {
      throw new Error(`Nepodařilo se načíst ${fileName}`);
    }

    document.getElementById(elementId).innerHTML = await response.text();
  }),
)
  .then(() => {
    document.getElementById('year').textContent = new Date().getFullYear();

    let form = document.getElementById('contact-form');
    let formStartedAt = Date.now();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      let note = document.getElementById('form-note');
      let data = new FormData(form);
      let honeypot = String(data.get('_honey') || '').trim();

      if (honeypot || Date.now() - formStartedAt < 2500) {
        note.textContent = 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.';
        return;
      }

      if (!form.reportValidity()) return;

      let recipient = window.CONTACT_FORM_CONFIG?.recipient;
      if (!recipient) {
        note.textContent = 'Odeslání zprávy není momentálně nastavené. Zavolejte nám nebo napište e-mail.';
        return;
      }

      let submitButton = form.querySelector('.FormSubmit');
      submitButton.disabled = true;
      note.textContent = 'Odesíláme zprávu…';

      let payload = Object.fromEntries(data.entries());
      payload._subject = `Poptávka z webu — ${payload.topic}`;
      payload._replyto = payload.email;
      payload._template = 'table';

      try {
        let response = await fetch(
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
        let result = await response.json();

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
    });

    let menuToggle = document.querySelector('.MenuToggle');
    let navigation = document.querySelector('nav');

    menuToggle.addEventListener('click', () => {
      let isOpen = menuToggle.getAttribute('aria-expanded') === 'true';

      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      navigation.classList.toggle('NavOpen', !isOpen);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('NavOpen');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  })
  .catch(() => {
    document.querySelector('main').innerHTML =
      '<p class="LoadError">Obsah se nepodařilo načíst. Spusťte web přes lokální HTTP server, například příkazem <code>python -m http.server</code> ve složce webu.</p>';
  });
