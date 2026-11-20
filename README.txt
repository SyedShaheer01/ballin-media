BALLIN MEDIA - multi-page website (HTML + CSS + JS)
====================================================

OPEN IT
  Double-click index.html. Everything (GSAP, ScrollTrigger, Three.js, fonts,
  images, logo) is inside this folder, so it works offline and on any host.
  To publish: upload the whole folder contents to your hosting root.

PAGES
  index.html  about.html  services.html  case-studies.html  blog.html
  testimonials.html  contact.html
  + 9 service pages (service-*.html), 3 case studies (case-*.html),
    3 blog posts (post-*.html)

THINGS YOU'LL WANT TO EDIT
  - Stats numbers (150+, 80+, 25M+, 98%): search "data-count" in index.html,
    about.html, testimonials.html.
  - Detail-page copy (service pages, case studies, blog posts, About) was
    written as a starting draft - replace with your own text.
  - Images: assets/img/*.svg are illustrations in your brand colors. To use real
    photos, drop a .jpg/.webp into assets/img/ and change the src in the HTML.
  - Quote forms: they open the visitor's email app addressed to
    ballinmedia0@gmail.com. To send to a backend or a form service (Formspree,
    Web3Forms, etc.), edit the submit handler near the end of assets/js/main.js.
  - Colors: assets/css/style.css, variables at the top (:root).

FOLDERS
  assets/css/style.css   all styling
  assets/js/main.js      animations, 3D scene, page transitions
  assets/js/*.min.js     GSAP, ScrollTrigger, Three.js, Lenis (local copies)
  assets/fonts/          Syne + Inter
  assets/img/            logo + illustrations
