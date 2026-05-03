# FOCO — WordPress theme

A custom WordPress theme that ports the FOCO landing page exactly, adds **dynamic menu** (`wp_nav_menu`), **dynamic logo** (`the_custom_logo()`), and makes **every section editable from the WP admin** via Advanced Custom Fields (ACF).

---

## What you get

| WP feature | How it works in FOCO |
|---|---|
| **Top nav menu** | Native `wp_nav_menu()` — edit at *Appearance → Menus*, assign to "Primary Menu" location |
| **Site logo** | `the_custom_logo()` — upload at *Appearance → Customize → Site Identity → Logo* |
| **Hero, Problem, Insight, Shift, How, Features, Testimonials, Pricing, FAQ, Footer** | All editable via ACF tabs on the front page |
| **Repeaters** for vignettes, steps, feature spotlights, testimonials, pricing tiers, benefits, FAQ items, footer columns | Add / remove / reorder rows from WP admin |
| **Images** | All from WordPress Media Library — no hard-coded URLs |
| **Blog** | `archive.php` + `single.php` styled to match FOCO's dark aesthetic |
| **Other pages** (Privacy, Terms, About) | `page.php` |
| **CSS scoping** | All styles wrapped under `.foco-app` so the theme doesn't leak into the WP admin |
| **Works without ACF** | Theme renders sensible defaults if ACF isn't installed |

---

## Install in 5 minutes

### 1. Zip the theme folder

Zip the `foco-theme/` folder so you have `foco-theme.zip`.

> **Windows:** Right-click `foco-theme` → *Send to → Compressed (zipped) folder*
> **Mac:** Right-click `foco-theme` → *Compress*
> ⚠️ Make sure the zip's **inner folder is named `foco-theme/`** (not the parent's path).

### 2. Install the ACF plugin

In your WP admin:

1. Go to **Plugins → Add New**
2. Search for **"Advanced Custom Fields"** by WP Engine
3. Click **Install Now**, then **Activate**

The free version is enough to start. ACF Pro ($59/yr) is recommended later for nicer field UIs but **not required** — the theme uses repeaters via free ACF where supported, otherwise sub-field arrays.

### 3. Upload and activate the theme

1. Go to **Appearance → Themes → Add New → Upload Theme**
2. Choose `foco-theme.zip` → **Install Now**
3. Click **Activate**

The site will instantly look like the design (with placeholder content).

### 4. Set the front page

WordPress doesn't know yet that the FOCO landing should be your homepage:

1. Go to **Pages → Add New**
2. Title: "Home" — leave content empty — *Publish*
3. Go to **Settings → Reading**
4. Set **"Your homepage displays"** → **A static page**
5. Choose **"Home"** as the homepage
6. Optional: create a "Blog" page and set it as the **Posts page** so blog posts have a dedicated archive URL

### 5. Edit the homepage content

1. Go to **Pages → Home → Edit**
2. Scroll below the page editor — you'll see a panel called **"FOCO Landing Page"** with tabs:
   - Hero
   - Problem
   - Bridge
   - Insight
   - Shift
   - How it works
   - Features
   - Social proof
   - Momentum
   - Pricing
   - FAQ
   - Final CTA
   - Footer
3. Edit any field. Click **Update**. Reload the homepage.

### 6. Set up the menu

1. **Appearance → Menus**
2. Create a new menu (e.g. "Top nav")
3. Add pages, custom links, posts, categories — anything
4. In **Menu Settings**, check **"Primary Menu (top nav)"**
5. Click **Save Menu**

The top nav now uses your menu. You can include anchors like `#features`, `#pricing` to scroll within the homepage, or full URLs to other pages.

### 7. Set up the logo

1. **Appearance → Customize → Site Identity**
2. **Logo** → Select Image → upload your FOCO logo
3. Recommended size: ~240×80, transparent PNG or SVG
4. Click **Publish**

If no custom logo is set, the theme falls back to a styled "F" mark + the site name.

---

## File structure

```
foco-theme/
├── style.css            # Theme metadata + all CSS, scoped under .foco-app
├── functions.php        # Setup, menus, ACF fields, helpers, store-badge SVGs
├── header.php           # <head>, fixed nav with wp_nav_menu + the_custom_logo
├── footer.php           # FOCO footer with editable columns + tagline
├── front-page.php       # The landing page — every section reads from ACF
├── single.php           # Blog post template (dark style)
├── archive.php          # Blog list (categories, tags, date archives)
├── page.php             # Generic page (Privacy, Terms, About, etc.)
├── index.php            # Required fallback
├── README.md            # This file
└── assets/
    ├── images/          # Default mascot states + phone screenshots
    └── js/
        └── main.js      # Nav-scroll behavior + FAQ accordion
```

---

## What's editable, where

### Editable in **WP Admin → Appearance**
- **Menus** → top nav links
- **Customize → Site Identity** → logo, site title
- **Widgets** → (if you add widget areas later)

### Editable in **WP Admin → Pages → Home**
Everything in the FOCO Landing Page ACF panel. Tabs:

#### Hero
- Eyebrow text
- Headline (line 1 white, line 2 gradient purple)
- Subhead
- Micro-CTA pill (HTML allowed)
- Hero mascot image
- Trust line (HTML allowed)
- App Store URL · Google Play URL

#### Problem
- Eyebrow, headline (2 lines)
- Layered intro (3 lines: line 1, line 2, climax)
- Photo of the "paralyzed at desk" scene
- Companion mascot (overlaid on photo)
- Photo caption (HTML allowed)
- Two strikethrough rejection lines
- Truth line (gradient purple punch)
- **Vignettes repeater** — add as many cards as you want with number / headline / body

#### Bridge
- Bridge text (HTML allowed) — the small phrase between Problem and Insight

#### Insight
- Eyebrow, headline parts
- TID box label + name
- Bottom paragraph (HTML allowed)
- Two arrow-quote chips with text
- Closing line
- Insight mascot image

#### Shift
- Eyebrow
- Mascot image
- 2 strikethrough lines + lead-in + key phrase + coda paragraph

#### How it works
- Eyebrow + 2-line headline
- **Steps repeater** — number, phone screenshot, headline, description, optional task chips (one per line)

#### Features (Spotlights)
- Eyebrow + 2-line headline + subhead
- **Spotlights repeater** — badge, headline parts, body, CTA text, CTA link, phone screenshot
- Layout auto-alternates (1st right, 2nd left, 3rd right, …)

#### Social proof
- Eyebrow + 2-line headline
- **Testimonials repeater** — photo, name, country code, location, quote, role
- Big stat number + label

#### Momentum
- Eyebrow + 2-line headline (orange gradient on 2nd part)
- 2 stack lines + 2-part punch line (orange gradient on 2nd part)
- Mascot image
- Subhead (HTML allowed)

#### Pricing
- Eyebrow + risk-reversal hook + headline + subhead
- **Pricing tiers repeater** — featured?, name, optional pill, save badge, amount, period, equivalent line, tagline, **benefits sub-repeater**, CTA text/link
- Coda quote pill

#### FAQ
- Eyebrow + 2-line headline
- Optional decorative corner mascot
- **FAQ items repeater** — question (text), answer (WYSIWYG editor)

#### Final CTA
- Eyebrow + headline parts + punch line

#### Footer
- Tagline
- **Footer columns repeater** — heading + sub-repeater of links
- Copyright line + right-side line

---

## Fallback behavior (works without ACF)

If you uninstall ACF or haven't filled in fields, the theme uses sensible defaults baked into the templates so the page never breaks. Field-by-field defaults match the original design copy.

---

## Customizing styles

CSS lives in `style.css`, scoped under `.foco-app`. To change brand colors site-wide, edit the CSS variables at the top:

```css
:root {
  --foco-bg: #040208;
  --foco-bg-2: #0a0410;
  --foco-primary: #7C3AED;
  --foco-primary-2: #A78BFA;
  --foco-celebrate: #FB923C;
  ...
}
```

---

## Troubleshooting

**The ACF panel doesn't show on the front page.**
ACF field group is attached to the *front page* type. Make sure you've set **Settings → Reading → Your homepage displays → A static page**, and the page is selected. Then edit *that page*, not the blog page.

**Logo isn't showing.**
Re-upload at *Appearance → Customize → Site Identity*. If still missing, check the file's max-height isn't being clipped by other CSS — the theme caps logo at 36px tall in the nav. Adjust `.foco-app .logo img { max-height: 36px; }` in `style.css` if you need taller.

**Menu items aren't showing.**
Make sure the menu is assigned to the **"Primary Menu (top nav)"** location in *Appearance → Menus → Menu Settings*.

**Photos look stretched / cropped weirdly.**
Use images at least 1200px wide. Phone screenshots should be portrait (e.g., 1260×2736 like the FOCO ASO screens included in `assets/images/`). Mascots should have transparent backgrounds (PNG with alpha).

**My change didn't appear.**
Hard-refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac). If you're using a caching plugin (W3 Total Cache, WP Rocket, etc.), purge the cache.

---

## Recommended future tweaks

- **Replace stock testimonial photos** with real users (with consent). The defaults reference Pravatar URLs which are real strangers' photos — fine for staging, **not for production**.
- **Replace the Unsplash placeholder photo** in the Problem section with a custom or licensed shot.
- **Add a real verifiable stat** to the "Big stat" card (currently a placeholder number).
- Install a **performance plugin** (WP Rocket, W3 Total Cache, or Cloudflare) — Elementor-free themes still benefit from object caching and lazy-loading.
- Consider **converting mascot PNGs to WebP** for better performance — WP plugins like ShortPixel automate this.

---

## Built with

- WordPress 6.x
- ACF (Advanced Custom Fields) — free version
- Vanilla PHP / CSS / JS — no Elementor, no React, no build step
- Inter font from Google Fonts
- Mascot illustrations + ASO screenshots from your existing brand assets

If anything breaks or looks off after install, open the file you need help with and ping the dev who built this for you.
