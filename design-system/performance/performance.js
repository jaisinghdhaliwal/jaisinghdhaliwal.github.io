// Enhance the static reports; both remain readable without JavaScript.
const report = document.querySelector(".psi-report");
const tabs = [...report.querySelectorAll("[data-tab]")];
const panels = [...report.querySelectorAll("[data-panel]")];
report.querySelector('[role="tablist"]').hidden = false;
function selectDevice(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.setAttribute("role", "tabpanel");
    panel.tabIndex = 0;
    panel.hidden = panel.dataset.panel !== tab.dataset.tab;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectDevice(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs[tabs.length - 1];
    if (!next) return;
    event.preventDefault();
    selectDevice(next);
    next.focus();
  });
});
selectDevice(tabs[0]);
