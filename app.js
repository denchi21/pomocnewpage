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

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const data = new FormData(form);
      const subject = encodeURIComponent(`Poptávka z webu — ${data.get('topic')}`);
      const body = encodeURIComponent(
        `Jméno: ${data.get('name')}\n` +
          `E-mail: ${data.get('email')}\n` +
          `Oblast: ${data.get('topic')}\n\n` +
          data.get('message'),
      );

      window.location.href = `mailto:pomocks@pomocks.cz?subject=${subject}&body=${body}`;
      document.getElementById('form-note').textContent =
        'Zpráva je připravena ve vašem e-mailovém programu. Zkontrolujte ji a odešlete.';
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
