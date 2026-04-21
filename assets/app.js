/* =========================================================
   PEACE OF MIND® V3 — app.js
   Navigation · Cart · Scroll · Animations
   ========================================================= */

// ── CART STATE ────────────────────────────────────────────
window.POM = window.POM || {};

(function() {
  let _items = JSON.parse(sessionStorage.getItem('pom_cart') || '[]');

  function save() {
    sessionStorage.setItem('pom_cart', JSON.stringify(_items));
    updateCartBadge();
  }

  function updateCartBadge() {
    const total = _items.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('#cartCount, .cart-count').forEach(el => {
      el.textContent = total;
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 300);
    });
  }

  POM.cart = {
    get items() { return _items; },
    add(item) {
      const existing = _items.find(i => i.id === item.id);
      if (existing) { existing.qty += 1; }
      else { _items.push({ ...item, qty: 1 }); }
      save();
      showToast(`${item.name} ajouté au panier`);
    },
    remove(id) {
      _items = _items.filter(i => i.id !== id);
      save();
    },
    updateQty(id, delta) {
      const item = _items.find(i => i.id === id);
      if (!item) return;
      item.qty = Math.max(1, item.qty + delta);
      save();
    },
    clear() {
      _items = [];
      save();
    }
  };

  // Init badge on load
  document.addEventListener('DOMContentLoaded', updateCartBadge);
})();

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('is-visible');
  setTimeout(() => toast.classList.remove('is-visible'), duration);
}

// ── ADD TO CART BUTTONS ───────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const id    = this.dataset.id;
      const name  = this.dataset.name;
      const price = parseInt(this.dataset.price);
      POM.cart.add({ id, name, price });
    });
  });
});

// ── MOBILE NAV ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('navToggle');
  const nav    = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function() {
    const open = nav.classList.toggle('is-open');
    this.setAttribute('aria-expanded', String(open));
    this.textContent = open ? 'Fermer' : 'Menu';
  });

  document.addEventListener('click', function(e) {
    if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
    }
  });
});

// ── HEADER SCROLL HIDE/SHOW ───────────────────────────────
(function() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  let lastY = 0, ticking = false;

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < 80) {
          header.classList.remove('is-hidden');
          header.classList.remove('is-scrolled');
        } else {
          header.classList.add('is-scrolled');
          if (delta > 8) header.classList.add('is-hidden');
          else if (delta < -8) header.classList.remove('is-hidden');
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ── INTERSECTION OBSERVER (fade-up) ──────────────────────
document.addEventListener('DOMContentLoaded', function() {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
});
