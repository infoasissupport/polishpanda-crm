/* =============================================================
   WashFlow Landing Page — interactions & animation
   Hero -> background video
   Three.js  -> ambient contact-section backdrop
   GSAP + ScrollTrigger -> scroll reveals, counters, workflow line
   ============================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Register plugins as soon as they're available — several init functions
  // call ScrollTrigger.create()/scrollTrigger:{} before initGsap() runs, so
  // registration can't be deferred until then.
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Mobile browsers resize the visual viewport as the address bar shows/hides,
  // but `vh` units are computed against a different (larger or smaller)
  // viewport depending on the browser — so the hero's `NNNvh` scroll-jack
  // height and GSAP's own window.innerHeight-based pin math end up measuring
  // two different numbers. That drift is what shows up as extra scrollable
  // space past the real end of the page. Pin the hero's height to a JS-measured
  // custom property instead so both sides always agree.
  function setVhVar() {
    document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
  }
  setVhVar();
  let vhResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(vhResizeTimer);
    vhResizeTimer = setTimeout(() => {
      setVhVar();
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    }, 200);
  });
  window.addEventListener("orientationchange", () => {
    setVhVar();
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  });

  /* ---------------------------------------------------------
     THREE.JS — Contact section soft particle glow
  --------------------------------------------------------- */
  function initContactScene() {
    const canvas = document.getElementById("contact-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 18;

    const geo = new THREE.BufferGeometry();
    const count = 160;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xff741f, size: 0.09, transparent: true, opacity: 0.55 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.03;
      points.rotation.x = Math.sin(t * 0.1) * 0.1;
      renderer.render(scene, camera);
    }
    if (!prefersReducedMotion) animate();
    else renderer.render(scene, camera);
  }

  /* ---------------------------------------------------------
     GSAP — scroll reveals, hero entrance, counters, workflow
  --------------------------------------------------------- */
  function initGsap() {
    if (typeof gsap === "undefined") return;

    // Hero entrance
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .to(".cine-hero [data-reveal]", { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 });

    // Generic [data-reveal] outside hero
    document.querySelectorAll("section:not(.cine-hero) [data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" }
      });
    });

    // Directional reveals — two-column sections slide in from their own side
    document.querySelectorAll("[data-reveal-left]").forEach((el) => {
      gsap.to(el, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    document.querySelectorAll("[data-reveal-right]").forEach((el) => {
      gsap.to(el, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });

    // Staggered grids/lists — pop in with a slight scale for more punch
    document.querySelectorAll(".reveal-stagger").forEach((group) => {
      gsap.to(group.children, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: "back.out(1.5)",
        scrollTrigger: { trigger: group, start: "top 85%" }
      });
    });

    // Trusted counter (250+)
    gsap.to(".trusted__stat", {
      scrollTrigger: { trigger: ".trusted__stat", start: "top 90%", once: true },
      onStart: () => animateCounter(document.querySelector(".trusted__stat .counter"))
    });

    // Workflow connecting line + step pop-in
    ScrollTrigger.create({
      trigger: ".workflow__track",
      start: "top 70%",
      end: "bottom 60%",
      scrub: 0.6,
      onUpdate: (self) => {
        gsap.set(".workflow__line-fill", { width: `${self.progress * 100}%` });
      }
    });
    gsap.to(".wstep", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.12,
      ease: "back.out(1.6)",
      scrollTrigger: { trigger: ".workflow__steps", start: "top 80%" }
    });

    // Pricing plan hover-lift already handled in CSS; add scroll reveal already covered by reveal-stagger

    // Section head reveal (not covered by data-reveal for some)
    gsap.utils.toArray(".section-head").forEach((el) => {
      gsap.from(el.children, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" }
      });
    });
  }

  function animateCounter(el) {
    if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    const target = parseFloat(el.getAttribute("data-target"));
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => (el.textContent = Math.floor(obj.val).toLocaleString("en-IN"))
    });
  }

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  function initNav() {
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("navMenu");
    const closeBtn = document.getElementById("navMenuClose");
    const overlay = document.getElementById("navOverlay");
    if (!burger || !menu) return;

    const openMenu = () => {
      menu.classList.add("nav__menu--open");
      if (overlay) overlay.classList.add("nav__overlay--show");
    };
    const closeMenu = () => {
      menu.classList.remove("nav__menu--open");
      if (overlay) overlay.classList.remove("nav__overlay--show");
    };

    burger.addEventListener("click", () => {
      menu.classList.contains("nav__menu--open") ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (overlay) overlay.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ---------------------------------------------------------
     Back to top
  --------------------------------------------------------- */
  function initToTop() {
    const btn = document.getElementById("toTop");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("to-top--show", window.scrollY > 600);
    });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------------------------------------------------------
     Screenshots slider
  --------------------------------------------------------- */
  function initSlider() {
    const track = document.getElementById("sliderTrack");
    const dotsWrap = document.getElementById("sliderDots");
    const prevBtn = document.getElementById("sliderPrev");
    const nextBtn = document.getElementById("sliderNext");
    if (!track) return;

    const slides = Array.from(track.children);
    let perView = getPerView();
    let index = 0;

    function getPerView() {
      const w = window.innerWidth;
      if (w <= 480) return 1;
      if (w <= 768) return 2;
      return 4;
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView);
    }

    function buildDots() {
      dotsWrap.innerHTML = "";
      const dotCount = maxIndex() + 1;
      for (let i = 0; i < dotCount; i++) {
        const d = document.createElement("span");
        if (i === index) d.classList.add("active");
        d.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(d);
      }
    }

    function update() {
      const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = 20;
      const offset = index * (slideWidth + gap);
      if (typeof gsap !== "undefined") {
        gsap.to(track, { x: -offset, duration: 0.55, ease: "power3.out" });
      } else {
        track.style.transform = `translateX(-${offset}px)`;
      }
      Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle("active", i === index));
    }

    function goTo(i) {
      index = Math.min(Math.max(i, 0), maxIndex());
      update();
    }

    prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn.addEventListener("click", () => goTo(index + 1));

    window.addEventListener("resize", () => {
      perView = getPerView();
      index = Math.min(index, maxIndex());
      buildDots();
      update();
    });

    buildDots();
    update();

    // autoplay
    let autoplay = setInterval(() => {
      index = index >= maxIndex() ? 0 : index + 1;
      update();
      Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle("active", i === index));
    }, 4200);
    track.closest(".shots").addEventListener("mouseenter", () => clearInterval(autoplay));
  }

  /* ---------------------------------------------------------
     FAQ Accordion
  --------------------------------------------------------- */
  function initAccordion() {
    document.querySelectorAll(".acc-item").forEach((item) => {
      const head = item.querySelector(".acc-head");
      head.addEventListener("click", () => {
        const isOpen = item.classList.contains("acc-item--open");
        item.parentElement.querySelectorAll(".acc-item").forEach((i) => i.classList.remove("acc-item--open"));
        if (!isOpen) item.classList.add("acc-item--open");
      });
    });
  }

  /* ---------------------------------------------------------
     Mobile responsive tabs (customer/staff)
  --------------------------------------------------------- */
  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".phone__panel");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("tab--active"));
        tab.classList.add("tab--active");
        const target = tab.dataset.tab;
        panels.forEach((p) => p.classList.toggle("phone__panel--active", p.dataset.panel === target));
      });
    });
  }

  /* ---------------------------------------------------------
     Fallback: if GSAP failed to load from the CDN (offline,
     blocked, etc.), CSS still hides [data-reveal] waiting for JS
     to reveal it — force-show instead of staying blank.
  --------------------------------------------------------- */
  function initFallbackReveal() {
    if (typeof gsap !== "undefined") return;
    document.querySelectorAll("[data-reveal], [data-reveal-left], [data-reveal-right]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll(".counter").forEach((el) => {
      el.textContent = parseFloat(el.getAttribute("data-target")).toLocaleString("en-IN");
    });
    document.querySelectorAll(".reveal-stagger").forEach((group) => {
      Array.from(group.children).forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    });
  }

  /* ---------------------------------------------------------
     Navbar — solidifies once the page has scrolled past the hero
  --------------------------------------------------------- */
  function initNavScroll() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const update = () => nav.classList.toggle("nav--scrolled", window.scrollY > 40);
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------------------------------------------------------
     Parallax — [data-parallax="0.1"] elements drift as their
     section scrolls through the viewport.
  --------------------------------------------------------- */
  function initParallax() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined" || prefersReducedMotion) return;
    document.querySelectorAll("[data-parallax]").forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      gsap.to(el, {
        yPercent: speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") || el,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Hero — background video. Autoplay is skipped for
     prefers-reduced-motion users, who get the poster frame instead.
  --------------------------------------------------------- */
  function initHeroVideo() {
    const video = document.getElementById("heroVideo");
    if (!video) return;
    if (prefersReducedMotion) {
      video.removeAttribute("autoplay");
      video.pause();
    }
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initNavScroll();
    initToTop();
    initSlider();
    initAccordion();
    initTabs();
    initHeroVideo();
    initContactScene();
    initGsap();
    initParallax();
    initFallbackReveal();

    // Web fonts and images finishing after DOMContentLoaded can shift page
    // height (e.g. FOUT reflow), leaving ScrollTrigger's cached section
    // positions stale — refresh once things settle so reveal/parallax
    // triggers can't drift from the real rendered layout.
    if (typeof ScrollTrigger !== "undefined") {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setVhVar();
          ScrollTrigger.refresh();
        });
      }
      window.addEventListener("load", () => {
        setVhVar();
        ScrollTrigger.refresh();
      });
    }
  });
})();



document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

document.addEventListener("keydown", function (e) {
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
    (e.ctrlKey && e.key === "U")
  ) {
    e.preventDefault();
  }
});