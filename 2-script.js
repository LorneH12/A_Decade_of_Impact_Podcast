/* =========================
   A Decade of Impact Podcast
   - Hero slideshow
   - YouTube seek chapters
   - Light/Dark toggle
   - EN/ES toggle
   - WCAG keyboard support
   ========================= */

const STORAGE_KEYS = {
  theme: "adip_theme",
  lang: "adip_lang",
  heroPaused: "adip_hero_paused",
};

const VIDEO_ID = "8XJr7USptS8";
const YT_IFRAME_ID = "ytPlayer";

/**
 * Chapters from your final transcript timestamps
 * (Start times as mm:ss or hh:mm:ss)
 */
const CHAPTERS = [
  { id: "ep01", time: "00:02", title_en: "Welcome & A Decade of Impact", title_es: "Bienvenida y Una Década de Impacto",
    desc_en: "Intro, MDTP framing, and why education changes and repeats like fashion cycles.",
    desc_es: "Introducción, marco de MDTP y por qué la educación cambia y se repite como la moda." },

  { id: "ep02", time: "02:25", title_en: "Meet the Teachers: Bridget & Kimberly", title_es: "Conoce a las maestras: Bridget y Kimberly",
    desc_en: "Backgrounds, grade levels, and the shared truth: kids are kids.",
    desc_es: "Trayectorias, grados y una verdad compartida: los niños son niños." },

  { id: "ep03", time: "04:18", title_en: "Teachers Are More Than Teachers", title_es: "Las maestras son más que maestras",
    desc_en: "A personal story on why teachers often become mentors, allies, and support systems.",
    desc_es: "Historia personal sobre cómo las maestras se convierten en mentoras, aliadas y apoyo." },

  { id: "ep04", time: "05:59", title_en: "The Power of Homeroom Parents", title_es: "El poder de las familias voluntarias",
    desc_en: "How parent support changes the classroom, from parties to practical help.",
    desc_es: "Cómo el apoyo familiar transforma el aula, de eventos a ayuda práctica." },

  { id: "ep05", time: "10:18", title_en: "Why They Became Teachers", title_es: "Por qué se hicieron maestras",
    desc_en: "Origin stories: being seen, encouraged, and called into the profession.",
    desc_es: "Historias de origen: ser vistas, motivadas y llamadas a la profesión." },

  { id: "ep06", time: "16:01", title_en: "Encouragement vs Support", title_es: "Ánimo vs apoyo",
    desc_en: "What builds great teachers: mentorship, confidence, and daily recognition.",
    desc_es: "Qué forma grandes maestras: mentoría, confianza y reconocimiento diario." },

  { id: "ep07", time: "23:35", title_en: "Teachers as Mentors, Not Just Instructors", title_es: "Maestras como mentoras, no solo instructoras",
    desc_en: "Trust, emotional safety, and why relationships unlock real learning.",
    desc_es: "Confianza, seguridad emocional y por qué la relación desbloquea el aprendizaje." },

  { id: "ep08", time: "30:15", title_en: "AI, Technology, and the Human Line", title_es: "IA, tecnología y el límite humano",
    desc_en: "A balanced take: use tech to support learning, not replace connection.",
    desc_es: "Una visión equilibrada: usar tecnología para apoyar, no reemplazar la conexión." },

  { id: "ep09", time: "35:28", title_en: "What Changed in Education", title_es: "Qué cambió en educación",
    desc_en: "The decade question: what improved and what stalled over time.",
    desc_es: "La pregunta de la década: qué mejoró y qué se estancó." },

  { id: "ep10", time: "40:38", title_en: "When Data Replaced Children", title_es: "Cuando los datos reemplazaron a los niños",
    desc_en: "How statistics can distort priorities and reduce students to categories.",
    desc_es: "Cómo las estadísticas pueden distorsionar prioridades y reducir a los estudiantes a categorías." },

  { id: "ep11", time: "43:57", title_en: "Respect, Partnership, and the Future", title_es: "Respeto, alianza y el futuro",
    desc_en: "Professional respect, parent partnership, workload, and real support.",
    desc_es: "Respeto profesional, alianza con familias, carga laboral y apoyo real." },

  { id: "ep12", time: "53:43", title_en: "Closing Reflections", title_es: "Cierre y reflexiones",
    desc_en: "A call to do better for teachers and the communities around them.",
    desc_es: "Un llamado a hacerlo mejor por las maestras y sus comunidades." },
];

const HERO_IMAGES = [
  { src: "hero/hero-01.jpg", alt_en: "Podcast studio moment - A Decade of Impact", alt_es: "Momento en el estudio - Una Década de Impacto" },
  { src: "hero/hero-02.jpg", alt_en: "Guest conversation still", alt_es: "Imagen de conversación con invitadas" },
  { src: "hero/hero-03.jpg", alt_en: "MDTP branded scene", alt_es: "Escena con marca de MDTP" },
  { src: "hero/hero-04.jpg", alt_en: "Host and guests in discussion", alt_es: "Anfitriona e invitadas conversando" },
  { src: "hero/hero-05.jpg", alt_en: "Close-up of guest speaker", alt_es: "Primer plano de invitada" },
  { src: "hero/hero-06.jpg", alt_en: "Wide shot of the podcast set", alt_es: "Toma amplia del set del podcast" },
];

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function parseTimeToSeconds(t) {
  // supports mm:ss or hh:mm:ss
  const parts = t.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function formatTime(t) {
  // Ensure mm:ss display for rail
  const s = parseTimeToSeconds(t);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* ---------- Preferences ---------- */
function getPref(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function setPref(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}

/* ---------- Theme Toggle ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const pressed = theme === "dark";
  const btn = $("#themeToggle");
  const label = $("#themeToggleLabel");
  btn.setAttribute("aria-pressed", String(pressed));
  label.textContent = pressed ? "Dark" : "Light";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  setPref(STORAGE_KEYS.theme, next);
}

/* ---------- Language Toggle ---------- */
const I18N = {
  en: {
    brandSub: "Stakeholder Review",
    pageTitle: "A Decade of Impact: Education Conversation",
    pageDesc: "Host Kashuna Hopkins (MDTP) sits down with retired Arizona educators Bridget Larkin and Kimberly Fern to reflect on what has changed, what hasn’t, and what teachers need most.",
    watchFullBtn: "Watch Full Podcast",
    watchChaptersBtn: "Watch by Chapters",
    heroNote: "Tip: Use Chapters below to jump to exact moments in the YouTube player.",
    watchTitle: "Full Podcast",
    watchSubtitle: "Use the player below for full playback. Chapters can jump you to key moments.",
    runtimeLabel: "Runtime",
    videoSourceLabel: "Source",
    openOnYouTube: "Open on YouTube",
    copyChaptersLabel: "Copy Chapter List",
    playerHint: "Selecting a chapter below will jump the video to that timestamp.",
    episodesTitle: "Chapters",
    episodesSubtitle: "Netflix-style chapters: select one to jump to the exact timestamp.",
    railHelp: "Keyboard: Tab to a chapter, then press Enter/Space to jump. Use Left/Right arrows to move between chapters.",
    merchTitle: "Featured: Teaching is DOPE",
    merchSubtitle: "Kashuna wears the MDTP “Teaching is DOPE” shirt—part of MDTP’s support campaigns.",
    shopMerchLabel: "View in MDTP Store",
    footerText: "Million Dollar Teacher Project — A Decade of Impact Podcast stakeholder review page."
  },
  es: {
    brandSub: "Revisión para interesados",
    pageTitle: "Una Década de Impacto: Conversación sobre educación",
    pageDesc: "La anfitriona Kashuna Hopkins (MDTP) conversa con las educadoras jubiladas de Arizona Bridget Larkin y Kimberly Fern sobre lo que cambió, lo que no, y lo que más necesitan las maestras.",
    watchFullBtn: "Ver el podcast completo",
    watchChaptersBtn: "Ver por capítulos",
    heroNote: "Consejo: Usa los capítulos para saltar a momentos exactos en YouTube.",
    watchTitle: "Podcast completo",
    watchSubtitle: "Usa el reproductor para ver el video completo. Los capítulos te llevan a momentos clave.",
    runtimeLabel: "Duración",
    videoSourceLabel: "Fuente",
    openOnYouTube: "Abrir en YouTube",
    copyChaptersLabel: "Copiar lista de capítulos",
    playerHint: "Al seleccionar un capítulo, el video saltará a ese momento.",
    episodesTitle: "Capítulos",
    episodesSubtitle: "Capítulos estilo Netflix: selecciona uno para saltar al tiempo exacto.",
    railHelp: "Teclado: Tab para ir a un capítulo y Enter/Espacio para saltar. Flechas Izq/Der para moverte entre capítulos.",
    merchTitle: "Destacado: Teaching is DOPE",
    merchSubtitle: "Kashuna usa la camiseta “Teaching is DOPE” de MDTP—parte de campañas de apoyo.",
    shopMerchLabel: "Ver en la tienda de MDTP",
    footerText: "Million Dollar Teacher Project — Página de revisión del podcast Una Década de Impacto."
  }
};

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  const pressed = lang === "es";
  $("#langToggle").setAttribute("aria-pressed", String(pressed));
  $("#langToggleLabel").textContent = pressed ? "ES → EN" : "EN → ES";

  const t = I18N[lang];
  $("#brandSub").textContent = t.brandSub;
  $("#pageTitle").textContent = t.pageTitle;
  $("#pageDesc").textContent = t.pageDesc;
  $("#watchFullBtn").textContent = t.watchFullBtn;
  $("#watchChaptersBtn").textContent = t.watchChaptersBtn;
  $("#heroNote").textContent = t.heroNote;

  $("#watchTitle").textContent = t.watchTitle;
  $("#watchSubtitle").textContent = t.watchSubtitle;
  $("#runtimeLabel").textContent = t.runtimeLabel;
  $("#videoSourceLabel").textContent = t.videoSourceLabel;
  $("#openOnYouTube").textContent = t.openOnYouTube;
  $("#copyChaptersLabel").textContent = t.copyChaptersLabel;
  $("#playerHint").textContent = t.playerHint;

  $("#episodesTitle").textContent = t.episodesTitle;
  $("#episodesSubtitle").textContent = t.episodesSubtitle;
  $("#railHelp").textContent = t.railHelp;

  $("#merchTitle").textContent = t.merchTitle;
  $("#merchSubtitle").textContent = t.merchSubtitle;
  $("#shopMerchLabel").textContent = t.shopMerchLabel;

  $("#footerText").innerHTML = `© <span id="year"></span> ${t.footerText}`;

  // Update dynamic bits
  $("#year").textContent = new Date().getFullYear();

  // Update hero alt text
  const slides = $all(".hero__slide img");
  slides.forEach((img, i) => {
    const meta = HERO_IMAGES[i];
    img.alt = lang === "es" ? meta.alt_es : meta.alt_en;
  });

  // Update cards
  renderEpisodes(lang);
}

function toggleLanguage() {
  const current = getPref(STORAGE_KEYS.lang, "en");
  const next = current === "en" ? "es" : "en";
  setPref(STORAGE_KEYS.lang, next);
  applyLanguage(next);
}

/* ---------- Hero Slideshow ---------- */
let heroIndex = 0;
let heroTimer = null;
let heroPaused = false;

function renderHeroSlides(lang) {
  const slidesWrap = $("#heroSlides");
  const dotsWrap = $("#heroDots");
  slidesWrap.innerHTML = "";
  dotsWrap.innerHTML = "";

  HERO_IMAGES.forEach((s, i) => {
    const slide = document.createElement("div");
    slide.className = "hero__slide" + (i === 0 ? " is-active" : "");
    const img = document.createElement("img");
    img.src = s.src;
    img.alt = lang === "es" ? s.alt_es : s.alt_en;
    img.loading = i === 0 ? "eager" : "lazy";
    img.decoding = "async";
    slide.appendChild(img);
    slidesWrap.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Slide ${i + 1}`);
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.addEventListener("click", () => goToHero(i, true));
    dotsWrap.appendChild(dot);
  });
}

function setHeroActive(index) {
  const slides = $all(".hero__slide");
  const dots = $all(".dot");
  slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
  dots.forEach((d, i) => d.setAttribute("aria-selected", i === index ? "true" : "false"));
  heroIndex = index;
}

function goToHero(index, userAction = false) {
  const total = HERO_IMAGES.length;
  const next = (index + total) % total;
  setHeroActive(next);

  // If user interacts, pause briefly to reduce motion surprises
  if (userAction && !prefersReducedMotion()) {
    restartHeroTimer();
  }
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function restartHeroTimer() {
  stopHeroTimer();
  if (heroPaused || prefersReducedMotion()) return;
  heroTimer = window.setInterval(() => {
    goToHero(heroIndex + 1);
  }, 6000);
}

function stopHeroTimer() {
  if (heroTimer) window.clearInterval(heroTimer);
  heroTimer = null;
}

function toggleHeroPlayPause() {
  heroPaused = !heroPaused;
  setPref(STORAGE_KEYS.heroPaused, heroPaused ? "1" : "0");
  const btn = $("#heroPlayPause");
  btn.setAttribute("aria-pressed", String(heroPaused));
  btn.textContent = heroPaused ? "▶" : "❚❚";
  btn.setAttribute("aria-label", heroPaused ? "Play slideshow" : "Pause slideshow");
  restartHeroTimer();
}

/* ---------- Episodes (Netflix Rail) ---------- */
function getThumbPathForIndex(i) {
  // Your folder currently has ep-01..ep-08.
  // For ep-09..ep-12, we cycle 01..08 to keep uniform styling without broken UI.
  const mapped = (i % 8) + 1;
  const nn = String(mapped).padStart(2, "0");
  return `thumbnails/ep-${nn}.jpg`;
}

function buildChapterListText() {
  return CHAPTERS.map(c => `${c.time} ${c.title_en}`).join("\n");
}

function renderEpisodes(lang) {
  const rail = $("#episodesRail");
  if (!rail) return;
  rail.innerHTML = "";

  CHAPTERS.forEach((c, idx) => {
    const seconds = parseTimeToSeconds(c.time);
    const title = lang === "es" ? c.title_es : c.title_en;
    const desc = lang === "es" ? c.desc_es : c.desc_en;

    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("role", "listitem");

    // Thumb
    const thumb = document.createElement("div");
    thumb.className = "card__thumb";

    const img = document.createElement("img");
    img.src = getThumbPathForIndex(idx);
    img.alt = `${title} thumbnail`;
    img.loading = "lazy";
    img.decoding = "async";

    // If image fails, keep the gradient background and remove broken img icon
    img.addEventListener("error", () => {
      img.remove();
    });

    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = formatTime(c.time);

    thumb.appendChild(img);
    thumb.appendChild(chip);

    // Body
    const body = document.createElement("div");
    body.className = "card__body";

    const h3 = document.createElement("h3");
    h3.className = "card__title";
    h3.textContent = title;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    meta.innerHTML = `<span><strong>Chapter</strong> ${String(idx + 1).padStart(2, "0")}</span><span>•</span><span>${formatTime(c.time)}</span>`;

    const p = document.createElement("p");
    p.className = "card__desc";
    p.textContent = desc;

    body.appendChild(h3);
    body.appendChild(meta);
    body.appendChild(p);

    // Actions
    const actions = document.createElement("div");
    actions.className = "card__actions";

    const btn = document.createElement("button");
    btn.className = "btn btn--primary card__btn";
    btn.type = "button";
    btn.dataset.seconds = String(seconds);
    btn.dataset.chapterId = c.id;
    btn.setAttribute("aria-label", `${lang === "es" ? "Saltar a" : "Jump to"} ${title} at ${formatTime(c.time)}`);
    btn.innerHTML = `<span aria-hidden="true">▶</span><span>${lang === "es" ? "Ver capítulo" : "Watch chapter"}</span>`;

    btn.addEventListener("click", () => jumpToTime(seconds, title));

    actions.appendChild(btn);

    card.appendChild(thumb);
    card.appendChild(body);
    card.appendChild(actions);

    // Keyboard arrow navigation among cards
    card.tabIndex = 0;
    card.addEventListener("keydown", (e) => {
      const cards = Array.from(rail.querySelectorAll(".card"));
      const i = cards.indexOf(card);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        (cards[i + 1] || cards[0]).focus();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        (cards[i - 1] || cards[cards.length - 1]).focus();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        jumpToTime(seconds, title);
      }
    });

    rail.appendChild(card);
  });
}

/* ---------- YouTube Jump (postMessage API) ---------- */
function jumpToTime(seconds, titleForStatus) {
  // Move focus to the player region for screen reader context
  const watch = $("#watch");
  if (watch) {
    watch.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }

  // Try to seek via postMessage (YouTube Iframe API without loading full JS)
  const iframe = document.getElementById(YT_IFRAME_ID);
  if (!iframe) return;

  // Seek
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
    "*"
  );

  // Play after seek (helps stakeholder flow)
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func: "playVideo", args: [] }),
    "*"
  );

  // Status hint (ARIA live)
  const hint = $("#playerHint");
  const lang = getPref(STORAGE_KEYS.lang, "en");
  hint.textContent = lang === "es"
    ? `Saltando a: ${titleForStatus} (${formatTime(secondsToTime(seconds))})`
    : `Jumping to: ${titleForStatus} (${formatTime(secondsToTime(seconds))})`;
}

function secondsToTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* ---------- Rail scroll buttons ---------- */
function setupRailControls() {
  const rail = $("#episodesRail");
  const prev = $("#railPrev");
  const next = $("#railNext");
  if (!rail || !prev || !next) return;

  const scrollBy = () => Math.max(320, Math.floor(rail.clientWidth * 0.9));

  prev.addEventListener("click", () => {
    rail.scrollBy({ left: -scrollBy(), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
  next.addEventListener("click", () => {
    rail.scrollBy({ left: scrollBy(), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });

  // Allow horizontal scroll via keyboard when rail is focused
  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") rail.scrollBy({ left: 80, behavior: "auto" });
    if (e.key === "ArrowLeft") rail.scrollBy({ left: -80, behavior: "auto" });
  });
}

/* ---------- Copy chapters ---------- */
function setupCopyChapters() {
  const btn = $("#copyChapters");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const text = buildChapterListText();
    try {
      await navigator.clipboard.writeText(text);
      const lang = getPref(STORAGE_KEYS.lang, "en");
      btn.querySelector("span:last-child").textContent = lang === "es" ? "¡Copiado!" : "Copied!";
      window.setTimeout(() => {
        $("#copyChaptersLabel").textContent = lang === "es" ? I18N.es.copyChaptersLabel : I18N.en.copyChaptersLabel;
      }, 1400);
    } catch {
      // Fallback: prompt
      window.prompt("Copy chapters:", text);
    }
  });
}

/* ---------- Init ---------- */
function init() {
  // Year
  $("#year").textContent = new Date().getFullYear();

  // Theme
  const savedTheme = getPref(STORAGE_KEYS.theme, "light");
  applyTheme(savedTheme);

  $("#themeToggle").addEventListener("click", toggleTheme);

  // Language
  const savedLang = getPref(STORAGE_KEYS.lang, "en");

  // Hero
  heroPaused = getPref(STORAGE_KEYS.heroPaused, "0") === "1";
  renderHeroSlides(savedLang);
  setHeroActive(0);

  $("#heroPrev").addEventListener("click", () => goToHero(heroIndex - 1, true));
  $("#heroNext").addEventListener("click", () => goToHero(heroIndex + 1, true));
  $("#heroPlayPause").addEventListener("click", toggleHeroPlayPause);

  // If reduced motion, auto-pause slideshow for accessibility
  if (prefersReducedMotion()) heroPaused = true;

  // Reflect hero pause state in button UI
  const pp = $("#heroPlayPause");
  pp.setAttribute("aria-pressed", String(heroPaused));
  pp.textContent = heroPaused ? "▶" : "❚❚";
  pp.setAttribute("aria-label", heroPaused ? "Play slideshow" : "Pause slideshow");

  restartHeroTimer();

  // Episodes
  setupRailControls();
  setupCopyChapters();

  // Language apply (after hero render so alt updates)
  applyLanguage(savedLang);

  $("#langToggle").addEventListener("click", toggleLanguage);

  // Ensure main is reachable after skip link
  $("#main").addEventListener("focus", () => {}, { passive: true });
}

document.addEventListener("DOMContentLoaded", init);
