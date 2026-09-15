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


// Group consecutive physical/virtual comparisons without duplicating their media.
const comparisonCards = [...document.querySelectorAll('.case-body > .scene-modes')]
  .filter(card =>
    card.querySelector('.scene-mode-stage')
      ?.getAttribute('aria-label')
      ?.startsWith('Physical and Fortnite')
  );

if (comparisonCards.length > 1) {
  const gallery = document.createElement('section');

  gallery.className = 'comparison-gallery';
  gallery.setAttribute(
    'aria-label',
    'Physical exhibition and Fortnite comparisons'
  );

  gallery.innerHTML = `
    <div class="comparison-sticky">
      <div
        class="comparison-viewport"
        tabindex="0"
        role="region"
        aria-label="Exhibition comparisons"
      >
        <div class="comparison-track"></div>
      </div>

      <div class="comparison-controls">
        <span class="comparison-count"></span>
        <button type="button" aria-label="Previous comparison">←</button>
        <button type="button" aria-label="Next comparison">→</button>
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


const caseNav = document.querySelector(".case-local-nav");

if (caseNav) {
  const caseLayout = caseNav.closest(".case-layout");
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

  const links = [...caseNav.querySelectorAll("a[href^='#']")];

  // Hide only labels, retaining each link's geometry and active-section border.
  links.forEach((link) => {
    const label = document.createElement("span");

    link.setAttribute("aria-label", link.textContent.trim());

    label.append(...link.childNodes);
    link.append(label);
  });

  const sections = links
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            b.intersectionRatio - a.intersectionRatio
        )[0];

      if (!visible) return;

      links.forEach((link) => {
        const active =
          link.hash === `#${visible.target.id}`;

        link.classList.toggle("is-active", active);

        if (active) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, {
      rootMargin: "-18% 0px -65% 0px",
      threshold: [0, .2, .5, 1]
    });

    sections.forEach((section) => observer.observe(section));
  }
}