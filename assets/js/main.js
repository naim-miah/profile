(() => {
  "use strict";

  // helpers
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =========================
     MENU SHOW
  ========================= */
  const showMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId);
    const nav = document.getElementById(navId);
    if (!toggle || !nav) return;

    const toggleNav = () => nav.classList.toggle("show");
    toggle.addEventListener("click", toggleNav);
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") toggleNav();
    });
  };
  showMenu("nav-toggle", "nav-menu");

  /* =========================
     REMOVE MENU MOBILE
  ========================= */
  $$(".nav__link").forEach((n) =>
    n.addEventListener("click", () => {
      const navMenu = $("#nav-menu");
      navMenu?.classList.remove("show");
    })
  );

  /* =========================
     ACTIVE LINK ON SCROLL
  ========================= */
  const sections = $$("section[id]");
  const scrollActive = () => {
    const scrollDown = window.scrollY;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 80;
      const sectionId = current.getAttribute("id");
      const link = document.querySelector(`.nav__menu a[href*="${sectionId}"]`);
      if (!link) return;

      if (scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight) {
        link.classList.add("active-link");
      } else {
        link.classList.remove("active-link");
      }
    });
  };
  window.addEventListener("scroll", scrollActive);

  /* =========================
     HEADER + BACK TO TOP
  ========================= */
  const header = $("#header");
  const toTop = $("#toTop");

  const isLightTheme = () => document.documentElement.dataset.theme === "light";

  const headerBorderColor = (scrolled) => {
    if (isLightTheme()) {
      return scrolled ? "rgba(11,16,32,.16)" : "rgba(11,16,32,.10)";
    }
    return scrolled ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.08)";
  };

  const onScrollUI = () => {
    const y = window.scrollY;

    if (header) header.style.borderBottomColor = headerBorderColor(y > 10);

    if (toTop) {
      if (y > 600) toTop.classList.add("show");
      else toTop.classList.remove("show");
    }
  };

  window.addEventListener("scroll", onScrollUI);
  onScrollUI();

  toTop?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  /* =========================
     FOOTER AUTO YEAR
  ========================= */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================
     THEME TOGGLE (Day/Night)
  ========================= */
  const themeBtn = $("#theme-toggle");
  const themeIcon = $("#theme-icon");
  const STORAGE_KEY = "naim_theme";
  const mq = window.matchMedia?.("(prefers-color-scheme: light)");

  const preferredTheme = () => (mq?.matches ? "light" : "dark");

  const applyTheme = (theme, persist = true) => {
    document.documentElement.dataset.theme = theme;

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (_) {}
    }

    if (themeIcon) themeIcon.className = theme === "light" ? "bx bx-sun" : "bx bx-moon";
    themeBtn?.setAttribute(
      "aria-label",
      theme === "light" ? "Switch to dark mode" : "Switch to light mode"
    );

    if (header) header.style.borderBottomColor = headerBorderColor(window.scrollY > 10);
  };

  const getSavedTheme = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  };

  // initial
  applyTheme(getSavedTheme() || preferredTheme(), false);

  themeBtn?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    applyTheme(current === "dark" ? "light" : "dark", true);
  });

  // if user never chose manually, follow system changes
  mq?.addEventListener?.("change", () => {
    if (!getSavedTheme()) applyTheme(preferredTheme(), false);
  });

  /* =========================
     SCROLL REVEAL
  ========================= */
  if (window.ScrollReveal) {
    const sr = ScrollReveal({
      origin: "top",
      distance: "60px",
      duration: 1600,
      delay: 120,
    });

    sr.reveal(".home__title, .hero__value, .hero__badges, .hero__cta", {});
    sr.reveal(".hero__blobWrap, .hero__stats", { delay: 250 });
    sr.reveal(".section-title", { interval: 100 });
    sr.reveal(".card, .project", { interval: 120 });
  }

  /* =========================
     CURSOR GLOW
  ========================= */
  const glow = $("#cursor-glow");
  let mouseX = 0, mouseY = 0, rafId = null;

  const animateGlow = () => {
    if (!glow) return;
    glow.style.left = mouseX + "px";
    glow.style.top = mouseY + "px";
    rafId = null;
  };

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!rafId) rafId = requestAnimationFrame(animateGlow);
  });

  /* =========================
     CARD SPOTLIGHT
  ========================= */
  $$("[data-spotlight]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--sx", `${x}%`);
      el.style.setProperty("--sy", `${y}%`);
    });

    el.addEventListener("pointerleave", () => {
      el.style.removeProperty("--sx");
      el.style.removeProperty("--sy");
    });
  });

  /* =========================
     GALLERY MODAL
  ========================= */
  const modal = $("#galleryModal");
  const grid = $("#galleryGrid");
  const title = $("#galleryTitle");

  const openModal = (imgs, t) => {
    if (!modal || !grid) return;

    grid.innerHTML = "";
    if (title) title.textContent = t || "Gallery";

    if (!imgs.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "No images added in data-gallery yet.";
      grid.appendChild(p);
    } else {
      imgs.forEach((src) => {
        const s = (src || "").trim();
        if (!s) return;
        const img = document.createElement("img");
        img.src = s;
        img.alt = (t || "Gallery") + " image";
        img.className = "modal__img";
        grid.appendChild(img);
      });
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".galleryBtn");
    if (btn) {
      const imgs = (btn.dataset.gallery || "").split(",").filter(Boolean);
      openModal(imgs, btn.dataset.title || "Gallery");
      return;
    }

    if (e.target.closest?.("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
  });

  /* =========================
     CONTACT FORM (mailto)
  ========================= */
  const form = $("#contact-form");
  const statusEl = $("#form-status");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    if (fd.get("company")) return; // honeypot

    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (!name || !email || !message) {
      if (statusEl) statusEl.textContent = "Please fill in all fields.";
      return;
    }

    const btn = form.querySelector("button[type='submit']");
    btn?.classList.add("isLoading");
    if (statusEl) statusEl.textContent = "Preparing email...";

    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);

    setTimeout(() => {
      window.location.href = `mailto:m.naim0502@gmail.com?subject=${subject}&body=${body}`;
      btn?.classList.remove("isLoading");
      if (statusEl) statusEl.textContent = "✅ Opening your email app… (message ready)";
      form.reset();
    }, 700);
  });
})();


/* ===== WhatsApp smart link (mobile app / desktop web) ===== */
(() => {
  const links = document.querySelectorAll("[data-wa-phone]");
  if (!links.length) return;

  const isMobile = () =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.matchMedia?.("(pointer: coarse)")?.matches;

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();

      const phone = (a.dataset.waPhone || "").trim();
      const text = (a.dataset.waText || "").trim();
      if (!phone) return;

      const encText = encodeURIComponent(text);
      const url = isMobile()
        ? `https://wa.me/${phone}?text=${encText}`
        : `https://web.whatsapp.com/send?phone=${phone}&text=${encText}`;

      // Try opening new tab; fallback to same tab if blocked
      const w = window.open(url, "_blank", "noopener");
      if (!w) window.location.href = url;
    });
  });
})();
