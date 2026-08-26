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

function setupComparisons() {
  document.querySelectorAll("[data-compare]").forEach((comparison) => {
    const input = comparison.querySelector('input[type="range"]');
    input.addEventListener("input", () => {
      comparison.style.setProperty("--position", `${input.value}%`);
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

      buttons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      centreTab(button);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const canAnimate = currentPanel && typeof currentPanel.animate === "function" && !reduceMotion;
      const direction = panels.indexOf(nextPanel) > panels.indexOf(currentPanel) ? 1 : -1;
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

setupDragRails();
setupScanCarousel();
setupComparisons();
setupCountryTabs();
setupImageViewer();

if ("serviceWorker" in navigator) {
  const workerPath = document.body.dataset.project ? "../sw.js" : "./sw.js";
  window.addEventListener("load", () => navigator.serviceWorker.register(workerPath));
}
