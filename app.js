(function () {
  const deck = document.getElementById("deck");
  const statusEl = document.getElementById("status");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const progress = document.querySelector("#progress span");

  let slides = [];
  let i = 0;
  let data = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function titleSlide(data) {
    const items = data.vans.map((v, n) => {
      const label = `${v.condition} ${v.year} ${v.floorplan}`;
      return `<li><a href="#s=${introIndex(n)}" data-jump="${introIndex(n)}">
        <div class="row1"><span><span class="num">${n + 1}.</span> ${esc(label)}</span><span>${esc(v.price)}</span></div>
        <div class="row2">${esc(v.mileage)} · ${esc(v.city)} · ${esc(v.distance)}</div>
      </a></li>`;
    }).join("");
    return `<section class="slide paper on" data-type="title">
      <div class="kicker">Photo walkthrough</div>
      <h1>Leisure Travel Vans Unity</h1>
      <p class="lede">14 listings with likely driver assistance. Compiled November 25, 2026, near Denver.</p>
      <p class="lede">Adaptive cruise and lane keep are likely on these vans, starting with the 2019 model year. Lane centering (Active Steering Assist) is not confirmed. Swipe or tap Next to look through each van. Tap a row to jump to that van.</p>
      <p class="hint">A curated set of 15 photos is shown for each van. Open the listing link for the full gallery.</p>
      <ul class="van-list">${items}</ul>
    </section>`;
  }

  function introIndex(vanPos) {
    // slide 0 is title; then for each van: 1 intro + photos
    let idx = 1;
    for (let v = 0; v < vanPos; v++) idx += 1 + data.vans[v].photos.length;
    return idx;
  }

  function introSlide(v, vanPos) {
    const caution = v.caution
      ? `<div class="caution">Caution: ${esc(v.caution)}</div>`
      : "";
    const n = v.photos.length;
    return `<section class="slide paper" data-type="intro" data-van="${esc(v.id)}">
      <img class="intro-hero" alt="${esc(v.year + " Unity " + v.floorplan)}" data-src="${esc(v.hero)}" width="1600" height="900">
      <div class="intro-body">
        <div class="kicker">Van ${vanPos + 1} of 14</div>
        <h2>${esc(v.condition)} ${esc(v.year)} Unity ${esc(v.floorplan)}</h2>
        <p class="meta"><strong>${esc(v.price)}</strong> · ${esc(v.mileage)}</p>
        <p class="meta">${esc(v.dealer)}, ${esc(v.city)} · ${esc(v.distance)}</p>
        <div class="links">
          <a href="${esc(v.url)}" target="_blank" rel="noopener">Open listing</a>
          <a class="ghost" href="${esc(v.url)}" target="_blank" rel="noopener">See all ${v.gallery_count} photos on listing</a>
        </div>
        <p class="assist">Assist: ${esc(v.assist)}</p>
        ${caution}
        <p class="hint">${n} photos follow. Swipe or tap Next.</p>
      </div>
    </section>`;
  }

  function photoSlide(v, photo, p, total) {
    const kind = photo.kind === "floorplan" ? " · Floorplan" : "";
    const alt = `${v.year} Unity ${v.floorplan} photo ${p} of ${total}`;
    return `<section class="slide photo" data-type="photo" data-van="${esc(v.id)}">
      <img alt="${esc(alt)}" data-src="${esc(photo.src)}" width="${photo.w}" height="${photo.h}">
      <div class="photo-cap">${esc(v.condition)} ${esc(v.year)} ${esc(v.floorplan)} · ${p} of ${total}${kind}</div>
    </section>`;
  }

  function build(d) {
    data = d;
    const parts = [titleSlide(d)];
    d.vans.forEach((v, vi) => {
      parts.push(introSlide(v, vi));
      v.photos.forEach((p, pi) => parts.push(photoSlide(v, p, pi + 1, v.photos.length)));
    });
    deck.innerHTML = parts.join("");
    slides = Array.from(deck.querySelectorAll(".slide"));
  }

  function loadImg(slide) {
    if (!slide) return;
    slide.querySelectorAll("img[data-src]").forEach((img) => {
      if (!img.getAttribute("src")) img.setAttribute("src", img.getAttribute("data-src"));
    });
  }

  function preloadAround(idx) {
    for (let k = idx - 1; k <= idx + 2; k++) {
      if (k >= 0 && k < slides.length) loadImg(slides[k]);
    }
  }

  function go(n, pushHash) {
    if (!slides.length) return;
    n = Math.max(0, Math.min(slides.length - 1, n));
    slides[i].classList.remove("on");
    i = n;
    slides[i].classList.add("on");
    preloadAround(i);
    const total = slides.length;
    const typ = slides[i].getAttribute("data-type");
    let label = `Slide ${i + 1} of ${total}`;
    let sub = typ === "title" ? "Overview" : "";
    if (typ === "intro" || typ === "photo") {
      const vanId = slides[i].getAttribute("data-van");
      const v = data.vans.find((x) => x.id === vanId);
      if (v) sub = `${v.condition} ${v.year} ${v.floorplan}`;
    }
    statusEl.innerHTML = `${esc(label)}<span class="van">${esc(sub)}</span>`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === total - 1;
    progress.style.width = ((i + 1) / total * 100).toFixed(2) + "%";
    if (pushHash !== false) {
      const hash = "#s=" + i;
      if (location.hash !== hash) history.replaceState(null, "", hash);
    }
  }

  function parseHash() {
    const m = /[#&]s=(\d+)/.exec(location.hash || "");
    return m ? parseInt(m[1], 10) : 0;
  }

  prevBtn.addEventListener("click", () => go(i - 1));
  nextBtn.addEventListener("click", () => go(i + 1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
      e.preventDefault();
      go(i - 1);
    } else if (e.key === "Home") go(0);
    else if (e.key === "End") go(slides.length - 1);
  });

  deck.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-jump]");
    if (!a) return;
    e.preventDefault();
    go(parseInt(a.getAttribute("data-jump"), 10));
  });

  let sx = 0, sy = 0, tracking = false;
  deck.addEventListener("touchstart", (e) => {
    if (!e.changedTouches[0]) return;
    // allow vertical scroll on paper slides
    const t = e.target;
    if (t.closest && t.closest("a, button")) return;
    sx = e.changedTouches[0].clientX;
    sy = e.changedTouches[0].clientY;
    tracking = true;
  }, { passive: true });

  deck.addEventListener("touchend", (e) => {
    if (!tracking || !e.changedTouches[0]) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) go(i + 1);
    else go(i - 1);
  }, { passive: true });

  window.addEventListener("hashchange", () => {
    const n = parseHash();
    if (n !== i) go(n, false);
  });

  fetch("slides.json")
    .then((r) => r.json())
    .then((d) => {
      build(d);
      go(parseHash(), false);
    })
    .catch((err) => {
      statusEl.textContent = "Could not load the slideshow.";
      console.error(err);
    });
})();
