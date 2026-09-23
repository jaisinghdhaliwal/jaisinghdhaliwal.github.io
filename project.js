// A full-screen, scroll-controlled Workbench → Blender → Fortnite wipe.
document.querySelectorAll('.case-body > .scene-modes').forEach(viewer => {
  const images = [...viewer.querySelectorAll('.scene-mode-image')];
  if (images.length !== 3 || images[0].dataset.sceneLabel !== 'Workbench') return;

  viewer.classList.add('scene-scroll');
  const stage = viewer.querySelector('.scene-mode-stage');
  const label = viewer.querySelector('.scene-mode-label');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  images.forEach((image, index) => {
    image.hidden = false;
    image.style.zIndex = index + 1;
  });

  let start = 0, travel = 1, frame = 0;

  function draw() {
    frame = 0;
    if (reduced.matches) return;

    const progress = Math.max(0, Math.min(2, (scrollY - start) / travel * 2));
    stage.style.setProperty('--scene-pan', `${progress * 50}%`);
    images[1].style.clipPath = `inset(0 0 0 ${(1 - Math.min(1, progress)) * 100}%)`;
    images[2].style.clipPath = `inset(0 0 0 ${(1 - Math.max(0, progress - 1)) * 100}%)`;

    label.textContent =
      images[Math.min(2, Math.floor(progress + .5))].dataset.sceneLabel;
  }

  function measure() {
    start = viewer.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, viewer.offsetHeight - stage.offsetHeight);
    draw();
  }

  window.addEventListener('scroll', () => {
    if (!frame && !reduced.matches) {
      frame = requestAnimationFrame(draw);
    }
  }, { passive: true });

  window.addEventListener('resize', measure);
  window.addEventListener('load', measure, { once: true });

  reduced.addEventListener('change', measure);

  // Earlier media and the horizontal gallery can change this section's position.
  new ResizeObserver(measure).observe(viewer.closest('.case-body'));

  measure();
});


// Shared scroll gallery: exhibition comparisons and explicitly marked photo cards.
const comparisonCards = [...document.querySelectorAll('.case-body > .scene-modes')]
  .filter(card =>
    card.querySelector('.scene-mode-stage')
      ?.getAttribute('aria-label')
      ?.startsWith('Physical and Fortnite') || card.hasAttribute('data-scroll-gallery-card')
  );

if (comparisonCards.length > 1) {
  const gallery = document.createElement('section');
  gallery.className = 'comparison-gallery';
  gallery.setAttribute(
    'aria-label',
    comparisonCards[0].dataset.galleryLabel || 'Physical exhibition and Fortnite comparisons'
  );

  gallery.innerHTML = `
    <div class="comparison-sticky">
      <div
        class="comparison-viewport"
        tabindex="0"
        role="region"
        aria-label="Project image gallery"
      >
        <div class="comparison-track"></div>
      </div>
      <div class="comparison-controls">
        <span class="comparison-count"></span>
        <button type="button" aria-label="Previous image">←</button>
        <button type="button" aria-label="Next image">→</button>
      </div>
    </div>
  `;

  comparisonCards[0].before(gallery);

  const viewport = gallery.querySelector('.comparison-viewport');
  const track = gallery.querySelector('.comparison-track');

  track.append(...comparisonCards);

  comparisonCards.forEach(card => {
    const image = card.querySelector('img');

    const fit = () => {
      const width =
        Number(image.getAttribute('width')) || image.naturalWidth;

      const height =
        Number(image.getAttribute('height')) || image.naturalHeight;

      if (width && height) {
        card.style.setProperty('--comparison-ratio', width / height);
      }
    };

    image.addEventListener('load', fit, { once: true });
    fit();
  });

  const count = gallery.querySelector('.comparison-count');
  const buttons = [...gallery.querySelectorAll('button')];

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');

  let distance = 0,
      start = 0,
      offsets = [],
      current = 0,
      frame = 0;

  function update() {
    frame = 0;

    const x = motion.matches
      ? Math.max(0, Math.min(distance, window.scrollY - start))
      : viewport.scrollLeft;

    if (motion.matches) {
      track.style.transform = `translate3d(${-x}px,0,0)`;
    }

    current = offsets.reduce(
      (best, offset, i) =>
        Math.abs(offset - x) < Math.abs(offsets[best] - x)
          ? i
          : best,
      0
    );

    count.textContent = `${current + 1} / ${comparisonCards.length}`;

    buttons[0].disabled = x <= 1;
    buttons[1].disabled = x >= distance - 1;
  }

  function schedule() {
    if (!frame) {
      frame = requestAnimationFrame(update);
    }
  }

  function measure() {
    gallery.classList.toggle('is-scroll-driven', motion.matches);

    track.style.transform = '';

    distance = Math.max(
      0,
      track.scrollWidth - viewport.clientWidth
    );

    offsets = comparisonCards.map(card =>
      Math.min(
        distance,
        card.offsetLeft - comparisonCards[0].offsetLeft
      )
    );

    gallery.style.height = motion.matches
      ? `${innerHeight + distance}px`
      : '';

    start = gallery.getBoundingClientRect().top + scrollY;

    update();
  }

  function go(step) {
    const x =
      offsets[
        Math.max(
          0,
          Math.min(offsets.length - 1, current + step)
        )
      ];

    if (motion.matches) {
      window.scrollTo({
        top: start + x,
        behavior: 'smooth'
      });
    } else {
      viewport.scrollTo({
        left: x,
        behavior:
          motion.matches ||
          !matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'smooth'
            : 'auto'
      });
    }
  }

  buttons.forEach((button, i) =>
    button.addEventListener('click', () => go(i ? 1 : -1))
  );

  viewport.addEventListener('keydown', event => {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight'
    ) return;

    event.preventDefault();

    go(event.key === 'ArrowLeft' ? -1 : 1);
  });

  window.addEventListener('scroll', schedule, { passive: true });
  viewport.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure, { once: true });

  motion.addEventListener('change', measure);
  new ResizeObserver(measure).observe(viewport);
  new ResizeObserver(measure).observe(track);

  measure();
}


document.querySelectorAll(".case-image-set img").forEach((image) => {
  const setRatio = () =>
    image.closest("figure")
      ?.style.setProperty(
        "--media-ratio",
        image.naturalWidth / image.naturalHeight
      );

  if (image.complete && image.naturalWidth) {
    setRatio();
  } else {
    image.addEventListener("load", setRatio, { once: true });
  }
});


// Scrub transparent image sequences while their full-screen stage is pinned.
document.querySelectorAll(".case-frame-sequence").forEach((sequence) => {
  const image = sequence.querySelector("img");
  const count = Number(sequence.dataset.frameCount);
  const path = sequence.dataset.framePath;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  if (!image || !count || !path || reduced.matches) return;

  const frames = new Array(count);
  frames[0] = image;

  let start = 0;
  let travel = 1;
  let current = 0;
  let wanted = 0;
  let animationFrame = 0;
  let preloading = false;

  const source = (index) =>
    path.replace("{frame}", String(index + 1).padStart(4, "0"));

  function load(index) {
    if (index < 0 || index >= count || frames[index]) return frames[index];

    const frame = new Image();
    frame.src = source(index);
    frames[index] = frame;

    return frame;
  }

  function show(index) {
    wanted = index;

    const frame = load(index);

    if (frame.complete) {
      image.src = frame.src;
      current = index;
      return;
    }

    frame.addEventListener("load", () => {
      if (wanted === index) {
        image.src = frame.src;
        current = index;
      }
    }, { once: true });
  }

  function draw() {
    animationFrame = 0;

    const progress = Math.max(
      0,
      Math.min(1, (scrollY - start) / travel)
    );

    const next = Math.round(progress * (count - 1));

    if (next !== current) {
      show(next);
    }

    load(next - 1);
    load(next + 1);
  }

  function schedule() {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(draw);
    }
  }

  function measure() {
    start = sequence.getBoundingClientRect().top + scrollY;
    travel = Math.max(
      1,
      sequence.offsetHeight - innerHeight
    );

    draw();
  }

  function preload() {
    if (preloading) return;

    preloading = true;

    let index = 1;

    const batch = () => {
      const end = Math.min(count, index + 8);

      while (index < end) {
        load(index++);
      }

      if (index < count) {
        setTimeout(batch, 80);
      }
    };

    batch();
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      preload();
      observer.disconnect();
    }, {
      rootMargin: "100% 0px"
    });

    observer.observe(sequence);
  } else {
    window.addEventListener("load", preload, { once: true });
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure, { once: true });

  new ResizeObserver(measure).observe(sequence);

  measure();
});


// Uncover the packaging family with a feathered left-to-right scroll reveal.
document.querySelectorAll(".case-family-reveal img").forEach((image) => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = 0;

  function draw() {
    animationFrame = 0;

    if (reduced.matches) {
      image.style.setProperty("--family-reveal", "112%");
      return;
    }

    const rect = image.getBoundingClientRect();

    const progress = Math.max(
      0,
      Math.min(
        1,
        (innerHeight - rect.top) / (innerHeight * .72)
      )
    );

    image.style.setProperty(
      "--family-reveal",
      `${progress * 112}%`
    );
  }

  function schedule() {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(draw);
    }
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  image.addEventListener("load", draw, { once: true });

  reduced.addEventListener("change", draw);

  draw();
});


// Keep the manual copy visible while its panoramic photograph pans across.
document.querySelectorAll(".case-manual-pan").forEach((section) => {
  const image = section.querySelector("img");
  const sticky = section.querySelector(".case-manual-pan-sticky");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  if (!image || !sticky || reduced.matches) return;

  let start = 0;
  let travel = 1;
  let animationFrame = 0;

  function draw() {
    animationFrame = 0;

    const sectionTop = section.getBoundingClientRect().top;

    const progress = Math.max(
      0,
      Math.min(
        1,
        -sectionTop / travel
      )
    );

    image.style.setProperty(
      "--manual-pan",
      `${progress * 100}%`
    );
  }

  function schedule() {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(draw);
    }
  }

  function measure() {
    start = section.getBoundingClientRect().top + scrollY;

    travel = Math.max(
      1,
      section.offsetHeight - sticky.offsetHeight
    );

    draw();
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure, { once: true });

  new ResizeObserver(measure).observe(section);

  measure();
});


// Keep the related-work grid balanced: two recommendations per case study.
document.querySelectorAll(".case-more .project-grid").forEach((grid) => {
  [...grid.querySelectorAll(":scope > .project-card")]
    .slice(2)
    .forEach((card) => card.remove());
});


const caseNav = document.querySelector(".case-local-nav");

if (caseNav) {
  const caseLayout = caseNav.closest(".case-layout");
  const caseBody = caseLayout?.querySelector(".case-body");
  const caseMore = document.querySelector(".case-more");

  const canRevealCaseNavAt = (pointerY) => {
    if (!caseLayout) return false;

    const layoutRect = caseLayout.getBoundingClientRect();

    // The desktop reveal gutter only belongs to the case-study body.
    // Once the pointer is vertically outside that body, including over
    // the More work section, the sidebar must stay closed.
    const pointerInsideCaseLayout =
      pointerY >= Math.max(0, layoutRect.top) &&
      pointerY <= Math.min(innerHeight, layoutRect.bottom);

    if (!pointerInsideCaseLayout) {
      return false;
    }

    if (caseMore) {
      const moreRect = caseMore.getBoundingClientRect();

      const pointerOverMoreWork =
        pointerY >= moreRect.top &&
        pointerY <= moreRect.bottom;

      if (pointerOverMoreWork) {
        return false;
      }
    }

    return true;
  };

  let collapseTimer;

  const collapseNav = () => {
    window.clearTimeout(collapseTimer);

    collapseTimer = window.setTimeout(
      () => caseNav.classList.add("is-collapsed"),
      1000
    );
  };

  if (caseLayout && "IntersectionObserver" in window) {
    const entranceObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      caseNav.classList.remove("is-collapsed");
      collapseNav();
      entranceObserver.disconnect();
    }, {
      rootMargin: "0px 0px -35%",
      threshold: .05
    });

    entranceObserver.observe(caseLayout);
  } else {
    collapseNav();
  }

  if (
    caseBody &&
    matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    document.addEventListener("pointermove", (event) => {
      if (!caseNav.classList.contains("is-collapsed")) {
        return;
      }

      if (!canRevealCaseNavAt(event.clientY)) {
        caseNav.classList.remove("is-expanded");
        return;
      }

      const activationEdge =
        caseBody.getBoundingClientRect().left - 14;

      const inGutter =
        event.clientX < activationEdge;

      const expanded =
        caseNav.classList.contains("is-expanded");

      if (!expanded) {
        if (inGutter) {
          caseNav.classList.add("is-expanded");
        }

        return;
      }

      if (
        !inGutter &&
        !caseNav.matches(":hover")
      ) {
        caseNav.classList.remove("is-expanded");
      }
    }, {
      passive: true
    });

    document.addEventListener("pointerleave", () => {
      caseNav.classList.remove("is-expanded");
    });

    if (
      caseMore &&
      "IntersectionObserver" in window
    ) {
      const moreWorkObserver =
        new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;

          caseNav.classList.remove("is-expanded");
        }, {
          threshold: 0
        });

      moreWorkObserver.observe(caseMore);
    }
  }

  const links = [
    ...caseNav.querySelectorAll("a[href^='#']")
  ];

  // Hide only labels, retaining each link's geometry and active-section border.
  links.forEach((link) => {
    const label = document.createElement("span");

    link.setAttribute(
      "aria-label",
      link.textContent.trim()
    );

    label.append(...link.childNodes);
    link.append(label);
  });

  // On phones, reuse this same navigation as a compact top-right menu.
  const mobileNavQuery =
    matchMedia("(max-width: 640px)");

  const siteHeader =
    document.querySelector(".site-header");

  let mobileNavButton = null;

  if (siteHeader) {
    if (!caseNav.id) {
      caseNav.id = "case-section-nav";
    }

    mobileNavButton =
      document.createElement("button");

    mobileNavButton.type = "button";
    mobileNavButton.className =
      "case-mobile-nav-toggle glass";

    mobileNavButton.setAttribute(
      "aria-controls",
      caseNav.id
    );

    mobileNavButton.setAttribute(
      "aria-expanded",
      "false"
    );

    mobileNavButton.setAttribute(
      "aria-label",
      "Open section navigation"
    );

    mobileNavButton.innerHTML = `
      <span class="case-mobile-nav-icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    `;

    siteHeader.append(mobileNavButton);

    caseNav.classList.add(
      "has-mobile-toggle"
    );

    const positionMobileNav = () => {
      if (!mobileNavQuery.matches) {
        return;
      }

      const rect =
        mobileNavButton.getBoundingClientRect();

      caseNav.style.setProperty(
        "--case-mobile-nav-top",
        `${Math.round(rect.bottom + 10)}px`
      );

      caseNav.style.setProperty(
        "--case-mobile-nav-right",
        `${Math.max(
          16,
          Math.round(innerWidth - rect.right)
        )}px`
      );
    };

    const setMobileNav = (
      open,
      returnFocus = false
    ) => {
      const shouldOpen =
        Boolean(
          open &&
          mobileNavQuery.matches
        );

      caseNav.classList.toggle(
        "is-mobile-open",
        shouldOpen
      );

      mobileNavButton.setAttribute(
        "aria-expanded",
        String(shouldOpen)
      );

      mobileNavButton.setAttribute(
        "aria-label",
        shouldOpen
          ? "Close section navigation"
          : "Open section navigation"
      );

      if (shouldOpen) {
        positionMobileNav();
      }

      if (
        !shouldOpen &&
        returnFocus
      ) {
        mobileNavButton.focus();
      }
    };

    mobileNavButton.addEventListener(
      "click",
      () => {
        setMobileNav(
          !caseNav.classList.contains(
            "is-mobile-open"
          )
        );
      }
    );

    links.forEach((link) => {
      link.addEventListener(
        "click",
        () => setMobileNav(false)
      );
    });

    document.addEventListener(
      "pointerdown",
      (event) => {
        if (
          !caseNav.classList.contains(
            "is-mobile-open"
          )
        ) {
          return;
        }

        if (
          caseNav.contains(event.target) ||
          mobileNavButton.contains(event.target)
        ) {
          return;
        }

        setMobileNav(false);
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key !== "Escape" ||
          !caseNav.classList.contains(
            "is-mobile-open"
          )
        ) {
          return;
        }

        setMobileNav(false, true);
      }
    );

    window.addEventListener(
      "resize",
      () => {
        if (!mobileNavQuery.matches) {
          setMobileNav(false);
          return;
        }

        if (
          caseNav.classList.contains(
            "is-mobile-open"
          )
        ) {
          positionMobileNav();
        }
      }
    );

    mobileNavQuery.addEventListener(
      "change",
      (event) => {
        if (!event.matches) {
          setMobileNav(false);
        }
      }
    );
  }

  const sections = links
    .map((link) =>
      document.querySelector(link.hash)
    )
    .filter(Boolean);

  if (
    sections.length &&
    "IntersectionObserver" in window
  ) {
    const observer =
      new IntersectionObserver((entries) => {
        const visible = entries
          .filter(
            (entry) =>
              entry.isIntersecting
          )
          .sort(
            (a, b) =>
              b.intersectionRatio -
              a.intersectionRatio
          )[0];

        if (!visible) return;

        links.forEach((link) => {
          const active =
            link.hash ===
            `#${visible.target.id}`;

          link.classList.toggle(
            "is-active",
            active
          );

          if (active) {
            link.setAttribute(
              "aria-current",
              "location"
            );
          } else {
            link.removeAttribute(
              "aria-current"
            );
          }
        });
      }, {
        rootMargin:
          "-18% 0px -65% 0px",
        threshold: [
          0,
          .2,
          .5,
          1
        ]
      });

    sections.forEach(
      (section) =>
        observer.observe(section)
    );
  }
}