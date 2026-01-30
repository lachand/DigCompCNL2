# Idées d'icônes PWA pour DigCompCNL2

- **icon-192x192.png** :
  - Fond : #6366f1 (indigo Tailwind)
  - Symbole : chapeau de diplômé blanc ("graduation cap"), centré
  - Option : bordure blanche fine, coins arrondis

- **icon-512x512.png** :
  - Même design, taille supérieure

- **maskable-icon-192x192.png** et **maskable-icon-512x512.png** :
  - Même base, mais le symbole occupe plus d'espace (pour le mode maskable)
  - Fond uni #6366f1, pas de texte

- **Conseils** :
  - Format PNG, fond transparent ou #6366f1
  - Utiliser un SVG de chapeau de diplômé pour la netteté
  - Générer les PNG à partir d'un SVG source (ex: Figma, Inkscape, https://realfavicongenerator.net/)

---

## SVG exemple (chapeau de diplômé blanc sur fond indigo)

```svg
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#6366f1"/>
  <path d="M256 120L464 208L256 296L48 208L256 120Z" fill="white"/>
  <rect x="176" y="240" width="160" height="48" rx="16" fill="white"/>
  <circle cx="256" cy="320" r="24" fill="white"/>
</svg>
```

- Adapter la taille et le padding pour chaque version.
- Pour le maskable, laisser plus d'espace autour du symbole.

---

**À placer dans public/icons/ :**
- icon-192x192.png
- icon-512x512.png
- maskable-icon-192x192.png
- maskable-icon-512x512.png

