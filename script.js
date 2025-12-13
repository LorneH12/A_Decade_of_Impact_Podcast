/* =========================
   A Decade of Impact Podcast
   - Chapter-limited playback (YouTube Iframe API)
   - Now Playing + Prev/Next
   - Active playing glow + watched tracking
   - Feedback tracking per chapter (localStorage)
   - Always start in dark mode (default)
   - Desktop grid / Mobile swipe (CSS)
   - EN/ES toggle preserved
   ========================= */

const STORAGE_KEYS = {
  theme: "adip_theme",
  lang: "adip_lang",
  heroPaused: "adip_hero_paused",
  watched: "adip_watched_v1",
  feedback: "adip_feedback_v1",
};

const VIDEO_ID = "8XJr7USptS8";
let ytPlayer = null;
let pollTimer = null;

let currentChapterIndex = -1;
let currentStart = 0;
let currentEnd = 0;
let hasMarkedWatched = false;

/**
 * Chapters from your final transcript timestamps
 * Start times are exact.
 * End time is computed as next chapter start (or video duration when available).
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

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseTimeToSeconds(t) {
  const parts = t.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function formatTimeSeconds(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
}

function safeJSONParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
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

/* ---------- Theme (default DARK) ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const pressed = theme === "dark";
  $("#themeToggle").setAttribute("aria-pressed", String(pressed));
  $("#themeToggleLabel").textContent = pressed ? "Dark" : "Light";
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
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
    heroNote: "Tip: Chapters below will play only their specific bite-sized segment.",
    watchTitle: "Full Podcast",
    watchSubtitle: "Use the player below for full playback. Chapters will jump and play only their segment.",
    runtimeLabel: "Runtime",
    videoSourceLabel: "Source",
    openOnYouTube: "Open on YouTube",
    copyChaptersLabel: "Copy Chapter List",
    playerHint: "Select a chapter to play only that segment.",
    episodesTitle: "Chapters",
    episodesSubtitle: "Mobile: swipe through chapters. Desktop: grid view for fast selection.",
    railHelp: "Keyboard: Tab to a chapter, Enter/Space plays that chapter only. Left/Right moves between chapters.",
    npKicker: "Now Playing",
    npPrev: "Prev",
    npNext: "Next",
    feedbackTitle: "Feedback",
    feedbackSubtitle: "Log update requests tied to the chapter you’re reviewing. Saved locally so reviewers can track what they watched and what they requested.",
    fbEpisodeLabel: "Episode / Chapter",
    fbEpisodeHelp: "Tip: Choose the same chapter you just watched.",
    fbTypeLabel: "Request Type",
    fbNotesLabel: "Notes",
    fbSubmitLabel: "Add Feedback",
    fbExportLabel: "Export JSON",
    fbClearLabel: "Clear (This Device)",
    fbLogTitle: "Feedback Log",
    fbLogHint: "Shows feedback entries tied to specific chapters.",
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
    heroNote: "Consejo: Los capítulos se reproducen solo en formato corto (por segmento).",
    watchTitle: "Podcast completo",
    watchSubtitle: "Usa el reproductor para ver el video completo. Los capítulos saltan y reproducen solo su segmento.",
    runtimeLabel: "Duración",
    videoSourceLabel: "Fuente",
    openOnYouTube: "Abrir en YouTube",
    copyChaptersLabel: "Copiar lista de capítulos",
    playerHint: "Selecciona un capítulo para reproducir solo ese segmento.",
    episodesTitle: "Capítulos",
    episodesSubtitle: "Móvil: desliza capítulos. Escritorio: vista en cuadrícula.",
    railHelp: "Teclado: Tab para ir a un capítulo, Enter/Espacio reproduce solo ese capítulo. Flechas Izq/Der para moverte.",
    npKicker: "Reproduciendo",
    npPrev: "Anterior",
    npNext: "Siguiente",
    feedbackTitle: "Comentarios",
    feedbackSubtitle: "Registra solicitudes de actualización vinculadas al capítulo que revisas. Se guarda localmente para dar seguimiento.",
    fbEpisodeLabel: "Episodio / Capítulo",
    fbEpisodeHelp: "Consejo: elige el mismo capítulo que acabas de ver.",
    fbTypeLabel: "Tipo de solicitud",
    fbNotesLabel: "Notas",
    fbSubmitLabel: "Agregar comentario",
    fbExportLabel: "Exportar JSON",
    fbClearLabel: "Borrar (este dispositivo)",
    fbLogTitle: "Registro de comentarios",
    fbLogHint: "Muestra entradas vinculadas a capítulos específicos.",
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

  $("#npKicker").textContent = t.npKicker;
  $("#npPrevLabel").textContent = t.npPrev;
  $("#npNextLabel").textContent = t.npNext;

  $("#feedbackTitle").textContent = t.feedbackTitle;
  $("#feedbackSubtitle").textContent = t.feedbackSubtitle;
  $("#fbEpisodeLabel").textContent = t.fbEpisodeLabel;
  $("#fbEpisodeHelp").textContent = t.fbEpisodeHelp;
  $("#fbTypeLabel").textContent = t.fbTypeLabel;
  $("#fbNotesLabel").textContent = t.fbNotesLabel;
  $("#fbSubmitLabel").textContent = t.fbSubmitLabel;
  $("#fbExportLabel").textContent = t.fbExportLabel;
  $("#fbClearLabel").textContent = t.fbClearLabel;
  $("#fbLogTitle").textContent = t.fbLogTitle;
  $("#fbLogHint").textContent = t.fbLogHint;

  $("#merchTitle").textContent = t.merchTitle;
  $("#merchSubtitle").textContent = t.merchSubtitle;
  $("#shopMerchLabel").textContent = t.shopMerchLabel;

  $("#footerText").innerHTML = `© <span id="year"></span> ${t.footerText}`;
  $("#year").textContent = new Date().getFullYear();

  // update hero alt text
  const slides = $all(".hero__slide img");
  slides.forEach((img, i) => {
    const meta = HERO_IMAGES[i];
    img.alt = lang === "es" ? meta.alt_es : meta.alt_en;
  });

  // rerender episodes + feedback select for correct language titles
  renderEpisodes(lang);
  renderFeedbackSelect(lang);
  renderFeedbackList(lang);
  syncNowPlayingUI(lang);
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
  if (userAction && !prefersReducedMotion()) restartHeroTimer();
}
function restartHeroTimer() {
  stopHeroTimer();
  if (heroPaused || prefersReducedMotion()) return;
  heroTimer = window.setInterval(() => goToHero(heroIndex + 1), 6000);
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

/* ---------- Watched Tracking ---------- */
function getWatchedMap() {
  return safeJSONParse(getPref(STORAGE_KEYS.watched, "{}"), {});
}
function setWatched(chapterId) {
  const map = getWatchedMap();
  map[chapterId] = true;
  setPref(STORAGE_KEYS.watched, JSON.stringify(map));
}
function isWatched(chapterId) {
  const map = getWatchedMap();
  return !!map[chapterId];
}

/* ---------- Episodes UI ---------- */
function getThumbPathForIndex(i) {
  const mapped = (i % 8) + 1;
  const nn = String(mapped).padStart(2, "0");
  return `thumbnails/ep-${nn}.jpg`;
}

function renderEpisodes(lang) {
  const rail = $("#episodesRail");
  if (!rail) return;
  rail.innerHTML = "";

  CHAPTERS.forEach((c, idx) => {
    const seconds = parseTimeToSeconds(c.time);
    const title = lang === "es" ? c.title_es : c.title_en;
    const desc = lang === "es" ? c.desc_es : c.desc_en;
    const watched = isWatched(c.id);

    const card = document.createElement("article");
    card.className = "card" + (watched ? " is-watched" : "");
    card.setAttribute("role", "listitem");
    card.dataset.chapterId = c.id;
    card.dataset.index = String(idx);

    const thumb = document.createElement("div");
    thumb.className = "card__thumb";

    const img = document.createElement("img");
    img.src = getThumbPathForIndex(idx);
    img.alt = `${title} thumbnail`;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => img.remove());

    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = `${formatTimeSeconds(seconds)}`;

    thumb.appendChild(img);
    thumb.appendChild(chip);

    const body = document.createElement("div");
    body.className = "card__body";

    const h3 = document.createElement("h3");
    h3.className = "card__title";
    h3.textContent = title;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    meta.innerHTML = `<span><strong>${lang === "es" ? "Capítulo" : "Chapter"}</strong> ${String(idx + 1).padStart(2, "0")}</span><span>•</span><span>${formatTimeSeconds(seconds)}</span>`;

    const p = document.createElement("p");
    p.className = "card__desc";
    p.textContent = desc;

    body.appendChild(h3);
    body.appendChild(meta);
    body.appendChild(p);

    const actions = document.createElement("div");
    actions.className = "card__actions";

    const btn = document.createElement("button");
    btn.className = "btn btn--primary card__btn";
    btn.type = "button";
    btn.setAttribute("aria-label", `${lang === "es" ? "Reproducir" : "Play"} ${title} (${formatTimeSeconds(seconds)})`);
    btn.innerHTML = `<span aria-hidden="true">▶</span><span>${lang === "es" ? "Ver capítulo" : "Watch chapter"}</span>`;
    btn.addEventListener("click", () => playChapter(idx));

    actions.appendChild(btn);

    card.appendChild(thumb);
    card.appendChild(body);
    card.appendChild(actions);

    card.tabIndex = 0;
    card.addEventListener("keydown", (e) => {
      const cards = Array.from(rail.querySelectorAll(".card"));
      const i = cards.indexOf(card);
      if (e.key === "ArrowRight") { e.preventDefault(); (cards[i + 1] || cards[0]).focus(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); (cards[i - 1] || cards[cards.length - 1]).focus(); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playChapter(idx); }
    });

    rail.appendChild(card);
  });

  updatePlayingIndicator();
}

/* ---------- Desktop/Mobile rail scroll buttons ---------- */
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

  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") rail.scrollBy({ left: 80, behavior: "auto" });
    if (e.key === "ArrowLeft") rail.scrollBy({ left: -80, behavior: "auto" });
  });
}

/* ---------- Copy chapters ---------- */
function buildChapterListText() {
  return CHAPTERS.map((c, i) => `${String(i + 1).padStart(2, "0")}  ${c.time}  ${c.title_en}`).join("\n");
}
function setupCopyChapters() {
  const btn = $("#copyChapters");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const text = buildChapterListText();
    const lang = getPref(STORAGE_KEYS.lang, "en");
    try {
      await navigator.clipboard.writeText(text);
      btn.querySelector("span:last-child").textContent = lang === "es" ? "¡Copiado!" : "Copied!";
      window.setTimeout(() => {
        $("#copyChaptersLabel").textContent = I18N[lang].copyChaptersLabel;
      }, 1400);
    } catch {
      window.prompt(lang === "es" ? "Copiar capítulos:" : "Copy chapters:", text);
    }
  });
}

/* ---------- Now Playing UI ---------- */
function syncNowPlayingUI(lang) {
  const t = I18N[lang];
  $("#npKicker").textContent = t.npKicker;

  if (currentChapterIndex < 0) {
    $("#npTitle").textContent = "—";
    $("#npMeta").textContent = lang === "es" ? "Selecciona un capítulo para comenzar" : "Select a chapter to begin";
    $("#npPrev").disabled = true;
    $("#npNext").disabled = true;
    return;
  }

  const c = CHAPTERS[currentChapterIndex];
  const title = lang === "es" ? c.title_es : c.title_en;
  $("#npTitle").textContent = title;
  $("#npMeta").textContent = `${formatTimeSeconds(currentStart)} → ${formatTimeSeconds(currentEnd || currentStart)}`;

  $("#npPrev").disabled = currentChapterIndex === 0;
  $("#npNext").disabled = currentChapterIndex === CHAPTERS.length - 1;
}

function setupNowPlayingControls() {
  $("#npPrev").addEventListener("click", () => {
    if (currentChapterIndex > 0) playChapter(currentChapterIndex - 1);
  });
  $("#npNext").addEventListener("click", () => {
    if (currentChapterIndex < CHAPTERS.length - 1) playChapter(currentChapterIndex + 1);
  });
}

/* ---------- Playing Indicator (glow stroke) ---------- */
function updatePlayingIndicator() {
  const cards = $all(".card");
  cards.forEach(card => {
    const idx = Number(card.dataset.index);
    card.classList.toggle("is-playing", idx === currentChapterIndex);
  });
}

/* ---------- YouTube Iframe API ---------- */
/**
 * Called automatically by the YouTube Iframe API when it’s ready.
 * DO NOT rename this function.
 */
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("ytPlayer", {
    videoId: VIDEO_ID,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerReady() {
  // no-op
}

function onPlayerStateChange(event) {
  // When playing starts, mark watched for current chapter
  if (event.data === YT.PlayerState.PLAYING) {
    if (currentChapterIndex >= 0 && !hasMarkedWatched) {
      const id = CHAPTERS[currentChapterIndex].id;
      setWatched(id);
      hasMarkedWatched = true;
      renderEpisodes(getPref(STORAGE_KEYS.lang, "en")); // refresh watched badges
    }
    startPolling();
  }

  // If paused or ended, stop polling
  if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    stopPolling();
  }
}

function startPolling() {
  stopPolling();
  pollTimer = window.setInterval(() => {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;

    const t = ytPlayer.getCurrentTime();

    // if we are in chapter mode, enforce end boundary
    if (currentChapterIndex >= 0 && currentEnd > 0 && t >= (currentEnd - 0.15)) {
      ytPlayer.pauseVideo();
      ytPlayer.seekTo(currentEnd, true);
      stopPolling();

      const lang = getPref(STORAGE_KEYS.lang, "en");
      $("#playerHint").textContent = lang === "es"
        ? "Fin del capítulo. Usa Siguiente / Anterior o selecciona otro capítulo."
        : "End of chapter. Use Next/Prev or select another chapter.";
    }
  }, 200);
}

function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = null;
}

/* ---------- Chapter playback (bite-sized) ---------- */
function computeChapterWindow(index) {
  const start = parseTimeToSeconds(CHAPTERS[index].time);
  const next = CHAPTERS[index + 1] ? parseTimeToSeconds(CHAPTERS[index + 1].time) : 0;

  // end is next chapter start. For last chapter: if duration available, use it; else 0 (no hard stop).
  let end = next;
  if (!end && ytPlayer && typeof ytPlayer.getDuration === "function") {
    const dur = ytPlayer.getDuration();
    if (dur && dur > start) end = dur;
  }
  return { start, end };
}

function playChapter(index) {
  if (!ytPlayer) {
    // In case API hasn't initialized yet
    const lang = getPref(STORAGE_KEYS.lang, "en");
    $("#playerHint").textContent = lang === "es" ? "Cargando reproductor..." : "Loading player...";
    return;
  }

  currentChapterIndex = index;
  const w = computeChapterWindow(index);
  currentStart = w.start;
  currentEnd = w.end;

  hasMarkedWatched = false;
  updatePlayingIndicator();

  const lang = getPref(STORAGE_KEYS.lang, "en");
  const c = CHAPTERS[index];
  const title = lang === "es" ? c.title_es : c.title_en;

  // scroll to player
  $("#watch").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

  // Seek and play
  ytPlayer.seekTo(currentStart, true);
  ytPlayer.playVideo();

  // Update hint + now playing
  $("#playerHint").textContent = lang === "es"
    ? `Reproduciendo: ${title} (${formatTimeSeconds(currentStart)} → ${formatTimeSeconds(currentEnd || currentStart)})`
    : `Playing: ${title} (${formatTimeSeconds(currentStart)} → ${formatTimeSeconds(currentEnd || currentStart)})`;

  syncNowPlayingUI(lang);

  // Helpful: auto-select chapter in feedback dropdown
  const fbSel = $("#fbEpisode");
  if (fbSel) fbSel.value = c.id;

  // keep glow state accurate even after rerenders
  window.setTimeout(updatePlayingIndicator, 50);
}

/* ---------- Feedback Tracking ---------- */
function getFeedback() {
  return safeJSONParse(getPref(STORAGE_KEYS.feedback, "[]"), []);
}
function setFeedback(list) {
  setPref(STORAGE_KEYS.feedback, JSON.stringify(list));
}
function addFeedback(entry) {
  const list = getFeedback();
  list.unshift(entry);
  setFeedback(list);
}

function renderFeedbackSelect(lang) {
  const sel = $("#fbEpisode");
  if (!sel) return;

  const currentValue = sel.value;
  sel.innerHTML = `<option value="" disabled ${currentValue ? "" : "selected"}>${lang === "es" ? "Selecciona un capítulo" : "Select a chapter"}</option>`;

  CHAPTERS.forEach((c, idx) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${String(idx + 1).padStart(2, "0")} — ${formatTimeSeconds(parseTimeToSeconds(c.time))} — ${lang === "es" ? c.title_es : c.title_en}`;
    sel.appendChild(opt);
  });

  // restore selection if possible
  if (currentValue) sel.value = currentValue;
}

function typeLabel(type, lang) {
  const map = {
    content: { en: "Content change", es: "Cambio de contenido" },
    timing: { en: "Timing / boundaries", es: "Tiempo / límites" },
    visual: { en: "Visual / design", es: "Visual / diseño" },
    accessibility: { en: "Accessibility", es: "Accesibilidad" },
    bug: { en: "Bug / playback", es: "Error / reproducción" },
    other: { en: "Other", es: "Otro" },
  };
  return (map[type] && map[type][lang]) ? map[type][lang] : type;
}

function findChapterById(id) {
  return CHAPTERS.findIndex(c => c.id === id);
}

function renderFeedbackList(lang) {
  const listEl = $("#feedbackList");
  if (!listEl) return;

  const list = getFeedback();
  if (!list.length) {
    listEl.innerHTML = `<p class="small">${lang === "es" ? "Aún no hay comentarios." : "No feedback yet."}</p>`;
    return;
  }

  listEl.innerHTML = "";
  list.forEach(item => {
    const idx = findChapterById(item.episodeId);
    const chapter = CHAPTERS[idx] || null;

    const title = chapter
      ? (lang === "es" ? chapter.title_es : chapter.title_en)
      : (lang === "es" ? "Capítulo desconocido" : "Unknown chapter");

    const time = chapter ? formatTimeSeconds(parseTimeToSeconds(chapter.time)) : "--:--";
    const watched = chapter ? isWatched(chapter.id) : false;

    const div = document.createElement("div");
    div.className = "fb-item";
    div.setAttribute("role", "listitem");

    div.innerHTML = `
      <div class="fb-item__top">
        <p class="fb-item__title">${title}</p>
        <p class="fb-item__meta">${time} • ${typeLabel(item.type, lang)} • ${new Date(item.createdAt).toLocaleString()}</p>
      </div>
      <p class="fb-item__meta">${lang === "es" ? "Visto" : "Watched"}: <strong>${watched ? (lang === "es" ? "Sí" : "Yes") : (lang === "es" ? "No" : "No")}</strong></p>
      <p class="fb-item__notes">${escapeHTML(item.notes)}</p>
    `;
    listEl.appendChild(div);
  });
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupFeedback() {
  const form = $("#feedbackForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const lang = getPref(STORAGE_KEYS.lang, "en");

    const episodeId = $("#fbEpisode").value;
    const type = $("#fbType").value;
    const notes = $("#fbNotes").value.trim();

    if (!episodeId || !notes) return;

    addFeedback({
      episodeId,
      type,
      notes,
      createdAt: new Date().toISOString()
    });

    $("#fbNotes").value = "";
    renderFeedbackList(lang);

    $("#playerHint").textContent = lang === "es"
      ? "Comentario agregado y vinculado al capítulo seleccionado."
      : "Feedback added and linked to the selected chapter.";
  });

  $("#exportFeedback").addEventListener("click", () => {
    const data = getFeedback();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  $("#clearFeedback").addEventListener("click", () => {
    const lang = getPref(STORAGE_KEYS.lang, "en");
    if (!confirm(lang === "es" ? "¿Borrar comentarios en este dispositivo?" : "Clear feedback on this device?")) return;
    setFeedback([]);
    renderFeedbackList(lang);
  });
}

/* ---------- Init ---------- */
function init() {
  $("#year").textContent = new Date().getFullYear();

  // Theme: ALWAYS start in dark mode unless user already saved a preference
  const savedTheme = getPref(STORAGE_KEYS.theme, "");
  applyTheme(savedTheme || "dark");
  $("#themeToggle").addEventListener("click", toggleTheme);

  // Language
  const savedLang = getPref(STORAGE_KEYS.lang, "en");

  // Hero
  heroPaused = getPref(STORAGE_KEYS.heroPaused, "0") === "1";
  if (prefersReducedMotion()) heroPaused = true;

  renderHeroSlides(savedLang);
  setHeroActive(0);

  $("#heroPrev").addEventListener("click", () => goToHero(heroIndex - 1, true));
  $("#heroNext").addEventListener("click", () => goToHero(heroIndex + 1, true));
  $("#heroPlayPause").addEventListener("click", toggleHeroPlayPause);

  const pp = $("#heroPlayPause");
  pp.setAttribute("aria-pressed", String(heroPaused));
  pp.textContent = heroPaused ? "▶" : "❚❚";
  pp.setAttribute("aria-label", heroPaused ? "Play slideshow" : "Pause slideshow");
  restartHeroTimer();

  // Episodes UI
  setupRailControls();
  setupCopyChapters();
  setupNowPlayingControls();

  // Feedback
  setupFeedback();

  // Apply language AFTER rendering hero so alt text updates
  applyLanguage(savedLang);
  $("#langToggle").addEventListener("click", toggleLanguage);

  // initial now playing
  syncNowPlayingUI(savedLang);

  // populate feedback select + list on load
  renderFeedbackSelect(savedLang);
  renderFeedbackList(savedLang);
}

document.addEventListener("DOMContentLoaded", init);
