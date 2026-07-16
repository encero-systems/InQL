(() => {
  const initializeSurfaceTabs = (root = document) => {
    root.querySelectorAll("[data-incql-surface-tabs]").forEach((group) => {
      if (group.dataset.tabsReady === "true") {
        return;
      }

      const tabs = [...group.querySelectorAll('[role="tab"]')];
      const panels = [...group.querySelectorAll('[role="tabpanel"]')];

      if (tabs.length === 0 || panels.length === 0) {
        return;
      }

      const activateTab = (nextTab, moveFocus = false) => {
        tabs.forEach((tab) => {
          const isActive = tab === nextTab;
          tab.setAttribute("aria-selected", String(isActive));
          tab.tabIndex = isActive ? 0 : -1;
        });

        panels.forEach((panel) => {
          panel.hidden = panel.id !== nextTab.getAttribute("aria-controls");
          panel.tabIndex = 0;
        });

        const tabList = nextTab.closest('[role="tablist"]');
        if (tabList && tabList.scrollWidth > tabList.clientWidth) {
          const listStyle = getComputedStyle(tabList);
          const startPadding = Number.parseFloat(listStyle.paddingInlineStart) || 0;
          const activeRight = nextTab.offsetLeft + nextTab.offsetWidth;
          const availableWidth = tabList.clientWidth - startPadding * 2;
          const activeIndex = tabs.indexOf(nextTab);
          const leftAnchor = tabs
            .slice(0, activeIndex + 1)
            .find((tab) => activeRight - tab.offsetLeft <= availableWidth) ?? nextTab;
          const alignedLeft = leftAnchor.offsetLeft - startPadding;
          const maximumLeft = tabList.scrollWidth - tabList.clientWidth;
          tabList.scrollTo({
            left: Math.max(0, Math.min(alignedLeft, maximumLeft)),
            behavior: "auto",
          });
        }

        if (moveFocus) {
          nextTab.focus();
        }
      };

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activateTab(tab));
        tab.addEventListener("keydown", (event) => {
          let nextIndex = null;

          if (event.key === "ArrowRight") {
            nextIndex = (index + 1) % tabs.length;
          } else if (event.key === "ArrowLeft") {
            nextIndex = (index - 1 + tabs.length) % tabs.length;
          } else if (event.key === "Home") {
            nextIndex = 0;
          } else if (event.key === "End") {
            nextIndex = tabs.length - 1;
          }

          if (nextIndex !== null) {
            event.preventDefault();
            activateTab(tabs[nextIndex], true);
          }
        });
      });

      const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
      activateTab(selectedTab);
      group.dataset.tabsReady = "true";
    });
  };

  initializeSurfaceTabs();

  if (window.document$?.subscribe) {
    window.document$.subscribe(() => initializeSurfaceTabs());
  } else {
    document.addEventListener("DOMContentLoaded", () => initializeSurfaceTabs(), { once: true });
  }
})();
