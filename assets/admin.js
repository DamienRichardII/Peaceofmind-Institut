(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const LS = {
    settings: "pom_admin_settings",
    bookings: "pom_bookings",
  };

  const defaultSettings = {
    intervalMin: 15,
    days: {
      0: { enabled: false, start: "10:00", end: "16:00" },
      1: { enabled: true,  start: "09:00", end: "19:00" },
      2: { enabled: true,  start: "09:00", end: "19:00" },
      3: { enabled: true,  start: "09:00", end: "19:00" },
      4: { enabled: true,  start: "09:00", end: "19:00" },
      5: { enabled: true,  start: "09:00", end: "19:00" },
      6: { enabled: true,  start: "10:00", end: "16:00" },
    },
    exceptions: [],
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

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  let settings;
  let bookings;

  function renderDays() {
    const root = $("#adminDays");
    root.innerHTML = Object.keys(settings.days).map(k => {
      const d = settings.days[k];
      return `
        <div class="admin-day">
          <div class="admin-day__top">
            <label class="toggle">
              <input type="checkbox" data-day="${k}" ${d.enabled ? "checked" : ""}/>
              <span>${dayNames[Number(k)]}</span>
            </label>
          </div>
          <div class="admin-day__grid">
            <label class="field">
              <span>Début</span>
              <input type="time" data-start="${k}" value="${d.start}"/>
            </label>
            <label class="field">
              <span>Fin</span>
              <input type="time" data-end="${k}" value="${d.end}"/>
            </label>
          </div>
        </div>
      `;
    }).join("");

    $$("input[type='checkbox'][data-day]", root).forEach(inp => {
      inp.addEventListener("change", () => {
        const k = inp.getAttribute("data-day");
        settings.days[k].enabled = inp.checked;
      });
    });
    $$("input[type='time'][data-start]", root).forEach(inp => {
      inp.addEventListener("change", () => {
        const k = inp.getAttribute("data-start");
        settings.days[k].start = inp.value;
      });
    });
    $$("input[type='time'][data-end]", root).forEach(inp => {
      inp.addEventListener("change", () => {
        const k = inp.getAttribute("data-end");
        settings.days[k].end = inp.value;
      });
    });
  }

  function renderExceptions() {
    const root = $("#exceptions");
    if (!settings.exceptions || settings.exceptions.length === 0) {
      root.innerHTML = `<p class="muted">Aucune date ajoutée.</p>`;
      return;
    }
    root.innerHTML = settings.exceptions
      .sort()
      .map((d, idx) => `
        <div class="exception">
          <span>${d}</span>
          <button class="link danger" type="button" data-remove-ex="${idx}">Retirer</button>
        </div>
      `).join("");

    $$("[data-remove-ex]", root).forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-remove-ex"));
        settings.exceptions.splice(i, 1);
        renderExceptions();
      });
    });
  }

  function euro(n) {
    const v = (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
    return `${v} €`;
  }

  function renderBookings() {
    const root = $("#bookingsList");
    if (!bookings || bookings.length === 0) {
      root.innerHTML = `<p class="muted">Aucune réservation.</p>`;
      return;
    }

    const sorted = [...bookings].sort((a,b) => {
      const ka = `${a.date} ${a.start}`;
      const kb = `${b.date} ${b.start}`;
      return ka.localeCompare(kb);
    });

    root.innerHTML = sorted.map((b, idx) => `
      <div class="booking-row">
        <div>
          <p class="booking-row__title">${escapeHtml(b.serviceName)}</p>
          <p class="booking-row__meta">${b.date} • ${b.start} → ${b.end} • ${b.durationMin} min</p>
          <p class="booking-row__meta">${escapeHtml(b.customer?.name || "")} • ${escapeHtml(b.customer?.phone || "")}</p>
        </div>
        <div class="booking-row__right">
          <div class="booking-row__price">${b.priceEur === 0 ? "Gratuit" : euro(b.priceEur)}</div>
          <div class="booking-row__pm">${escapeHtml(b.paymentMethod || "")}</div>
          <button class="link danger" type="button" data-del-booking="${b.id}">Supprimer</button>
        </div>
      </div>
    `).join("");

    $$("[data-del-booking]", root).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del-booking");
        bookings = bookings.filter(x => x.id !== id);
        saveJSON(LS.bookings, bookings);
        renderBookings();
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function init() {
    settings = loadJSON(LS.settings, defaultSettings);
    bookings = loadJSON(LS.bookings, []);

    $("#intervalMin").value = settings.intervalMin || 15;

    renderDays();
    renderExceptions();
    renderBookings();

    $("#saveSettings").addEventListener("click", () => {
      const v = Number($("#intervalMin").value || 15);
      settings.intervalMin = Math.max(5, v);
      saveJSON(LS.settings, settings);
      flash("Enregistré.");
    });

    $("#addException").addEventListener("click", () => {
      const d = $("#exceptionDate").value;
      if (!d) return;
      settings.exceptions ||= [];
      if (!settings.exceptions.includes(d)) settings.exceptions.push(d);
      $("#exceptionDate").value = "";
      renderExceptions();
    });

    $("#clearBookings").addEventListener("click", () => {
      if (!confirm("Supprimer toutes les réservations locales ?")) return;
      bookings = [];
      saveJSON(LS.bookings, bookings);
      renderBookings();
    });
  }

  function flash(msg) {
    const el = document.createElement("div");
    el.className = "admin-flash";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("is-show"), 10);
    setTimeout(() => {
      el.classList.remove("is-show");
      setTimeout(() => el.remove(), 250);
    }, 1800);
  }

  window.addEventListener("DOMContentLoaded", init);
})();