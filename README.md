# MOCCA — Cinematic scroll prototype

Esta versión reduce la arquitectura a **2 páginas**:

1. `index.html` — Home / About / Services / Clients / CTA
2. `contact.html` — Contact

La diferencia importante es que el scroll ya no se trata como una sucesión de
secciones independientes. Se utiliza como una **timeline narrativa**:

- Hero: la fotografía, el claim y la barra de progreso reaccionan conjuntamente.
- Hero → About: palabras gigantes se desplazan y transforman.
- About: manifiesto y contenido entran desde diferentes ejes.
- About → Services: estrategia × creatividad × tecnología funciona como puente.
- Services: acordeón interactivo.
- Clients: filas que aparecen progresivamente.
- CTA: elemento luminoso con parallax.

La versión usa GSAP + ScrollTrigger desde CDN. Si GSAP no carga, la web conserva
el contenido y funciona como una página normal.

IMPORTANTE:
- `resources/home.png` se usa como imagen principal.
- Si quieres una estética más específica (por ejemplo la foto de mujer/café/cyberpunk
  del mockup), sustituye `resources/home.png` por esa imagen.
