const page = document.body.dataset.page;

// One delegated controller also handles dynamically inserted More work tiles.
(() => {
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let card, link, bounds, frame = 0, x = 0, y = 0;
  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (link) {
      link.style.removeProperty('--tilt-x');
      link.style.removeProperty('--tilt-y');
      link.classList.remove('is-tilting');
    }
    card = link = bounds = null;
  }
  document.addEventListener('pointerover', event => {
    if (!enabled.matches || event.pointerType === 'touch') return;
    const next = event.target.closest('.project-card');
    if (!next || next === card) return;
    reset();
    card = next;
    link = card.querySelector('a');
    if (!link) { reset(); return; }
    bounds = card.getBoundingClientRect();
    link.classList.add('is-tilting');
  }, {passive: true});
  document.addEventListener('pointermove', event => {
    if (!link) return;
    x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      link.style.setProperty('--tilt-x', `${-y * 6}deg`);
      link.style.setProperty('--tilt-y', `${x * 6}deg`);
    });
  }, {passive: true});
  document.addEventListener('pointerout', event => {
    if (card && !card.contains(event.relatedTarget)) reset();
  }, {passive: true});
  addEventListener('scroll', reset, {passive: true});
  addEventListener('resize', reset, {passive: true});
  addEventListener('blur', reset);
  enabled.addEventListener('change', reset);
})();

function updateActiveNavigation() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const active = link.dataset.nav === page;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

updateActiveNavigation();

function keepActiveNavigationOnPage() {
  const normalisePath = (path) => path.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  document.querySelectorAll(".site-nav a.is-active").forEach((link) => {
    link.addEventListener("click", (event) => {
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin || normalisePath(destination.pathname) !== normalisePath(location.pathname)) return;
      event.preventDefault();
      if (window.scrollY <= 1) return;
      window.scrollTo({
        top: 0,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    });
  });
}

keepActiveNavigationOnPage();

function setupButtonMotion() {
  const preference = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (!preference.matches) return;
  const items = [...document.querySelectorAll("[data-button-motion]")]
    .map((button) => ({
      button,
      label: button.querySelector(".button-label"),
      box: null,
      x: 0, y: 0,
      velocityX: 0, velocityY: 0,
      targetX: 0, targetY: 0
    }))
    .filter((item) => item.label);
  if (!items.length) return;

  let pointer;
  let frame = 0;
  let previousTime = 0;
  let geometryChanged = true;

  const requestFrame = () => {
    if (!frame) frame = requestAnimationFrame(animate);
  };
  const setTargets = () => {
    items.forEach((item) => {
      const box = item.box;
      item.targetX = 0;
      item.targetY = 0;
      if (!pointer || !box.width || !box.height) return;
      const x = pointer.x - box.left - box.width / 2;
      const y = pointer.y - box.top - box.height / 2;
      const distance = Math.hypot(
        Math.max(0, Math.abs(x) - box.width / 2),
        Math.max(0, Math.abs(y) - box.height / 2)
      );
      const influence = Math.max(0, 1 - distance / 300);
      item.targetX = Math.max(-1, Math.min(1, x / (box.width / 2))) * 18 * influence;
      item.targetY = Math.max(-1, Math.min(1, y / (box.height / 2))) * 7 * influence;
    });
  };
  function animate(time) {
    frame = 0;
    const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 1 / 30) : 1 / 60;
    previousTime = time;
    if (geometryChanged) {
      items.forEach((item) => { item.box = item.button.getBoundingClientRect(); });
      geometryChanged = false;
    }
    setTargets();

    let moving = false;
    items.forEach((item) => {
      const returning = item.targetX === 0 && item.targetY === 0;
      const stiffness = returning ? 190 : 280;
      const damping = returning ? 18 : 30;
      item.velocityX += ((item.targetX - item.x) * stiffness - item.velocityX * damping) * elapsed;
      item.velocityY += ((item.targetY - item.y) * stiffness - item.velocityY * damping) * elapsed;
      item.x += item.velocityX * elapsed;
      item.y += item.velocityY * elapsed;

      if (Math.abs(item.targetX - item.x) + Math.abs(item.targetY - item.y) + Math.abs(item.velocityX) + Math.abs(item.velocityY) < .04) {
        item.x = item.targetX;
        item.y = item.targetY;
        item.velocityX = 0;
        item.velocityY = 0;
      } else {
        moving = true;
      }
      item.label.style.transform = item.x || item.y
        ? `translate(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px)`
        : "";
    });

    if (moving) requestFrame();
    else previousTime = 0;
  }
  const move = (event) => {
    if (event.pointerType !== "mouse" || !preference.matches) return;
    pointer = { x: event.clientX, y: event.clientY };
    requestFrame();
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    pointer = undefined;
    items.forEach((item) => {
      item.x = item.y = item.velocityX = item.velocityY = item.targetX = item.targetY = 0;
      item.label.style.transform = "";
    });
  };

  document.addEventListener("pointermove", move, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    pointer = undefined;
    requestFrame();
  });
  document.addEventListener("scroll", () => {
    geometryChanged = true;
    if (pointer) requestFrame();
  }, { capture: true, passive: true });
  window.addEventListener("resize", () => {
    geometryChanged = true;
    if (pointer) requestFrame();
  }, { passive: true });
  window.addEventListener("blur", reset);
  window.addEventListener("pagehide", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  document.addEventListener("keydown", reset);
  preference.addEventListener("change", reset);
}

setupButtonMotion();

function setupDragRails() {
  document.querySelectorAll(".drag-rail").forEach((rail) => {
    let dragging = false;
    let paused = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let resumeTimer;

    rail.addEventListener("pointerdown", (event) => {
      paused = true;
      clearTimeout(resumeTimer);
      if (event.pointerType !== "mouse") return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      rail.classList.add("is-dragging");
    });
    rail.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      if (!moved && Math.abs(event.clientX - startX) > 6) {
        moved = true;
        rail.setPointerCapture(event.pointerId);
      }
      rail.scrollLeft = startScroll - (event.clientX - startX);
    });
    const stop = () => {
      dragging = false;
      rail.classList.remove("is-dragging");
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
      }, 1200);
    };
    rail.addEventListener("pointerup", stop);
    rail.addEventListener("pointercancel", stop);
    rail.addEventListener("click", (event) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }, true);

    rail.addEventListener("focusin", () => {
      paused = true;
      clearTimeout(resumeTimer);
    });
    rail.addEventListener("focusout", () => {
      paused = false;
    });

    if (rail.hasAttribute("data-auto-scroll")) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const originals = [...rail.children];

      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("button, a, input, select, textarea").forEach((control) => {
          control.tabIndex = -1;
        });
        rail.append(clone);
      });

      let loopWidth = 0;
      let previousTime = 0;
      let animationFrame = 0;
      let visible = false;

      const measure = () => {
        const firstOriginal = rail.children[0];
        const firstClone = rail.children[originals.length];
        loopWidth = firstClone.offsetLeft - firstOriginal.offsetLeft;
      };

      const normaliseScroll = () => {
        if (!loopWidth) return;
        if (rail.scrollLeft >= loopWidth) rail.scrollLeft -= loopWidth;
      };

      const animate = (time) => {
        animationFrame = 0;
        if (!visible) {
          previousTime = 0;
          return;
        }
        if (!previousTime) previousTime = time;
        const elapsed = Math.min(time - previousTime, 50);
        previousTime = time;

        if (!paused && !document.hidden && !reduceMotion.matches) {
          rail.scrollLeft += elapsed * 0.075;
          normaliseScroll();
        }
        animationFrame = requestAnimationFrame(animate);
      };

      const startAnimation = () => {
        if (!animationFrame) animationFrame = requestAnimationFrame(animate);
      };
      const observeVisibility = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && !rail.closest("[hidden]");
        if (visible) {
          measure();
          startAnimation();
        }
      });
      observeVisibility.observe(rail);
      requestAnimationFrame(() => {
        measure();
      });
      window.addEventListener("resize", measure);
      rail.addEventListener("scrollend", normaliseScroll);
      if ("ResizeObserver" in window) {
        const sizeObserver = new ResizeObserver(measure);
        originals.forEach((item) => sizeObserver.observe(item));
      } else {
        originals.forEach((item) => item.querySelector("img")?.addEventListener("load", measure));
      }
    }
  });
}

function setupImageViewer() {
  const viewer = document.querySelector("[data-image-viewer]");
  if (!viewer) return;
  const viewerImage = viewer.querySelector("[data-viewer-image]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let request = 0;

  const fitImage = (width = viewerImage.naturalWidth, height = viewerImage.naturalHeight) => {
    if (!width || !height) return;
    const style = getComputedStyle(viewer);
    const availableWidth = viewer.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const availableHeight = viewer.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const scale = Math.min(availableWidth / width, availableHeight / height);
    viewerImage.style.width = `${Math.floor(width * scale)}px`;
    viewerImage.style.height = `${Math.floor(height * scale)}px`;
  };

  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-full-image]");
    if (!trigger) return;

    const thumbnail = trigger.querySelector("img");
    const fullSource = trigger.dataset.fullImage;
    const currentRequest = ++request;
    const start = thumbnail.getBoundingClientRect();

    viewerImage.src = thumbnail.currentSrc || thumbnail.src;
    viewerImage.alt = thumbnail.alt;
    viewer.showModal();
    fitImage(thumbnail.naturalWidth, thumbnail.naturalHeight);

    if (!reduceMotion.matches) {
      requestAnimationFrame(() => {
        if (!viewer.open || request !== currentRequest) return;
        const end = viewerImage.getBoundingClientRect();
        const offsetX = start.left + start.width / 2 - end.left - end.width / 2;
        const offsetY = start.top + start.height / 2 - end.top - end.height / 2;
        viewerImage.animate([
          { transform: `translate(${offsetX}px, ${offsetY}px) scale(${start.width / end.width}, ${start.height / end.height})` },
          { transform: "translate(0) scale(1)" }
        ], { duration: 440, easing: "cubic-bezier(.16, 1, .3, 1)" });
      });
    }

    const fullImage = new Image();
    fullImage.src = fullSource;
    try {
      await fullImage.decode();
      if (viewer.open && request === currentRequest) {
        viewerImage.src = fullSource;
        fitImage(fullImage.naturalWidth, fullImage.naturalHeight);
      }
    } catch {
      // Retain the visible thumbnail if the larger file cannot be decoded.
    }
  });

  viewer.querySelector("[data-close-viewer]").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("close", () => {
    request++;
    viewerImage.removeAttribute("src");
    viewerImage.style.removeProperty("width");
    viewerImage.style.removeProperty("height");
  });
  window.addEventListener("resize", () => {
    if (viewer.open) fitImage();
  }, { passive: true });
}

function setupScanCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;
  const items = [...carousel.querySelectorAll(".scan-item")];
  const position = document.querySelector("#scan-position");
  let current = 0;

  const update = () => {
    items.forEach((item, index) => item.classList.toggle("is-active", index === current));
    if (position) position.textContent = `${String(current + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
  };
  carousel.querySelector(".next").addEventListener("click", () => {
    current = (current + 1) % items.length;
    update();
  });
  carousel.querySelector(".previous").addEventListener("click", () => {
    current = (current - 1 + items.length) % items.length;
    update();
  });
  update();
}

function setupSceneModes() {
  document.querySelectorAll("[data-scene-modes]").forEach((viewer) => {
    const stage = viewer.querySelector(".scene-mode-stage");
    const wipe = viewer.querySelector(".scene-mode-wipe");
    const label = viewer.querySelector(".scene-mode-label");
    const images = [...viewer.querySelectorAll(".scene-mode-image")];
    if (viewer.closest('.case-body') && images.length === 3 && images[0]?.dataset.sceneLabel === 'Workbench') return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = Number(viewer.dataset.activeMode) || 0;
    let switching = false;
    let timer;

    const setStageRatio = () => {
      const image = images[0];
      if (stage && image?.naturalWidth) stage.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
    };

    if (images[0]?.complete) setStageRatio();
    else images[0]?.addEventListener("load", setStageRatio, { once: true });

    const selectMode = async (next) => {
      if (next === current || next < 0 || next >= images.length || switching) return;
      switching = true;
      const previousImage = images[current];
      const nextImage = images[next];

      nextImage.hidden = false;
      nextImage.classList.add("is-active");
      nextImage.style.zIndex = "2";
      label.textContent = nextImage.dataset.sceneLabel;

      if (!reduceMotion.matches && typeof nextImage.animate === "function") {
        const imageAnimation = nextImage.animate(
          [{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }],
          { duration: 520, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "both" }
        );
        const wipeAnimation = wipe.animate(
          [{ left: "100%", opacity: 0 }, { opacity: 1, offset: .08 }, { left: "0%", opacity: 1, offset: .9 }, { opacity: 0 }],
          { duration: 520, easing: "cubic-bezier(.22, 1, .36, 1)" }
        );
        await Promise.allSettled([imageAnimation.finished, wipeAnimation.finished]);
      }

      previousImage.hidden = true;
      previousImage.classList.remove("is-active");
      previousImage.style.removeProperty("z-index");
      nextImage.style.removeProperty("z-index");
      current = next;
      viewer.dataset.activeMode = String(current);
      switching = false;
    };

    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => selectMode((current + 1) % images.length), 2000);
    };

    start();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearInterval(timer);
      else start();
    });
  });
}

function setupCountryTabs() {
  document.querySelectorAll(".country-tabs").forEach((tablist) => {
    const buttons = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = [...document.querySelectorAll("[data-country-panel]")];
    let switching = false;

    const centreTab = (button, smooth = true) => {
      if (tablist.scrollWidth <= tablist.clientWidth) return;
      const tablistBox = tablist.getBoundingClientRect();
      const buttonBox = button.getBoundingClientRect();
      tablist.scrollTo({
        left: tablist.scrollLeft + buttonBox.left + buttonBox.width / 2 - tablistBox.left - tablistBox.width / 2,
        behavior: smooth ? "smooth" : "auto"
      });
    };

    const selectCountry = async (button) => {
      const currentPanel = panels.find((panel) => !panel.hidden);
      const nextPanel = panels.find((panel) => panel.dataset.countryPanel === button.dataset.country);
      if (!nextPanel || currentPanel === nextPanel || switching) {
        centreTab(button);
        return;
      }

      const currentButton = buttons.find((item) => item.getAttribute("aria-selected") === "true");
      buttons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      centreTab(button);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const canAnimate = currentPanel && typeof currentPanel.animate === "function" && !reduceMotion;
      const direction = buttons.indexOf(button) > buttons.indexOf(currentButton) ? 1 : -1;
      switching = true;

      if (canAnimate) {
        const outgoingAnimation = currentPanel.animate([
          { opacity: 1, transform: "translateX(0) scale(1)" },
          { opacity: 0, transform: `translateX(${-40 * direction}px) scale(.985)` }
        ], { duration: 120, easing: "cubic-bezier(.4, 0, 1, 1)", fill: "forwards" });
        await Promise.race([
          outgoingAnimation.finished.catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 140))
        ]);
        outgoingAnimation.cancel();
      }

      if (currentPanel) currentPanel.hidden = true;
      nextPanel.hidden = false;
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));

      if (canAnimate) {
        const incomingAnimation = nextPanel.animate([
          { opacity: 0, transform: `translateX(${48 * direction}px) scale(.985)` },
          { opacity: 1, transform: "translateX(0) scale(1)" }
        ], { duration: 240, easing: "cubic-bezier(.16, 1, .3, 1)" });
        await Promise.race([
          incomingAnimation.finished.catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 260))
        ]);
      }

      switching = false;
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => selectCountry(button));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        selectCountry(buttons[next]);
        buttons[next].focus();
      });
    });

    requestAnimationFrame(() => centreTab(buttons.find((button) => button.classList.contains("is-active")), false));
    window.addEventListener("resize", () => {
      const activeButton = buttons.find((button) => button.classList.contains("is-active"));
      if (activeButton) centreTab(activeButton, false);
    });
  });
}

setupScanCarousel();
setupCountryTabs();
setupImageViewer();

const startCreateCarousels = () => {
  window.setTimeout(() => {
    setupDragRails();
    setupSceneModes();
  }, 1500);
};

if (document.readyState === "complete") startCreateCarousels();
else window.addEventListener("load", startCreateCarousels, { once: true });

if ("serviceWorker" in navigator) {
  const workerPath = new URL("sw.js", document.currentScript.src);
  window.addEventListener("load", () => navigator.serviceWorker.register(workerPath));
}
