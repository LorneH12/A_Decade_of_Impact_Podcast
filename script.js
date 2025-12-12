/* =========================================================
   A Decade of Impact — MDTP Stakeholder Review
   script.js

   Signature features:
   - Light / Dark mode toggle with persistence
   - EN / ES language toggle with persistence
   - Hero slideshow
   - Episode → YouTube timestamp jumping
   ========================================================= */

/* ------------------------------
   Helpers
--------------------------------*/
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ------------------------------
   THEME (Light / Dark)
--------------------------------*/
const themeToggle = qs("#themeToggle");
const root = document.documentElement;

const getPreferredTheme = () => {
  const stored = localStorage.getItem("theme");
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const setTheme = (theme) => {
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
  localStorage.setItem("theme", theme);
};

setTheme(getPreferredTheme());

themeToggle?.addEventListener("click", () => {
  const isDark = root.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "light" : "dark");
});

/* ------------------------------
   LANGUAGE (EN / ES)
--------------------------------*/
const langSelect = qs("#langSelect");
const htmlEl = qs("html");

/*
  NOTE:
  Spanish translations are intentionally
  clear, professional, and stakeholder-safe
*/
const i18n = {
  en: {
    "nav.watchFull": "Watch Full",
    "nav.episodes": "Episodes",
    "nav.support": "Support",
    "pill.stakeholder": "Stakeholder Review",
    "cta.openYouTube": "Open on YouTube",

    "hero.title": "A Decade of Impact",
    "hero.sub": "Presented by the <strong>Million Dollar Teacher Project</strong>",
    "hero.ctaWatch": "Watch Full (56 min)",
    "hero.ctaEpisodes": "Jump to Episodes",

    "title.subtitle":
      "Teachers Reflect on What Changed, What Didn’t, and What Still Matters",

    "speakers.hostedBy": "Hosted by",
    "speakers.featuring": "Featuring",
    "speakers.kashunaMeta": "Host | Million Dollar Teacher Project",
    "speakers.kimMeta": "Retired Educator | MDTP Partner",
    "speakers.bridgetMeta": "Retired Educator | MDTP Thought Partner",

    "desc.main":
      "In celebration of a decade of service, the Million Dollar Teacher Project sits down with retired Arizona educators to reflect on the realities of teaching, the evolution of education, and the human impact behind the profession. This page is designed for partners, funders, and stakeholders to review the full conversation or jump to key themes.",

    "watch.title": "Watch the Full Conversation <span class='muted'>(56 minutes)</span>",
    "watch.hint": "Chapters available below",
    "watch.openYT": "Open in YouTube",
    "watch.tipLabel": "Tip:",
    "watch.tipValue": "Click an episode below to jump to the exact timestamp.",

    "episodes.title": "Episodes <span class='muted'>(chapters)</span>",
    "episodes.note":
      "Note: chapter start times can be fine-tuned once final timestamps are verified.",

    "ep.01.title": "The Origin Stories",
    "ep.01.desc": "How they entered teaching and the mentors who shaped the journey.",
    "ep.02.title": "More Than a Classroom",
    "ep.02.desc": "The emotional labor of teaching and showing up for students.",
    "ep.03.title": "Encouragement Matters",
    "ep.03.desc": "Support systems, confidence, and what helps teachers thrive.",
    "ep.04.title": "Connection First",
    "ep.04.desc": "Trust, relationships, and why connection comes before instruction.",
    "ep.05.title": "AI & Education",
    "ep.05.desc": "Technology’s role and why the human line still matters most.",
    "ep.06.title": "What Worked",
    "ep.06.desc": "Collaboration, alignment, and what genuinely moved education forward.",
    "ep.07.title": "Beyond the Data",
    "ep.07.desc":
      "When measurement replaced humanity and what it cost teachers and students.",
    "ep.08.title": "What Must Change",
    "ep.08.desc":
      "Respect, partnership, and what the next decade should prioritize.",

    "support.title": "Support MDTP",
    "support.body":
      "Kashuna is wearing the Teaching is Dope tax credit fundraising shirt. Purchases support the work of the Million Dollar Teacher Project.",
    "support.ctaStore": "View on MDTP Store",
    "support.ctaVisit": "Visit MDTP",

    "footer.meta": "A Decade of Impact — Stakeholder Review"
  },

  es: {
    "nav.watchFull": "Ver completo",
    "nav.episodes": "Episodios",
    "nav.support": "Apoyar",
    "pill.stakeholder": "Revisión para socios",
    "cta.openYouTube": "Abrir en YouTube",

    "hero.title": "Una Década de Impacto",
    "hero.sub": "Presentado por el <strong>Million Dollar Teacher Project</strong>",
    "hero.ctaWatch": "Ver completo (56 min)",
    "hero.ctaEpisodes": "Ir a episodios",

    "title.subtitle":
      "Docentes reflexionan sobre lo que cambió, lo que no, y lo que sigue siendo importante",

    "speakers.hostedBy": "Presentado por",
    "speakers.featuring": "Con la participación de",
    "speakers.kashunaMeta": "Anfitriona | Million Dollar Teacher Project",
    "speakers.kimMeta": "Docente retirada | Socia de MDTP",
    "speakers.bridgetMeta": "Docente retirada | Aliada estratégica de MDTP",

    "desc.main":
      "En celebración de una década de servicio, el Million Dollar Teacher Project conversa con docentes retirados de Arizona para reflexionar sobre la realidad de la enseñanza, la evolución de la educación y el impacto humano de la profesión. Esta página está diseñada para socios, financiadores y partes interesadas que deseen revisar la conversación completa o ir directamente a temas clave.",

    "watch.title": "Ver la conversación completa <span class='muted'>(56 minutos)</span>",
    "watch.hint": "Capítulos disponibles abajo",
    "watch.openYT": "Abrir en YouTube",
    "watch.tipLabel": "Consejo:",
    "watch.tipValue":
      "Haz clic en un episodio para ir directamente al momento exacto.",

    "episodes.title": "Episodios <span class='muted'>(capítulos)</span>",
    "episodes.note":
      "Nota: los tiempos de inicio pueden ajustarse cuando se verifiquen los capítulos finales.",

    "ep.01.title": "Historias de origen",
    "ep.01.desc":
      "Cómo comenzaron en la docencia y quiénes influyeron en su camino.",
    "ep.02.title": "Más que un aula",
    "ep.02.desc":
      "El trabajo emocional de enseñar y estar presente para los estudiantes.",
    "ep.03.title": "La importancia del ánimo",
    "ep.03.desc":
      "Sistemas de apoyo, confianza y lo que ayuda a los docentes a prosperar.",
    "ep.04.title": "La conexión primero",
    "ep.04.desc":
      "La confianza y las relaciones como base de la enseñanza.",
    "ep.05.title": "IA y educación",
    "ep.05.desc":
      "El papel de la tecnología y por qué lo humano sigue siendo esencial.",
    "ep.06.title": "Lo que funcionó",
    "ep.06.desc":
      "Colaboración, alineación y avances reales en la educación.",
    "ep.07.title": "Más allá de los datos",
    "ep.07.desc":
      "Cuando la medición reemplazó a la humanidad y su costo.",
    "ep.08.title": "Lo que debe cambiar",
    "ep.08.desc":
      "Respeto, colaboración y prioridades para la próxima década.",

    "support.title": "Apoya a MDTP",
    "support.body":
      "Kashuna lleva puesta la camiseta Teaching is Dope, una iniciativa de crédito fiscal. Las compras apoyan el trabajo del Million Dollar Teacher Project.",
    "support.ctaStore": "Ver en la tienda de MDTP",
    "support.ctaVisit": "Visitar MDTP",

    "footer.meta": "Una Década de Impacto — Revisión para socios"
  }
};

const setLanguage = (lang) => {
  htmlEl.setAttribute("lang", lang);
  htmlEl.setAttribute("data-lang", lang);
  localStorage.setItem("lang", lang);

  qsa("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang] && i18n[lang][key]) {
      el.innerHTML = i18n[lang][key];
    }
  });
};

const storedLang = localStorage.getItem("lang") || "en";
langSelect.value = storedLang;
setLanguage(storedLang);

langSelect.addEventListener("change", (e) => {
  setLanguage(e.target.value);
});

/* ------------------------------
   HERO SLIDESHOW
--------------------------------*/
const heroMedia = qs("#heroMedia");

if (heroMedia) {
  const images = JSON.parse(heroMedia.dataset.hero || "[]");
  let index = 0;

  const setHero = () => {
    heroMedia.style.backgroundImage = `url(${images[index]})`;
  };

  if (images.length) {
    setHero();
    setInterval(() => {
      index = (index + 1) % images.length;
      setHero();
    }, 7000);
  }
}

/* ------------------------------
   EPISODE → YOUTUBE SEEK
--------------------------------*/
const ytPlayer = qs("#ytPlayer");

qsa(".episodeCard").forEach(card => {
  const start = card.dataset.start;

  const play = () => {
    if (!start) return;
    ytPlayer.src =
      `https://www.youtube.com/embed/8XJr7USptS8?start=${start}&autoplay=1&rel=0&modestbranding=1`;
    ytPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  card.addEventListener("click", play);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      play();
    }
  });
});

/* ------------------------------
   EPISODE RAIL SCROLL BUTTONS
--------------------------------*/
const rail = qs("#episodeRail");
qs("#scrollLeft")?.addEventListener("click", () => {
  rail?.scrollBy({ left: -320, behavior: "smooth" });
});
qs("#scrollRight")?.addEventListener("click", () => {
  rail?.scrollBy({ left: 320, behavior: "smooth" });
});
