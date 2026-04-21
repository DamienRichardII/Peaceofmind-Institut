/* =========================================================
   PEACE OF MIND® V3 — intro.js
   Animation d'ouverture : ouverture de page → logo → hero
   Stack : GSAP (CDN) + Three.js (CDN) via scripts inline
   ========================================================= */

(function() {
  'use strict';

  const overlay = document.getElementById('intro-overlay');
  const logoEl  = document.getElementById('introLogo');
  const canvas  = document.getElementById('introCanvas');
  const hero    = document.getElementById('heroSection');

  if (!overlay || !logoEl) return;

  // ── sessionStorage skip ──────────────────────────────────
  if (sessionStorage.getItem('pom_intro_done')) {
    overlay.classList.add('is-done');
    return;
  }

  // ── Charge GSAP + Three.js puis lance l'animation ────────
  function loadScript(src, cb) {
    const s = document.createElement('script');
    s.src = src; s.onload = cb;
    document.head.appendChild(s);
  }

  function startIntro() {
    if (typeof gsap === 'undefined') {
      // Fallback si GSAP non chargé
      fallbackIntro();
      return;
    }

    const hasWebGL = (function() {
      try { return !!document.createElement('canvas').getContext('webgl'); } catch(e) { return false; }
    })();

    if (hasWebGL && typeof THREE !== 'undefined' && canvas && window.innerWidth > 600) {
      runThreeAnimation();
    } else {
      runSimpleAnimation();
    }
  }

  // ── Three.js : surface papier qui s'entrouvre ────────────
  function runThreeAnimation() {
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    canvas.style.display = 'block';

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.z = 3.2;

    // Couleur de fond = var(--cream)
    renderer.setClearColor(0xfaf6f1, 1);

    // Matière papier — plan géométrie droite (page gauche)
    const geo = new THREE.PlaneGeometry(2.4, 3.2, 40, 40);
    const mat = new THREE.MeshLambertMaterial({
      color: 0xf3ede4,
      side: THREE.DoubleSide,
    });
    const page = new THREE.Mesh(geo, mat);
    scene.add(page);

    // Lumière douce
    const ambient = new THREE.AmbientLight(0xfdf5ec, 0.8);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xfdf5ec, 0.6);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // État initial : page un peu pliée, légèrement inclinée
    page.rotation.y = -0.15;
    page.rotation.x = 0.04;
    page.position.x = 0;

    // Déformation des vertices pour simuler une légère courbure de couverture
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = Math.sin((x + 1.2) * Math.PI * 0.4) * 0.06;
      positions.setZ(i, z);
    }
    positions.needsUpdate = true;

    let animFrame;
    function tick() {
      animFrame = requestAnimationFrame(tick);
      renderer.render(scene, camera);
    }
    tick();

    // Timeline GSAP
    const tl = gsap.timeline({
      onComplete: () => {
        cancelAnimationFrame(animFrame);
        renderer.dispose();
        finish();
      }
    });

    // Étape 1 : page s'entrouvre (0 → 0.8s)
    tl.to(page.rotation, { y: 0.8, duration: 0.9, ease: 'power2.inOut' }, 0)
      .to(page.position, { x: -0.6, duration: 0.9, ease: 'power2.inOut' }, 0)
      .to(page.material, { opacity: 0, transparent: true, duration: 0.3, ease: 'power1.in' }, 0.65);

    // Étape 2 : logo apparaît (0.5s → 1.2s)
    tl.fromTo(logoEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0.55);

    // Étape 3 : logo disparaît + overlay sort (1.2s → 1.9s)
    tl.to(logoEl, { opacity: 0, y: -8, duration: 0.4, ease: 'power2.in' }, 1.3)
      .to(overlay, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 1.5);
  }

  // ── Simple : fade only (fallback mobile + no-webgl) ──────
  function runSimpleAnimation() {
    if (!canvas) {} else { canvas.style.display = 'none'; }

    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(logoEl, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.15)
      .to(logoEl, { opacity: 0, y: -10, duration: 0.5, ease: 'power2.in' }, 1.0)
      .to(overlay, { opacity: 0, duration: 0.5 }, 1.2);
  }

  // ── Fallback sans GSAP ────────────────────────────────────
  function fallbackIntro() {
    if (canvas) canvas.style.display = 'none';
    setTimeout(finish, 1800);
  }

  // ── Nettoyage final ───────────────────────────────────────
  function finish() {
    overlay.classList.add('is-done');
    sessionStorage.setItem('pom_intro_done', '1');
    if (hero) {
      hero.style.opacity = '0';
      hero.style.transition = 'opacity 0.6s ease';
      requestAnimationFrame(() => { hero.style.opacity = '1'; });
    }
    // Trigger intersection observer pour les éléments déjà visibles
    window.dispatchEvent(new Event('scroll'));
  }

  // ── Chargement des libs puis démarrage ───────────────────
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', function() {
    if (typeof THREE !== 'undefined') {
      startIntro();
    } else {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', startIntro);
    }
  });

})();
