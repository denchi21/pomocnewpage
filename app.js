const sections = [
  ['hero', 'hero'],
  ['trust', 'trust'],
  ['services', 'services'],
  ['about', 'about'],
  ['contact', 'contact'],
];

Promise.all(
  sections.map(async ([elementId, fileName]) => {
    const response = await fetch(`sections/${fileName}.html`);

    if (!response.ok) {
      throw new Error(`Nepodařilo se načíst ${fileName}`);
    }

    document.getElementById(elementId).innerHTML = await response.text();
  }),
)
  .then(() => {
    document.getElementById('year').textContent = new Date().getFullYear();

    const form = document.getElementById('contact-form');

    const formStartedAt = Date.now();

    form.addEventListener('submit', async (event) => {
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

      const submitButton = form.querySelector('.form-submit');
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
      } catch (error) {
        note.textContent = 'Odeslání se nezdařilo. Napište nám prosím přímo na uvedený e-mail.';
        console.error(error);
      } finally {
        submitButton.disabled = false;
      }
    });

    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('nav');

    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';

      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      navigation.classList.toggle('nav-open', !isOpen);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  })
  .catch((error) => {
    document.querySelector('main').innerHTML =
      '<p class="load-error">Obsah se nepodařilo načíst. Spusťte web přes lokální HTTP server, například příkazem <code>python -m http.server</code> ve složce webu.</p>';
    console.error(error);
  });
