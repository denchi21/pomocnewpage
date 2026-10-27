# Stylesheet structure

Edit the focused CSS source files in this folder. Their load order is defined in `scripts/build-styles.mjs`.

To combine them into the single `styles.css` file used by the website, run this command from the project root:

```sh
node scripts/build-styles.mjs
```

`styles.css` is generated output. Manual edits to it will be overwritten the next time you build.

## Sections

1. `01-settings.css` — colors, fonts and shared defaults.
2. `02-navigation.css` — site header and navigation.
3. `03-hero.css` — hero section.
4. `04-trust-services.css` — trust highlights and services.
5. `05-about.css` — about section.
6. `06-contact.css` — contact details and form.
7. `07-footer-privacy.css` — footer and privacy page.
8. `08-theme.css` — dark theme and motion preferences.
9. `09-responsive.css` — tablet and mobile layouts.