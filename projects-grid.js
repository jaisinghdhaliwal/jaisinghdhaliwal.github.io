(() => {
  "use strict";

  const moreGrid = document.querySelector(".case-more .project-grid");
  if (!moreGrid) return;

  const MORE_WORK_COUNT = 2;

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const getCurrentProjectId = () => {
    const segments = location.pathname.split("/").filter(Boolean);
    const projectsIndex = segments.lastIndexOf("projects");
    return projectsIndex >= 0 ? segments[projectsIndex + 1] || "" : "";
  };

  const selectMoreWork = (projects, currentId, count = MORE_WORK_COUNT) => {
    if (!projects.length) return [];

    const currentIndex = projects.findIndex((project) => project.id === currentId);
    if (currentIndex < 0) return projects.slice(0, count);

    const selected = [];
    for (let offset = 1; offset < projects.length && selected.length < count; offset += 1) {
      const project = projects[(currentIndex + offset) % projects.length];
      if (project.id !== currentId) selected.push(project);
    }
    return selected;
  };

  const buildCard = (project, data, siteRoot) => {
    const mediaRoot = String(data.mediaRoot || "media/projects").replace(/^\/+|\/+$/g, "");
    const mediaDirectory = new URL(`${mediaRoot}/${project.id}/`, siteRoot);
    const poster = new URL(project.poster || "thumb-720.avif", mediaDirectory).href;
    const href = /^https?:\/\//i.test(project.href || "")
      ? project.href
      : new URL(project.href || `projects/${project.id}/`, siteRoot).href;

    const category = project.category || "";
    const outcome = project.outcome || "";
    const title = project.title || project.id;

    const projectMedia = project.video === false
      ? `<img class="project-video" src="${escapeHtml(poster)}" alt="${escapeHtml(`${title} project preview`)}" width="720" height="900" loading="lazy" decoding="async">`
      : `<video class="project-video" autoplay muted loop playsinline preload="metadata" poster="${escapeHtml(poster)}" aria-hidden="true">
          <source src="${escapeHtml(new URL("h265.mp4", mediaDirectory).href)}" type='video/mp4; codecs="hvc1"'>
          <source src="${escapeHtml(new URL("h264.mp4", mediaDirectory).href)}" type='video/mp4; codecs="avc1"'>
        </video>`;

    const external = /^https?:\/\//i.test(href) && new URL(href).origin !== location.origin;
    const externalAttrs = external ? ' target="_blank" rel="noreferrer"' : "";

    return `<div class="project-card">
      <a href="${escapeHtml(href)}" aria-label="View ${escapeHtml(title)}"${externalAttrs}>
        ${projectMedia}
        <span class="project-caption glass">
          <span class="project-caption-copy">
            <strong>${escapeHtml(title)}</strong>
            ${category ? `<span class="project-category">${escapeHtml(category)}</span>` : ""}
            ${outcome ? `<span class="project-outcome">${escapeHtml(outcome)}</span>` : ""}
          </span>
          <time>${escapeHtml(project.year || "")}</time>
        </span>
      </a>
    </div>`;
  };

  const renderMoreWork = async () => {
    try {
      const siteRoot = new URL("../../", document.baseURI);
      const dataUrl = new URL("projects.json", siteRoot);
      const response = await fetch(dataUrl, { cache: "no-cache" });

      if (!response.ok) {
        throw new Error(`Projects request failed: ${response.status}`);
      }

      const data = await response.json();
      const projects = Array.isArray(data.projects)
        ? data.projects.filter((project) => project.featured !== false)
        : [];

      const selected = selectMoreWork(projects, getCurrentProjectId());

      if (!selected.length) {
        moreGrid.closest(".case-more")?.setAttribute("hidden", "");
        return;
      }

      moreGrid.innerHTML = selected
        .map((project) => buildCard(project, data, siteRoot))
        .join("");

      // app.js already owns caption sizing and the delegated card tilt.
      // Re-run sizing now that the cards were inserted asynchronously.
      if (typeof window.setupProjectCaptionHeights === "function") {
        window.setupProjectCaptionHeights(moreGrid);
      } else {
        window.dispatchEvent(new Event("resize"));
      }
    } catch (error) {
      console.error("Could not render More work from projects.json", error);
      moreGrid.innerHTML = '<p class="load-error">More work could not be loaded.</p>';
    }
  };

  renderMoreWork();
})();
