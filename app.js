const page = document.body.dataset.page;

function updateActiveNavigation() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const active = link.dataset.nav === page;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

updateActiveNavigation();

function setupNavigationLayoutTransition() {
  const navigation = document.querySelector(".site-nav");
  const mobile = window.matchMedia("(max-width: 640px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!navigation || typeof navigation.animate !== "function") return;

  let previousMobile = mobile.matches;
  let previousBounds = navigation.getBoundingClientRect();
  let resizeFrame;
  let currentAnimation;

  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      const nextMobile = mobile.matches;
      const nextBounds = navigation.getBoundingClientRect();

      if (previousMobile !== nextMobile && !reducedMotion.matches) {
        currentAnimation?.cancel();
        navigation.style.willChange = "transform";

        const animation = navigation.animate([
          {
            transformOrigin: "top left",
            transform: `translate(${previousBounds.left - nextBounds.left}px, ${previousBounds.top - nextBounds.top}px) scale(${previousBounds.width / nextBounds.width}, ${previousBounds.height / nextBounds.height})`
          },
          { transformOrigin: "top left", transform: "none" }
        ], {
          duration: 520,
          easing: "cubic-bezier(.22, 1, .36, 1)"
        });

        currentAnimation = animation;
        animation.finished.catch(() => {}).finally(() => {
          if (currentAnimation !== animation) return;
          currentAnimation = null;
          navigation.style.removeProperty("will-change");
          previousBounds = navigation.getBoundingClientRect();
        });
      } else if (!currentAnimation) {
        previousBounds = nextBounds;
      }

      previousMobile = nextMobile;
    });
  }, { passive: true });
}

setupNavigationLayoutTransition();

function setupDragRails() {
  document.querySelectorAll(".drag-rail").forEach((rail) => {
    let dragging = false;
    let paused = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let resumeTimer;

    rail.addEventListener("pointerdown", (event) => {
      dragging = true;
      moved = false;
      paused = true;
      clearTimeout(resumeTimer);
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
        if (!previousTime) previousTime = time;
        const elapsed = Math.min(time - previousTime, 50);
        previousTime = time;

        if (!paused && !document.hidden && !reduceMotion.matches) {
          rail.scrollLeft += elapsed * 0.075;
          normaliseScroll();
        }
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(() => {
        measure();
        requestAnimationFrame(animate);
      });
      window.addEventListener("resize", measure);
      rail.addEventListener("scrollend", normaliseScroll);
    }
  });
}

function setupImageViewer() {
  const viewer = document.querySelector("[data-image-viewer]");
  if (!viewer) return;
  const viewerImage = viewer.querySelector("[data-viewer-image]");
  let request = 0;

  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-full-image]");
    if (!trigger) return;

    const thumbnail = trigger.querySelector("img");
    const fullSource = trigger.dataset.fullImage;
    const currentRequest = ++request;

    viewerImage.src = thumbnail.currentSrc || thumbnail.src;
    viewerImage.alt = thumbnail.alt;
    viewer.showModal();

    const fullImage = new Image();
    fullImage.src = fullSource;
    try {
      await fullImage.decode();
      if (viewer.open && request === currentRequest) viewerImage.src = fullSource;
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
  });
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
