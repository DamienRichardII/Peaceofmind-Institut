(() => {
  const root = document.documentElement;
  const body = document.body;

  const bar = document.querySelector('[data-cscroll="bar"]');
  const thumb = document.querySelector('[data-cscroll="thumb"]');
  if (!bar || !thumb) return;

  let dragging = false;
  let dragOffset = 0;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function metrics(){
    const scrollTop = window.scrollY || root.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(root.scrollHeight, body.scrollHeight);
    const clientHeight = window.innerHeight;

    const trackRect = bar.getBoundingClientRect();
    const trackHeight = trackRect.height;

    const maxScroll = Math.max(0, scrollHeight - clientHeight);

    // thumb height proportional, with min size
    const ratio = maxScroll === 0 ? 1 : clientHeight / scrollHeight;
    const thumbH = clamp(Math.round(trackHeight * ratio), 54, trackHeight);

    const maxThumbTop = Math.max(0, trackHeight - thumbH);
    const thumbTop = maxScroll === 0 ? 0 : Math.round((scrollTop / maxScroll) * maxThumbTop);

    return { scrollTop, scrollHeight, clientHeight, trackHeight, thumbH, thumbTop, maxScroll, maxThumbTop, trackRect };
  }

  function render(){
    const m = metrics();
    // If no scroll needed, keep visible but subtle and thumb full height
    thumb.style.height = m.thumbH + "px";
    thumb.style.transform = `translateY(${m.thumbTop}px)`;
    bar.classList.toggle("is-inactive", m.maxScroll === 0);
  }

  function scrollToThumb(clientY){
    const m = metrics();
    const y = clientY - m.trackRect.top;
    const thumbTop = clamp(y - dragOffset, 0, m.maxThumbTop);
    const targetScroll = m.maxThumbTop === 0 ? 0 : (thumbTop / m.maxThumbTop) * m.maxScroll;
    window.scrollTo({ top: targetScroll, behavior: "auto" });
  }

  thumb.addEventListener("pointerdown", (e) => {
    dragging = true;
    thumb.setPointerCapture(e.pointerId);
    const rect = thumb.getBoundingClientRect();
    dragOffset = e.clientY - rect.top;
    thumb.classList.add("is-dragging");
    e.preventDefault();
  });

  thumb.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    scrollToThumb(e.clientY);
  });

  thumb.addEventListener("pointerup", (e) => {
    dragging = false;
    thumb.classList.remove("is-dragging");
  });

  // Click on track jumps
  bar.addEventListener("pointerdown", (e) => {
    if (e.target === thumb) return;
    const m = metrics();
    const rect = thumb.getBoundingClientRect();
    dragOffset = m.thumbH / 2; // center on click
    scrollToThumb(e.clientY);
  });

  window.addEventListener("scroll", render, { passive: true });
  window.addEventListener("resize", render);

  // Keyboard accessibility when focusing thumb
  thumb.setAttribute("tabindex", "0");
  thumb.addEventListener("keydown", (e) => {
    const step = 80;
    if (e.key === "ArrowDown") window.scrollBy({ top: step, behavior: "smooth" });
    if (e.key === "ArrowUp") window.scrollBy({ top: -step, behavior: "smooth" });
    if (e.key === "PageDown") window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
    if (e.key === "PageUp") window.scrollBy({ top: -window.innerHeight * 0.85, behavior: "smooth" });
    if (e.key === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
    if (e.key === "End") window.scrollTo({ top: root.scrollHeight, behavior: "smooth" });
  });

  // initial
  requestAnimationFrame(render);
})();