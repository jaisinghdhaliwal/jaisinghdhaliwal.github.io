const designRoot = new URL("./", document.currentScript.src);
const siteRoot = new URL("../", designRoot);
const designUrl = (path = "") => new URL(path, designRoot).href;
const siteUrl = (path = "") => new URL(path, siteRoot).href;

const NAV_GROUPS = [
  {
    title: "Start here",
    links: [
      ["", "Overview", "overview"],
      ["principles/", "Principles", "principles"],
      ["accessibility/", "Accessibility", "accessibility"]
    ]
  },
  {
    title: "Foundations",
    links: [
      ["logo/", "Logo", "logo"],
      ["colour/", "Colour", "colour"],
      ["typography/", "Typography", "typography"],
      ["layout/", "Layout & spacing", "layout"]
    ]
  },
  {
    title: "Expression",
    links: [
      ["imagery/", "Imagery", "imagery"],
      ["material/", "Material & depth", "material"],
      ["motion/", "Motion", "motion"],
      ["voice/", "Voice & content", "voice"]
    ]
  },
  {
    title: "System",
    links: [
      ["components/", "Components", "components"],
      ["performance/", "Performance", "performance"],
      ["applications/", "Applications", "applications"],
      ["resources/", "Resources", "resources"]
    ]
  }
];

function linkList(groups, currentPage) {
  return groups.map((group) => `
    <section class="menu-group">
      <h3>${group.title}</h3>
      ${group.links.map(([href, label, id]) => `
        <a href="${designUrl(href)}"${id === currentPage ? ' aria-current="page"' : ""}>${label}</a>
      `).join("")}
    </section>
  `).join("");
}

function mountChrome() {
  const page = document.body.dataset.page || "overview";
  const headerTarget = document.querySelector("[data-manual-header]");
  const footerTarget = document.querySelector("[data-manual-footer]");

  if (headerTarget) {
    headerTarget.innerHTML = `
      <header class="manual-header">
        <div class="header-gradient-blur" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="header-inner">
          <button class="menu-button" type="button" aria-expanded="false" aria-controls="global-menu">
            <span class="menu-icon" aria-hidden="true"><span></span></span>
            <span class="mono">Menu</span>
          </button>
          <a class="manual-brand" href="${designUrl()}" aria-label="Design manual home">
            <img class="manual-brand-mark" src="${siteUrl("logo/logo-01.svg")}" alt="">
          </a>
        </div>
      </header>
      <nav class="global-menu" id="global-menu" aria-label="Design manual navigation">
        <div class="global-menu-inner">
          <h2 class="menu-title">Navigation.</h2>
          <div class="menu-columns">${linkList(NAV_GROUPS, page)}</div>
        </div>
      </nav>
    `;
  }

  if (footerTarget) {
    footerTarget.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-brand-block">
            <a class="footer-brand" href="${siteUrl()}" aria-label="Jai Singh Dhaliwal - Work">
              <img src="${siteUrl("logo/logo-name-white.svg")}" alt="" width="2261" height="240">
            </a>
            <p class="footer-analytics">Privacy-first <a href="https://www.cloudflare.com/web-analytics/" rel="noreferrer">Cloudflare Web Analytics</a> measures anonymous page views and performance without cookies or personal data. <a href="?analytics=off" data-analytics-choice>Opt out of analytics</a>; this preference is saved only in your browser.</p>
          </div>
          <nav class="footer-group" aria-label="Footer navigation">
            <p class="footer-heading">Explore</p>
            <a href="${siteUrl()}">Work</a>
            <a href="${siteUrl("create/")}">Create</a>
            <a href="${siteUrl("about/")}">CV</a>
            <a href="${siteUrl("Jai_Singh_Dhaliwal_Graphic_Designer_CV.pdf")}" target="_blank" rel="noreferrer">Download CV PDF</a>
          </nav>
          <div class="footer-group">
            <p class="footer-heading">Contact</p>
            <a href="mailto:jaisinghdhaliwal@outlook.com">jaisinghdhaliwal@outlook.com</a>
            <a href="tel:+447455794117">+44 7455 794117</a>
            <a href="https://www.linkedin.com/in/jaidhaliwal/" rel="noreferrer">LinkedIn</a>
          </div>
          <div class="footer-meta">
            <span>&copy; 2026 Jai Singh Dhaliwal</span>
          </div>
        </div>
      </footer>
    `;
  }
}

function setupMenu() {
  const button = document.querySelector(".menu-button");
  const menu = document.querySelector(".global-menu");
  if (!button || !menu) return;

  const setOpen = (open) => {
    document.body.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    if (open) {
      const firstLink = menu.querySelector("a");
      window.setTimeout(() => firstLink?.focus(), 160);
    } else {
      button.focus();
    }
  };

  button.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) setOpen(false);
  });
}

function setupCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        const original = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => { button.textContent = original; }, 1200);
      } catch {
        button.textContent = value;
      }
    });
  });
}

function setupLocalNav() {
  const nav = document.querySelector(".local-nav");
  if (!nav) return;
  const links = [...nav.querySelectorAll("a[href^='#']")];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.toggle("is-active", link.hash === `#${visible.target.id}`));
  }, { rootMargin: "-18% 0px -65% 0px", threshold: [0, .2, .5, 1] });
  sections.forEach((section) => observer.observe(section));
}

function setupReveals() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  items.forEach((item) => observer.observe(item));
}

function setupTabs() {
  document.querySelectorAll("[data-tabs]").forEach((tabSet) => {
    const buttons = [...tabSet.querySelectorAll("[data-tab]")];
    const panels = [...tabSet.querySelectorAll("[data-panel]")];
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => {
          const selected = item === button;
          item.classList.toggle("is-active", selected);
          item.setAttribute("aria-selected", String(selected));
        });
        panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== button.dataset.tab; });
      });
    });
  });
}

function setupMotionDemo() {
  document.querySelectorAll("[data-play-motion]").forEach((button) => {
    button.addEventListener("click", () => {
      const track = document.querySelector(button.dataset.playMotion);
      if (!track) return;
      track.classList.remove("is-playing");
      void track.offsetWidth;
      track.classList.add("is-playing");
    });
  });
}

function setupFilters() {
  const search = document.querySelector("[data-resource-search]");
  const cards = [...document.querySelectorAll("[data-resource-card]")];
  const buttons = [...document.querySelectorAll("[data-resource-filter]")];
  if (!cards.length) return;
  let activeType = "all";

  const update = () => {
    const query = search?.value.trim().toLowerCase() || "";
    cards.forEach((card) => {
      const matchesType = activeType === "all" || card.dataset.type === activeType;
      const matchesText = card.textContent.toLowerCase().includes(query);
      card.hidden = !(matchesType && matchesText);
    });
  };

  search?.addEventListener("input", update);
  buttons.forEach((button) => button.addEventListener("click", () => {
    activeType = button.dataset.resourceFilter;
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    update();
  }));
}

function setupContrastChecker() {
  const checker = document.querySelector("[data-contrast-checker]");
  if (!checker) return;

  const find = (selector) => checker.querySelector(selector);
  const textField = find("[data-contrast-text]");
  const textPicker = find("[data-contrast-text-picker]");
  const backgroundField = find("[data-contrast-background]");
  const backgroundPicker = find("[data-contrast-background-picker]");
  const sizeRange = find("[data-contrast-size]");
  const sizeField = find("[data-contrast-size-number]");
  const weightField = find("[data-contrast-weight]");
  const sampleField = find("[data-contrast-sample]");
  const preview = find("[data-contrast-preview]");
  const previewText = find("[data-contrast-preview-text]");
  const ratioOutput = find("[data-contrast-ratio]");
  const textType = find("[data-contrast-text-type]");
  const aaBadge = find("[data-contrast-aa]");
  const aaaBadge = find("[data-contrast-aaa]");
  const aaThreshold = find("[data-contrast-aa-threshold]");
  const aaaThreshold = find("[data-contrast-aaa-threshold]");
  const aaGuidance = find("[data-contrast-aa-guidance]");
  const aaaGuidance = find("[data-contrast-aaa-guidance]");

  const normaliseHex = (value) => {
    let hex = value.trim();
    if (!hex.startsWith("#")) hex = `#${hex}`;
    if (/^#[\da-f]{3}$/i.test(hex)) {
      hex = `#${[...hex.slice(1)].map((character) => character.repeat(2)).join("")}`;
    }
    return /^#[\da-f]{6}$/i.test(hex) ? hex.toUpperCase() : null;
  };

  const channelToLinear = (channel) => {
    const value = channel / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  };

  const luminance = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16));
    const [red, green, blue] = channels.map(channelToLinear);
    return .2126 * red + .7152 * green + .0722 * blue;
  };

  const contrastRatio = (first, second) => {
    const light = Math.max(luminance(first), luminance(second));
    const dark = Math.min(luminance(first), luminance(second));
    return (light + .05) / (dark + .05);
  };

  const isLargeText = (size, weight) => size >= 24 || (weight >= 700 && size >= 18.6667);

  const setBadge = (badge, passes) => {
    badge.textContent = passes ? "Pass" : "Fail";
    badge.dataset.state = passes ? "pass" : "fail";
  };

  const guidance = (level, ratio) => {
    if (level === "AA") {
      if (ratio >= 4.5) return "Passes AA for normal and large text.";
      if (ratio >= 3) return "Passes AA for large text only.";
      return "Does not meet AA for text.";
    }
    if (ratio >= 7) return "Passes AAA for normal and large text.";
    if (ratio >= 4.5) return "Passes AAA for large text only.";
    return "Does not meet AAA for text.";
  };

  const update = () => {
    const textColour = normaliseHex(textField.value);
    const backgroundColour = normaliseHex(backgroundField.value);
    textField.setAttribute("aria-invalid", String(!textColour));
    backgroundField.setAttribute("aria-invalid", String(!backgroundColour));
    if (!textColour || !backgroundColour) return;

    const size = Math.min(200, Math.max(8, Number(sizeField.value) || 19));
    const weight = Number(weightField.value);
    const ratio = contrastRatio(textColour, backgroundColour);
    const large = isLargeText(size, weight);
    const aaMinimum = large ? 3 : 4.5;
    const aaaMinimum = large ? 4.5 : 7;

    textField.value = textColour;
    textPicker.value = textColour;
    backgroundField.value = backgroundColour;
    backgroundPicker.value = backgroundColour;
    sizeField.value = size;
    if (size <= Number(sizeRange.max)) sizeRange.value = size;

    preview.style.color = textColour;
    preview.style.backgroundColor = backgroundColour;
    previewText.style.fontSize = `${size}px`;
    previewText.style.fontWeight = weight;
    previewText.textContent = sampleField.value || "Sample text";

    ratioOutput.textContent = `${ratio.toFixed(2)}:1`;
    textType.textContent = large ? "Large text" : "Normal text";
    setBadge(aaBadge, ratio >= aaMinimum);
    setBadge(aaaBadge, ratio >= aaaMinimum);
    aaThreshold.textContent = `${large ? "Large" : "Normal"} text requires ${aaMinimum}:1.`;
    aaaThreshold.textContent = `${large ? "Large" : "Normal"} text requires ${aaaMinimum}:1.`;
    aaGuidance.textContent = guidance("AA", ratio);
    aaaGuidance.textContent = guidance("AAA", ratio);
  };

  const setColours = (textColour, backgroundColour) => {
    textField.value = textColour;
    backgroundField.value = backgroundColour;
    update();
  };

  textPicker.addEventListener("input", () => { textField.value = textPicker.value; update(); });
  backgroundPicker.addEventListener("input", () => { backgroundField.value = backgroundPicker.value; update(); });
  textField.addEventListener("input", update);
  backgroundField.addEventListener("input", update);
  sizeRange.addEventListener("input", () => { sizeField.value = sizeRange.value; update(); });
  sizeField.addEventListener("input", update);
  weightField.addEventListener("change", update);
  sampleField.addEventListener("input", update);

  find("[data-contrast-swap]").addEventListener("click", () => {
    const textColour = textField.value;
    setColours(backgroundField.value, textColour);
  });

  find("[data-contrast-reset]").addEventListener("click", () => {
    sizeField.value = 19;
    sizeRange.value = 19;
    weightField.value = "700";
    sampleField.value = "Selected work";
    setColours("#141A28", "#F4513F");
  });

  document.querySelectorAll("[data-contrast-preset]").forEach((preset) => {
    preset.addEventListener("click", () => {
      setColours(preset.dataset.text, preset.dataset.background);
      checker.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  update();
}

mountChrome();
setupMenu();
setupCopyButtons();
setupLocalNav();
setupReveals();
setupTabs();
setupMotionDemo();
setupFilters();
setupContrastChecker();
document.querySelectorAll("[data-year]").forEach((target) => { target.textContent = new Date().getFullYear(); });
