(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const LS = {
    settings: "pom_admin_settings",
    bookings: "pom_bookings",
    cart: "pom_cart",
    bookingSubmissions: "pom_booking_submissions",
  };

  const defaultSettings = {
    intervalMin: 15,
    days: {
      0: { enabled: false, start: "10:00", end: "16:00" }, // Sunday
      1: { enabled: true,  start: "09:00", end: "19:00" }, // Monday
      2: { enabled: true,  start: "09:00", end: "19:00" },
      3: { enabled: true,  start: "09:00", end: "19:00" },
      4: { enabled: true,  start: "09:00", end: "19:00" },
      5: { enabled: true,  start: "09:00", end: "19:00" },
      6: { enabled: true,  start: "10:00", end: "16:00" }, // Saturday
    },
    exceptions: [], // ["YYYY-MM-DD"]
  };

  const state = {
    services: [],
    filter: "all",
    selectedService: null,
    selectedDate: null, // Date
    selectedSlot: null, // {start: Date, end: Date}
    monthCursor: new Date(),
    settings: null,
    cart: [],
    bookings: [],
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function euro(n) {
    const v = (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
    return `${v} €`;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function ymd(d) {
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function hm(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  function parseHM(s) {
    const [h,m] = s.split(":").map(Number);
    return { h, m };
  }

  function addMinutes(date, min) {
    return new Date(date.getTime() + min*60000);
  }

  function clampToMidnight(d) {
    const x = new Date(d);
    x.setHours(0,0,0,0);
    return x;
  }

  function sameDay(a,b){
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  function isPastDate(d){
    const today = clampToMidnight(new Date());
    return clampToMidnight(d) < today;
  }

  function overlaps(aStart, aEnd, bStart, bEnd){
    return aStart < bEnd && bStart < aEnd;
  }

  async function loadServices() {
    // In "file://" mode, browsers can block fetch(). We embed a safe fallback.
    const embedded = [{"id": "ess_nailart", "category": "ESSENTIEL", "group": "Essentiel", "name": "Nail art • par ongle", "durationMin": 5, "priceEur": 0.0, "description": "À sélectionner avec une prestation ongles."}, {"id": "ess_questionnaire", "category": "ESSENTIEL", "group": "Essentiel", "name": "Questionnaire médical (avant soin)", "durationMin": 5, "priceEur": 0.0, "description": "À remplir le jour du rendez-vous."}, {"id": "ess_bilan", "category": "ESSENTIEL", "group": "Essentiel", "name": "Bilan pré-soin (peau)", "durationMin": 10, "priceEur": 15.0, "description": "Évaluation rapide, conseils personnalisés."}, {"id": "soin_microneedling_face", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Microneedling visage", "durationMin": 45, "priceEur": 80.0, "description": "Soin profond personnalisé."}, {"id": "soin_microneedling_face_neck", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Microneedling visage et cou", "durationMin": 60, "priceEur": 100.0, "description": ""}, {"id": "soin_peeling_acne", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Peeling : No more acne", "durationMin": 40, "priceEur": 80.0, "description": "À base d’acide glycolique."}, {"id": "soin_peeling_glow", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Peeling : Glow peel", "durationMin": 40, "priceEur": 100.0, "description": ""}, {"id": "soin_peeling_melano", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Peeling : Melano peel", "durationMin": 40, "priceEur": 100.0, "description": "Lutte contre l’hyperpigmentation."}, {"id": "soin_peeling_rice", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Peeling : Rice peel", "durationMin": 40, "priceEur": 120.0, "description": ""}, {"id": "soin_aquagold", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Aqua gold", "durationMin": 50, "priceEur": 120.0, "description": ""}, {"id": "soin_newskin", "category": "SOINS", "group": "Soins profonds • Visage", "name": "New skin", "durationMin": 80, "priceEur": 150.0, "description": "Soin profond + jelly mask."}, {"id": "soin_plasmalift_face", "category": "SOINS", "group": "Soins profonds • Visage", "name": "Plasma lift", "durationMin": 60, "priceEur": 190.0, "description": "Technique non invasive."}, {"id": "corps_jellyv", "category": "SOINS", "group": "Soins profonds • Corps", "name": "Jelly V • Soin pubis", "durationMin": 45, "priceEur": 85.0, "description": "Poils incarnés & hyperpigmentation."}, {"id": "corps_jellyb", "category": "SOINS", "group": "Soins profonds • Corps", "name": "Jelly B • Soin fessier", "durationMin": 45, "priceEur": 90.0, "description": "Boutons, cellulite & hyperpigmentation."}, {"id": "corps_torsoneedling", "category": "SOINS", "group": "Soins profonds • Corps", "name": "Torso needling", "durationMin": 60, "priceEur": 100.0, "description": "Microneedling dos ou torse."}, {"id": "corps_aquagold", "category": "SOINS", "group": "Soins profonds • Corps", "name": "Aqua gold corps", "durationMin": 60, "priceEur": 120.0, "priceFrom": true, "description": "Microneedling traditionnel + feuilles d’or."}, {"id": "corps_plasmalift", "category": "SOINS", "group": "Soins profonds • Corps", "name": "Plasma lift corps", "durationMin": 60, "priceEur": 190.0, "priceFrom": true, "description": ""}, {"id": "pig_grain", "category": "PIGMENTATION", "group": "Freckles & Grain de beauté", "name": "Grain de beauté", "durationMin": 30, "priceEur": 50.0, "description": ""}, {"id": "pig_freckles_nez", "category": "PIGMENTATION", "group": "Freckles & Grain de beauté", "name": "Freckles NEZ", "durationMin": 45, "priceEur": 69.0, "description": "Pigments vegan — effet naturel."}, {"id": "pig_freckles_nez_pom", "category": "PIGMENTATION", "group": "Freckles & Grain de beauté", "name": "Freckles NEZ & POMMETTES", "durationMin": 90, "priceEur": 90.0, "description": ""}, {"id": "pig_freckles_visage", "category": "PIGMENTATION", "group": "Freckles & Grain de beauté", "name": "Freckles VISAGE", "durationMin": 120, "priceEur": 120.0, "description": ""}, {"id": "pig_ret_grain", "category": "PIGMENTATION", "group": "Retouches", "name": "Retouche grain de beauté", "durationMin": 20, "priceEur": 25.0, "description": ""}, {"id": "pig_ret_nez", "category": "PIGMENTATION", "group": "Retouches", "name": "Retouche NEZ", "durationMin": 60, "priceEur": 35.0, "description": ""}, {"id": "pig_ret_nez_pom", "category": "PIGMENTATION", "group": "Retouches", "name": "Retouche NEZ & POMMETTES", "durationMin": 40, "priceEur": 45.0, "description": ""}, {"id": "pig_ret_visage", "category": "PIGMENTATION", "group": "Retouches", "name": "Retouche VISAGE", "durationMin": 45, "priceEur": 60.0, "description": ""}, {"id": "blanchiment_1", "category": "SOINS", "group": "Blanchiment dentaire", "name": "Blanchiment dentaire • 1 séance", "durationMin": 60, "priceEur": 140.0, "description": "Soin esthétique du sourire."}, {"id": "ongles_pose_sm", "category": "ONGLES", "group": "Pose complète gel", "name": "Taille S ou M (pose complète)", "durationMin": 110, "priceEur": 60.0, "description": ""}, {"id": "ongles_pose_l", "category": "ONGLES", "group": "Pose complète gel", "name": "Taille L (pose complète)", "durationMin": 120, "priceEur": 70.0, "description": ""}, {"id": "ongles_pose_xl", "category": "ONGLES", "group": "Pose complète gel", "name": "Taille XL &+ (pose complète)", "durationMin": 135, "priceEur": 80.0, "description": ""}, {"id": "ongles_fill_sm", "category": "ONGLES", "group": "Remplissage gel", "name": "Taille S ou M (remplissage)", "durationMin": 90, "priceEur": 50.0, "description": ""}, {"id": "ongles_fill_l", "category": "ONGLES", "group": "Remplissage gel", "name": "Taille L (remplissage)", "durationMin": 90, "priceEur": 60.0, "description": ""}, {"id": "ongles_fill_xl", "category": "ONGLES", "group": "Remplissage gel", "name": "Taille XL &+ (remplissage)", "durationMin": 90, "priceEur": 128.0, "description": ""}, {"id": "ongles_gainage", "category": "ONGLES", "group": "Manucure soin & gel", "name": "Gainage gel", "durationMin": 80, "priceEur": 72.0, "description": ""}, {"id": "ongles_semi", "category": "ONGLES", "group": "Manucure soin & gel", "name": "Semi-permanent", "durationMin": 30, "priceEur": 36.0, "description": ""}, {"id": "ongles_manicare", "category": "ONGLES", "group": "Manucure soin & gel", "name": "Mani Care • Soin", "durationMin": 20, "priceEur": 19.0, "description": ""}, {"id": "na_sticker", "category": "ONGLES", "group": "Nail art • options", "name": "Sticker ou strass (par ongle)", "durationMin": 10, "priceEur": 0.5, "description": ""}, {"id": "na_chrome", "category": "ONGLES", "group": "Nail art • options", "name": "Chrome (par ongle)", "durationMin": 15, "priceEur": 1.0, "description": ""}, {"id": "na_cat", "category": "ONGLES", "group": "Nail art • options", "name": "Cat eye (par ongle)", "durationMin": 15, "priceEur": 1.0, "description": ""}, {"id": "na_french", "category": "ONGLES", "group": "Nail art • options", "name": "French (par ongle)", "durationMin": 15, "priceEur": 1.0, "description": ""}, {"id": "na_baby", "category": "ONGLES", "group": "Nail art • options", "name": "Baby boomer (par ongle)", "durationMin": 20, "priceEur": 1.0, "description": ""}, {"id": "na_marbre", "category": "ONGLES", "group": "Nail art • options", "name": "Marbre / Animalier / 3D (par ongle)", "durationMin": 25, "priceEur": 2.0, "description": ""}, {"id": "na_casse", "category": "ONGLES", "group": "Nail art • options", "name": "Ongle cassé", "durationMin": 5, "priceEur": 3.0, "description": ""}, {"id": "na_forme", "category": "ONGLES", "group": "Nail art • options", "name": "Changement de forme", "durationMin": 10, "priceEur": 5.0, "description": ""}, {"id": "dep_gel", "category": "ONGLES", "group": "Dépose", "name": "Dépose gel avec soin", "durationMin": 30, "priceEur": 25.0, "description": ""}, {"id": "dep_semi_repose", "category": "ONGLES", "group": "Dépose", "name": "Dépose semi-permanent SI repose", "durationMin": 15, "priceEur": 0.0, "description": "Gratuit."}, {"id": "dep_semi", "category": "ONGLES", "group": "Dépose", "name": "Dépose semi-permanent SANS repose", "durationMin": 15, "priceEur": 7.0, "description": ""}, {"id": "pedi_gainage", "category": "ONGLES", "group": "Pédicure", "name": "Gainage gel (pieds)", "durationMin": 45, "priceEur": 45.0, "description": ""}, {"id": "pedi_semi", "category": "ONGLES", "group": "Pédicure", "name": "Semi-permanent (pieds)", "durationMin": 40, "priceEur": 36.0, "description": ""}, {"id": "pedi_depose", "category": "ONGLES", "group": "Pédicure", "name": "Dépose semi-permanent (pieds)", "durationMin": 15, "priceEur": 7.0, "description": ""}, {"id": "infusion_tasting", "category": "INFUSIONS", "group": "Infusions", "name": "Infusion dégustation (sur place)", "durationMin": 10, "priceEur": 4.0, "description": "Infusions de fleurs véritables."}, {"id": "infusion_coffret", "category": "INFUSIONS", "group": "Infusions", "name": "Coffret d’infusions (boutique)", "durationMin": 10, "priceEur": 24.0, "description": "Sélection délicate — santé & réconfort."}];
    try {
      const res = await fetch("./assets/services.json", { cache: "no-store" });
      const data = await res.json();
      state.services = (data.services && Array.isArray(data.services)) ? data.services : embedded;
    } catch {
      state.services = embedded;
    }
  }

  function loadStateFromStorage() {
    state.settings = loadJSON(LS.settings, defaultSettings);
    state.bookings = loadJSON(LS.bookings, []);
    state.cart = loadJSON(LS.cart, []);
  }

  function persistCart() { saveJSON(LS.cart, state.cart); }
  function persistBookings() { saveJSON(LS.bookings, state.bookings); }

  // ----- Services UI
  function serviceMatchesFilter(s) {
    if (state.filter === "all") return true;
    return s.category === state.filter;
  }

  function renderServices() {
    const root = $("#servicesList");
    if (!root) return;
    const list = state.services.filter(serviceMatchesFilter);

    const byGroup = {};
    list.forEach(s => {
      const k = s.group || "Prestations";
      (byGroup[k] ||= []).push(s);
    });

    root.innerHTML = Object.entries(byGroup).map(([group, items]) => {
      const cards = items.map(s => {
        const selected = state.selectedService && state.selectedService.id === s.id;
        const price = (s.priceEur === 0) ? "Gratuit" : euro(s.priceEur);
        const from = s.priceFrom ? "à partir de " : "";
        return `
          <button class="service-card ${selected ? "is-selected" : ""}" type="button" data-service="${s.id}">
            <div class="service-card__top">
              <span class="service-card__name">${escapeHtml(s.name)}</span>
              <span class="service-card__price">${from}${price}</span>
            </div>
            <div class="service-card__meta">
              <span>${s.durationMin} min</span>
              <span class="dot">•</span>
              <span>${escapeHtml(s.category)}</span>
            </div>
            ${s.description ? `<div class="service-card__desc">${escapeHtml(s.description)}</div>` : ""}
          </button>
        `;
      }).join("");

      return `
        <div class="service-group">
          <h3 class="service-group__title">${escapeHtml(group)}</h3>
          <div class="service-grid">${cards}</div>
        </div>
      `;
    }).join("");

    $$(".service-card", root).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-service");
        const s = state.services.find(x => x.id === id);
        state.selectedService = s || null;
        state.selectedSlot = null;
        renderSelectedService();
        renderCalendar();
        renderTimeslots();
        syncActionButtons();
      });
    });
  }

  function renderSelectedService() {
    const box = $("#selectedService");
    if (!box) return;

    if (!state.selectedService) {
      box.innerHTML = `<p class="muted">Aucune prestation sélectionnée.</p>`;
      return;
    }

    const s = state.selectedService;
    const price = (s.priceEur === 0) ? "Gratuit" : euro(s.priceEur);
    box.innerHTML = `
      <div class="selected-service__card">
        <div>
          <p class="selected-service__kicker">Sélection</p>
          <p class="selected-service__name">${escapeHtml(s.name)}</p>
          <p class="selected-service__meta">${escapeHtml(s.group || s.category)} • ${s.durationMin} min</p>
        </div>
        <div class="selected-service__price">${s.priceFrom ? "à partir de " : ""}${price}</div>
      </div>
    `;
  }

  // ----- Calendar
  function isWorkingDay(date) {
    const day = date.getDay();
    const dset = state.settings.days[String(day)];
    if (!dset || !dset.enabled) return false;
    const iso = ymd(date);
    if ((state.settings.exceptions || []).includes(iso)) return false;
    return true;
  }

  function renderCalendar() {
    const root = $("#calendar");
    if (!root) return;

    const cursor = new Date(state.monthCursor);
    cursor.setDate(1);
    cursor.setHours(0,0,0,0);

    const monthName = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const startDay = (cursor.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0).getDate();

    const prev = new Date(cursor.getFullYear(), cursor.getMonth()-1, 1);
    const next = new Date(cursor.getFullYear(), cursor.getMonth()+1, 1);

    const today = clampToMidnight(new Date());

    const cells = [];
    for (let i=0; i<startDay; i++) cells.push(`<div class="cal-cell cal-cell--empty"></div>`);
    for (let d=1; d<=daysInMonth; d++){
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      date.setHours(0,0,0,0);
      const disabled = isPastDate(date) || !isWorkingDay(date);
      const selected = state.selectedDate && sameDay(state.selectedDate, date);
      const isToday = sameDay(today, date);

      cells.push(`
        <button class="cal-cell ${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""}" type="button"
                data-date="${ymd(date)}" ${disabled ? "disabled" : ""} aria-label="${date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}">
          <span>${d}</span>
        </button>
      `);
    }

    root.innerHTML = `
      <div class="cal-head">
        <button class="icon-btn" type="button" data-cal="prev" aria-label="Mois précédent">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="cal-title">${capitalize(monthName)}</div>
        <button class="icon-btn" type="button" data-cal="next" aria-label="Mois suivant">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="cal-week">
        <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
      </div>
      <div class="cal-grid">${cells.join("")}</div>
      <p class="fineprint">Les jours grisés sont indisponibles.</p>
    `;

    $("[data-cal='prev']", root).addEventListener("click", () => {
      state.monthCursor = prev;
      renderCalendar();
    });
    $("[data-cal='next']", root).addEventListener("click", () => {
      state.monthCursor = next;
      renderCalendar();
    });

    $$(".cal-cell[data-date]", root).forEach(btn => {
      btn.addEventListener("click", () => {
        const iso = btn.getAttribute("data-date");
        const [Y,M,D] = iso.split("-").map(Number);
        const date = new Date(Y, M-1, D);
        date.setHours(0,0,0,0);
        state.selectedDate = date;
        state.selectedSlot = null;
        renderCalendar();
        renderTimeslots();
        syncActionButtons();
      });
    });
  }

  function renderTimeslots() {
    const root = $("#timeslots");
    if (!root) return;

    if (!state.selectedService) {
      root.innerHTML = `<p class="muted">Sélectionnez d’abord une prestation.</p>`;
      return;
    }
    if (!state.selectedDate) {
      root.innerHTML = `<p class="muted">Choisissez une date.</p>`;
      return;
    }

    const date = state.selectedDate;
    const day = date.getDay();
    const dset = state.settings.days[String(day)];
    const { h:sh, m:sm } = parseHM(dset.start);
    const { h:eh, m:em } = parseHM(dset.end);

    const start = new Date(date); start.setHours(sh, sm, 0, 0);
    const end = new Date(date); end.setHours(eh, em, 0, 0);

    const step = Number(state.settings.intervalMin || 15);
    const dur = Number(state.selectedService.durationMin || 30);
    const now = new Date();

    const slots = [];
    for (let t = new Date(start); addMinutes(t, dur) <= end; t = addMinutes(t, step)) {
      const slotEnd = addMinutes(t, dur);
      const disabled = (sameDay(t, now) && t < now) || isBooked(t, slotEnd);
      const selected = state.selectedSlot && state.selectedSlot.start.getTime() === t.getTime();
      slots.push(`
        <button class="slot ${selected ? "is-selected" : ""}" type="button" data-time="${hm(t)}" ${disabled ? "disabled" : ""}>
          ${hm(t)}
        </button>
      `);
    }

    root.innerHTML = slots.length
      ? `<div class="slot-grid">${slots.join("")}</div>`
      : `<p class="muted">Aucun créneau disponible pour cette date.</p>`;

    $$(".slot[data-time]", root).forEach(btn => {
      btn.addEventListener("click", () => {
        const time = btn.getAttribute("data-time");
        const { h, m } = parseHM(time);
        const s = new Date(state.selectedDate);
        s.setHours(h, m, 0, 0);
        const e = addMinutes(s, dur);
        state.selectedSlot = { start: s, end: e };
        renderTimeslots();
        syncActionButtons();
      });
    });
  }

  function isBooked(start, end) {
    const iso = ymd(start);
    return state.bookings.some(b => {
      if (b.date !== iso) return false;
      const bs = new Date(`${b.date}T${b.start}:00`);
      const be = new Date(`${b.date}T${b.end}:00`);
      return overlaps(start, end, bs, be);
    });
  }

  // ----- Cart & checkout
  function syncActionButtons() {
    const addBtn = $("#addToCartBtn");
    const ok = Boolean(state.selectedService && state.selectedDate && state.selectedSlot);
    addBtn.disabled = !ok;
    addBtn.textContent = ok ? "Ajouter au panier" : "Ajouter au panier";
  }

  function cartCount() {
    return state.cart.reduce((acc, it) => acc + (it.qty || 1), 0);
  }

  function cartTotal() {
    return state.cart.reduce((acc, it) => acc + (it.priceEur * (it.qty || 1)), 0);
  }

  function updateCartUI() {
    const count = cartCount();
    $("#cartCount").textContent = String(count);

    const items = $("#cartItems");
    if (state.cart.length === 0) {
      items.innerHTML = `<p class="muted">Votre panier est vide.</p>`;
    } else {
      items.innerHTML = state.cart.map((it, idx) => `
        <div class="cart-item">
          <div>
            <p class="cart-item__name">${escapeHtml(it.name)}</p>
            <p class="cart-item__meta">${escapeHtml(it.date)} • ${escapeHtml(it.start)} → ${escapeHtml(it.end)} • ${it.durationMin} min</p>
          </div>
          <div class="cart-item__right">
            <div class="cart-item__price">${it.priceEur === 0 ? "Gratuit" : euro(it.priceEur)}</div>
            <button class="link danger" type="button" data-remove="${idx}">Retirer</button>
          </div>
        </div>
      `).join("");
      $$("[data-remove]", items).forEach(btn => {
        btn.addEventListener("click", () => {
          const i = Number(btn.getAttribute("data-remove"));
          state.cart.splice(i, 1);
          persistCart();
          updateCartUI();
          syncCheckoutButton();
        });
      });
    }

    $("#cartTotal").textContent = euro(cartTotal());
    syncCheckoutButton();
  }

  function syncCheckoutButton() {
    $("#checkoutBtn").disabled = state.cart.length === 0;
  }

  function addToCart() {
    const s = state.selectedService;
    const slot = state.selectedSlot;
    if (!s || !slot) return;

    const item = {
      id: cryptoId(),
      serviceId: s.id,
      name: s.name,
      durationMin: s.durationMin,
      priceEur: Number(s.priceEur || 0),
      date: ymd(slot.start),
      start: hm(slot.start),
      end: hm(slot.end),
    };

    state.cart = [item]; // 1 réservation à la fois (V2)
    persistCart();
    updateCartUI();
    openDrawer();

    toast("Ajouté au panier.");
  }

  function openDrawer() {
    const el = $("#cartDrawer");
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    const el = $("#cartDrawer");
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  function openModal() {
    const el = $("#checkoutModal");
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    const el = $("#checkoutModal");
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  function getConfigValue(key, fallback) {
    return (window.POM_CONFIG && window.POM_CONFIG[key]) || fallback;
  }

  function appendLocalSubmission(key, payload) {
    const current = loadJSON(key, []);
    current.unshift(payload);
    saveJSON(key, current.slice(0, 20));
  }

  async function postStaticForm(endpoint, payload) {
    if (!endpoint) throw new Error("Endpoint non configuré");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Envoi impossible");
    return res;
  }

  function setSubmitState(form, isSending) {
    const btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    btn.disabled = isSending;
    btn.textContent = isSending ? "Envoi en cours…" : "Envoyer ma demande";
  }

  function wireDrawer() {
    $("#cartFab").addEventListener("click", openDrawer);
    $$("[data-close]", $("#cartDrawer")).forEach(el => el.addEventListener("click", closeDrawer));
    $$("[data-close]", $("#checkoutModal")).forEach(el => el.addEventListener("click", closeModal));

    $("#checkoutBtn").addEventListener("click", () => {
      closeDrawer();
      openModal();
    });

    $("#addToCartBtn").addEventListener("click", addToCart);

    // payment method toggle
    const form = $("#checkoutForm");
    form.addEventListener("change", (e) => {
      if (e.target.name !== "pm") return;
      const v = e.target.value;
      const cardBox = $("#cardBox");
      if (cardBox) {
        cardBox.style.display = (v === "Carte bancaire" || v === "Empreinte bancaire") ? "block" : "none";
      }
    });

    form.dataset.loadedAt = String(Date.now());
    let isSubmitting = false;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isSubmitting || state.cart.length === 0) return;

      const fd = new FormData(form);
      const honeypot = (fd.get("website") || "").toString().trim();
      const loadedAt = Number(form.dataset.loadedAt || Date.now());
      if (honeypot || Date.now() - loadedAt < 2000) {
        toast("Votre demande n’a pas pu être envoyée automatiquement. Merci de contacter l’institut via la page Contact.");
        return;
      }

      const bookingMeta = {
        name: (fd.get("name") || "").toString().trim(),
        email: (fd.get("email") || "").toString().trim(),
        phone: (fd.get("phone") || "").toString().trim(),
        paymentMethod: (fd.get("pm") || "Empreinte bancaire").toString(),
        consentAccepted: fd.get("consent") === "accepted",
      };
      if (!bookingMeta.name || !bookingMeta.email || !bookingMeta.phone || !bookingMeta.consentAccepted) return;

      const now = new Date().toISOString();
      const items = state.cart.map(it => ({
        id: it.id,
        serviceId: it.serviceId,
        serviceName: it.name,
        category: (state.services.find(s => s.id === it.serviceId) || {}).category || "",
        durationMin: it.durationMin,
        priceEur: it.priceEur,
        date: it.date,
        start: it.start,
        end: it.end
      }));

      const payload = {
        _subject: "Nouvelle demande de réservation — Peace of Mind",
        source: getConfigValue("SOURCE_BOOKING", "Peace of Mind V2"),
        submittedAt: now,
        customerName: bookingMeta.name,
        customerEmail: bookingMeta.email,
        customerPhone: bookingMeta.phone,
        paymentMethod: bookingMeta.paymentMethod,
        totalCartEur: cartTotal(),
        consentAccepted: bookingMeta.consentAccepted,
        services: items,
        message: items.map(it => `${it.serviceName} — ${it.category} — ${it.durationMin} min — ${it.priceEur} € — ${it.date} ${it.start}-${it.end}`).join("\n")
      };

      isSubmitting = true;
      setSubmitState(form, true);

      try {
        await postStaticForm(getConfigValue("BOOKING_WEBHOOK_URL", ""), payload);

        items.forEach(it => {
          state.bookings.push({
            id: it.id,
            serviceId: it.serviceId,
            serviceName: it.serviceName,
            category: it.category,
            date: it.date,
            start: it.start,
            end: it.end,
            durationMin: it.durationMin,
            priceEur: it.priceEur,
            paymentMethod: bookingMeta.paymentMethod,
            customer: {
              name: bookingMeta.name,
              email: bookingMeta.email,
              phone: bookingMeta.phone,
            },
            createdAt: now,
          });
        });
        persistBookings();
        appendLocalSubmission(LS.bookingSubmissions, {
          submittedAt: now,
          source: payload.source,
          customerEmail: bookingMeta.email,
          customerPhone: bookingMeta.phone,
          totalCartEur: payload.totalCartEur,
          services: items.map(it => ({
            serviceName: it.serviceName,
            category: it.category,
            date: it.date,
            start: it.start,
            end: it.end,
            priceEur: it.priceEur
          }))
        });

        state.cart = [];
        persistCart();
        updateCartUI();
        form.reset();
        form.dataset.loadedAt = String(Date.now());
        closeModal();

        toast("Votre demande de réservation a bien été envoyée. L’institut vous confirmera le créneau par email ou téléphone.");
      } catch (err) {
        toast("Votre demande n’a pas pu être envoyée automatiquement. Merci de contacter l’institut via la page Contact.");
      } finally {
        isSubmitting = false;
        setSubmitState(form, false);
      }
    });
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => el.classList.remove("is-show"), 2600);
  }

  function cryptoId() {
    // prefer crypto API, else fallback
    try {
      return self.crypto.randomUUID();
    } catch {
      return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function wireFilters() {
    const root = $(".filters");
    if (!root) return;
    $$("button[data-filter]", root).forEach(btn => {
      btn.addEventListener("click", () => {
        $$("button", root).forEach(b => b.classList.remove("chip--active"));
        btn.classList.add("chip--active");
        state.filter = btn.getAttribute("data-filter");
        renderServices();
      });
    });
  }

  async function init() {
    loadStateFromStorage();
    await loadServices();

    renderServices();
    renderSelectedService();
    renderCalendar();
    renderTimeslots();
    syncActionButtons();
    updateCartUI();
    wireFilters();
    wireDrawer();
  }

  window.addEventListener("DOMContentLoaded", init);
})();