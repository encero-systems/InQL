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

  let disposeArchitectureNav = () => {};

  const initializeArchitectureNav = (root = document) => {
    disposeArchitectureNav();
    disposeArchitectureNav = () => {};

    const nav = root.querySelector(".incql-architecture-rail");
    if (!nav) {
      return;
    }

    const links = [...nav.querySelectorAll("[data-architecture-link]")];
    const sections = [...root.querySelectorAll("[data-architecture-section]")];
    if (links.length === 0 || sections.length === 0) {
      return;
    }

    const setActive = (sectionId) => {
      links.forEach((link) => {
        const isActive = link.dataset.architectureLink === sectionId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      const activeLink = links.find((link) => link.dataset.architectureLink === sectionId);
      if (activeLink && nav.scrollWidth > nav.clientWidth) {
        const maximumLeft = nav.scrollWidth - nav.clientWidth;
        const centeredLeft = activeLink.offsetLeft - (nav.clientWidth - activeLink.offsetWidth) / 2;
        nav.scrollTo({ left: Math.max(0, Math.min(centeredLeft, maximumLeft)), behavior: "auto" });
      }
    };

    const linkHandlers = links.map((link) => {
      const handleClick = (event) => {
        const sectionId = link.dataset.architectureLink;
        const section = root.getElementById(sectionId);
        if (!section) {
          return;
        }

        event.preventDefault();
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        window.history.replaceState(null, "", `#${sectionId}`);
        setActive(sectionId);
      };
      link.addEventListener("click", handleClick);
      return { link, handleClick };
    });

    let scrollFrame = null;
    const updateActiveFromScroll = () => {
      scrollFrame = null;
      const readingLine = window.innerHeight * 0.28;
      const currentSection = sections.find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= readingLine && bounds.bottom > readingLine;
      });

      if (currentSection) {
        setActive(currentSection.id);
        return;
      }

      const nearestSection = sections
        .map((section) => ({ section, distance: Math.abs(section.getBoundingClientRect().top - readingLine) }))
        .sort((left, right) => left.distance - right.distance)[0]?.section;
      if (nearestSection) {
        setActive(nearestSection.id);
      }
    };

    const scheduleActiveUpdate = () => {
      if (scrollFrame === null) {
        scrollFrame = window.requestAnimationFrame(updateActiveFromScroll);
      }
    };

    window.addEventListener("scroll", scheduleActiveUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveUpdate);
    updateActiveFromScroll();
    disposeArchitectureNav = () => {
      linkHandlers.forEach(({ link, handleClick }) => link.removeEventListener("click", handleClick));
      window.removeEventListener("scroll", scheduleActiveUpdate);
      window.removeEventListener("resize", scheduleActiveUpdate);
      if (scrollFrame !== null) {
        window.cancelAnimationFrame(scrollFrame);
      }
    };
    nav.dataset.architectureNavReady = "true";
  };

  const initializePage = () => {
    initializeSurfaceTabs();
    initializeArchitectureNav();
  };

  if (window.document$?.subscribe) {
    window.document$.subscribe(initializePage);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage, { once: true });
  } else {
    initializePage();
  }
})();
