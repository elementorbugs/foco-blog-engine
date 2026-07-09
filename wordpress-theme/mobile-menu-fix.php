<?php
/**
 * Mobile menu fix — submenu collapse + toggle
 * Adds CSS to hide submenus by default on mobile + JS to toggle them on tap.
 * Drop this code into the END of functions.php
 */
add_action('wp_footer', function () { ?>
<style>
/* Mobile: submenus collapsed by default */
@media (max-width: 900px) {
  .foco-app .foco-nav.open .nav-links {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(4, 2, 8, 0.98);
    backdrop-filter: blur(14px);
    padding: 16px 24px 24px;
    gap: 0;
    border-bottom: 1px solid var(--stroke);
  }
  .foco-app .nav-links > li {
    padding: 12px 0;
    border-bottom: 1px solid rgba(167,139,250,0.1);
  }
  .foco-app .nav-links > li:last-child {
    border-bottom: none;
  }
  /* Parent menu items with children */
  .foco-app .menu-item-has-children > a {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .foco-app .menu-item-has-children > a::after {
    content: "▾";
    font-size: 14px;
    color: var(--primary-2);
    transition: transform 0.2s ease;
  }
  .foco-app .menu-item-has-children.is-open > a::after {
    transform: rotate(180deg);
  }
  /* Submenu collapsed by default */
  .foco-app .sub-menu {
    display: none;
    list-style: none;
    padding: 12px 0 4px 16px;
    margin: 0;
  }
  .foco-app .menu-item-has-children.is-open > .sub-menu {
    display: block;
  }
  .foco-app .sub-menu li {
    padding: 8px 0;
    border-bottom: none;
  }
  .foco-app .sub-menu a {
    font-size: 14px;
    color: var(--muted);
  }
}
</style>
<script>
(function () {
  var nav = document.getElementById('foco-nav');
  var toggle = document.getElementById('foco-nav-toggle');
  if (!nav || !toggle) return;

  // Main nav open/close
  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    var isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Submenu toggle on mobile: tap parent → open/close instead of navigating
  var parentItems = nav.querySelectorAll('.menu-item-has-children > a');
  parentItems.forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth > 900) return; // desktop: let link work normally
      var li = link.parentElement;
      // If menu just opened, first tap opens submenu (not navigate)
      if (!li.classList.contains('is-open')) {
        e.preventDefault();
        // Close other open submenus
        nav.querySelectorAll('.menu-item-has-children.is-open').forEach(function (other) {
          if (other !== li) other.classList.remove('is-open');
        });
        li.classList.add('is-open');
      } else {
        // Second tap: close submenu (and don't navigate either — user can tap a sub-item)
        e.preventDefault();
        li.classList.remove('is-open');
      }
    });
  });

  // Close menu when user clicks a sub-link (navigation happens)
  nav.querySelectorAll('.sub-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}());
</script>
<?php });
