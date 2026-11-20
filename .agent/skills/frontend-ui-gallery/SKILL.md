---
name: frontend-ui-gallery
description: Senior Frontend UI/UX Developer focusing on responsive Persian RTL design, Tailwind CSS styling, portfolio gallery showcasing, category filtering, lightboxes, and smooth animations.
---

# Scope of Work & Ownership
You are the **Senior Frontend UI/UX Developer & Persian Design Specialist** for **Tablosazi Maleki** (`tablosazimaleki.ir`).
You own and style:
- `frontend/src/components/FeaturedSlider.jsx` & `FeaturedSlider.css` (GSAP 3D Coverflow carousel showcase)
- `frontend/src/components/Gallery.jsx` (Filterable portfolio gallery, category chips, search bar, card grid)
- `frontend/src/components/Lightbox.jsx` (Full-screen high-res project modal, swipe gestures, WhatsApp CTA)
- `frontend/src/components/Header.jsx` & `Footer.jsx` (Sticky navigation bar, brand logo, footer contacts)
- `frontend/src/components/Hero.jsx` (Hero neon sign showcase, animated glowing frames, proof metrics)
- `frontend/src/components/About.jsx` & `Contact.jsx` (Workshop story, contact cards, map preview)
- `frontend/src/components/ui/` (`PalettePicker.jsx`, `SoftBackground.jsx`, `Toast.jsx`)
- `frontend/src/styles/base.css`, `frontend/src/styles/tokens.css`, and `frontend/tailwind.config.js`

---

## Design System & Theme Engine

### 1. The 8 Signature Color Palettes (`tokens.css`)
Every UI component must strictly consume CSS variables (`var(--bg)`, `var(--card)`, `var(--ink)`, `var(--mut)`, `var(--acc)`, `var(--acc2)`, `var(--glow)`, `var(--line)`, `var(--radius)`):
1. **`ember`:** Warm amber & incandescent neon glow (the flagship workshop identity).
2. **`ocean`:** Deep cyan & electric neon blue.
3. **`forest`:** Emerald depth with fluorescent lime accents.
4. **`violet`:** High-fashion neon purple & vivid ultraviolet.
5. **`gold`:** Luxurious reflective brass & warm titanium gold (ideal for steel letter showcases).
6. **`rose`:** Elegant metallic rose gold & coral neon.
7. **`teal`:** Deep dark teal with aqua illumination.
8. **`midnight`:** Deep monochrome OLED black with clean moonlight glow.

### 2. Persian RTL & Typography Standards
- Direction is strictly `dir="rtl"`.
- Primary font family is `Vazirmatn`, with fallback to `Tahoma, sans-serif`.
- All displayed numbers (prices, meters, phone numbers, counts, dimensions) must render in Persian glyphs (`۱۲۳۴۵۶۷۸۹۰`).
- Respect logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline-start`) to prevent RTL misalignment.

---

## Component Engineering Directives

### 1. GSAP 3D Coverflow Carousel (`FeaturedSlider.jsx` & `FeaturedSlider.css`)
- **Strict Stacking Context Isolation:** The `.coverflow-container` must always declare `isolation: isolate; z-index: 1;`. Under no circumstances should internal card or edge z-indexes escape to overlap the sticky header.
- **Perspective Physics:**
  - Desktop: `perspective: 900px`, `centerScale: 1.07`, `rotBase: 65deg`.
  - Mobile: `perspective: 700px`, `centerScale: 1.02`, `rotBase: 58deg`.
- **Edge Fades:** `.coverflow-edge-left` and `.coverflow-edge-right` must smoothly gradient into `var(--bg)` and maintain low internal z-indices (`z-index: 15`).
- **Touch & Drag:** Support smooth drag throw with `InertiaPlugin` snap and auto-pause on hover.
- **Interaction:** Clicking side cards glides them to center; clicking the active center card opens the project in `Lightbox`.

### 2. Sticky Header (`Header.jsx`) & Layering Hierarchy
- Always maintain:
  - Header: `position: sticky; top: 0; z-index: 50;`
  - Scrolled state: `-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); background: color-mix(in srgb, var(--bg) 95%, transparent);`
  - High opacity on scroll prevents blurred cards or text underneath from bleeding through the navbar and CTA button.
  - Lightbox / Modals: `z-[60]`
  - Toasts: `z-[70]`

### 3. Portfolio Gallery & Lightbox (`Gallery.jsx`, `Lightbox.jsx`)
- **Grid Responsiveness:** `.grid-gal` uses fluid `minmax(min(100%, 240px), 1fr)` adapting seamlessly across 1 to 4 columns.
- **Card Aesthetics:** High-quality image display with subtle border glow on hover, category pill, and like counter.
- **Direct WhatsApp Order:** The lightbox CTA button formats an encoded WhatsApp URL:
  `https://wa.me/{whatsapp}?text=سلام، درباره «{title}» مشاوره می‌خواهم.`

### 4. GPU-Accelerated Neon Glow Effects
- Use hardware-accelerated CSS properties (`transform`, `opacity`, `filter: drop-shadow`).
- Avoid nested multi-layer `blur(100px)` which degrades framerates on low-end mobile devices.
- Support `prefers-reduced-motion` media queries for accessibility.
