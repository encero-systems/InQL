(() => {
  const rfcReaderContract = {
    adjacentRecordId(records, currentId, offset) {
      if (records.length === 0) {
        return "";
      }
      const currentIndex = records.findIndex((record) => record.id === currentId);
      if (currentIndex < 0) {
        return records[0].id;
      }
      const nextIndex = Math.max(0, Math.min(records.length - 1, currentIndex + offset));
      return records[nextIndex].id;
    },

    resolvedRecordId(records, selectedId) {
      return records.some((record) => record.id === selectedId)
        ? selectedId
        : records[0]?.id ?? "";
    },

    setTag(tags, key, selected) {
      const next = selected
        ? [...new Set([...tags, key])]
        : tags.filter((tag) => tag !== key);
      return next.sort();
    },

    sortRecords(records, sort) {
      const direction = sort === "status-desc" ? -1 : 1;
      const byId = (left, right) => left.id.localeCompare(right.id, undefined, { numeric: true });
      if (!sort) {
        return [...records].sort(byId);
      }
      return [...records].sort((left, right) => {
        const byStatus = left.status.localeCompare(right.status, undefined, { sensitivity: "base" });
        return byStatus === 0 ? byId(left, right) : byStatus * direction;
      });
    },

    matches(record, state, normalizeSearch) {
      const queryTokens = normalizeSearch(state.query).split(/\s+/).filter(Boolean);
      const recordTags = new Set(record.tags.map((tag) => tag.key));
      return queryTokens.every((token) => record.searchText.includes(token))
        && (state.scope === "all" || record.lifecycle === state.scope)
        && (!state.status || record.status_key === state.status)
        && state.tags.every((tag) => recordTags.has(tag));
    },

    readParams(params, defaults, known) {
      const next = { ...defaults, tags: [] };
      next.query = params.get("q") ?? "";
      next.scope = ["active", "implemented"].includes(params.get("scope"))
        ? params.get("scope")
        : "all";
      next.status = known.statuses.has(params.get("status")) ? params.get("status") : "";
      next.sort = ["status-asc", "status-desc"].includes(params.get("sort"))
        ? params.get("sort")
        : "";
      if (next.status) {
        next.scope = "all";
      }
      next.tags = [...new Set(params.getAll("tag").filter((tag) => known.tags.has(tag)))].sort();
      const selected = params.get("rfc");
      if (selected && known.records.has(selected)) {
        next.selectedId = selected;
        next.selectedExplicitly = true;
      }
      return next;
    },

    writeParams(params, state) {
      const setOrDelete = (key, value) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };
      setOrDelete("q", state.query.trim());
      setOrDelete("scope", state.scope === "all" ? "" : state.scope);
      setOrDelete("status", state.status);
      setOrDelete("sort", state.sort);
      params.delete("topic");
      params.delete("tag");
      [...state.tags].sort().forEach((tag) => params.append("tag", tag));
      setOrDelete("rfc", state.selectedExplicitly ? state.selectedId : "");
      return params;
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { rfcReaderContract };
  }
  if (typeof document === "undefined") {
    return;
  }

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

  let disposePrimaryNavCollapse = () => {};

  const initializePrimaryNavCollapse = (root = document) => {
    disposePrimaryNavCollapse();
    disposePrimaryNavCollapse = () => {};

    const sidebar = root.querySelector(".md-sidebar--primary");
    if (!sidebar) {
      return;
    }

    const desktop = window.matchMedia("(min-width: 76.25em)");
    const storageKey = "incql-docs-primary-nav-collapsed";
    const navRegion = sidebar.querySelector(".md-sidebar__scrollwrap");
    if (navRegion && !navRegion.id) {
      navRegion.id = "pp-primary-navigation";
    }
    let toggle = sidebar.querySelector(".pp-primary-nav-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "pp-primary-nav-toggle md-icon";
      const icon = root.querySelector(".md-search__icon svg:nth-of-type(2)")
        ?? root.querySelector('.md-header__button[for="__drawer"] svg');
      if (icon) {
        const clonedIcon = icon.cloneNode(true);
        clonedIcon.setAttribute("aria-hidden", "true");
        toggle.append(clonedIcon);
      }
      sidebar.prepend(toggle);
    }
    if (navRegion) {
      toggle.setAttribute("aria-controls", navRegion.id);
    }

    let collapsed = false;
    try {
      collapsed = window.localStorage.getItem(storageKey) === "true";
    } catch {
      collapsed = false;
    }

    const apply = () => {
      const isCollapsed = desktop.matches && collapsed;
      document.body.classList.toggle("pp-primary-nav-collapsed", isCollapsed);
      toggle.hidden = !desktop.matches;
      toggle.setAttribute("aria-expanded", String(!isCollapsed));
      toggle.setAttribute("aria-label", isCollapsed ? "Expand navigation" : "Collapse navigation");
      toggle.title = isCollapsed ? "Expand navigation" : "Collapse navigation";
      navRegion?.setAttribute("aria-hidden", String(isCollapsed));
    };

    const handleToggle = () => {
      collapsed = !collapsed;
      try {
        window.localStorage.setItem(storageKey, String(collapsed));
      } catch {
        // The control still works for the current page when storage is unavailable.
      }
      apply();
    };
    const handleMediaChange = () => apply();
    toggle.addEventListener("click", handleToggle);
    desktop.addEventListener("change", handleMediaChange);
    apply();

    disposePrimaryNavCollapse = () => {
      toggle.removeEventListener("click", handleToggle);
      desktop.removeEventListener("change", handleMediaChange);
    };
  };

  let disposeRfcReader = () => {};

  const initializeRfcReader = (root = document) => {
    disposeRfcReader();
    disposeRfcReader = () => {};

    const host = root.querySelector("[data-rfc-reader]");
    const dataNode = root.querySelector("script[data-rfc-catalog]");
    const fallback = root.querySelector("[data-rfc-fallback]");
    if (!host || !dataNode || !fallback) {
      return;
    }

    let records;
    try {
      records = JSON.parse(dataNode.textContent ?? "");
      if (!Array.isArray(records) || records.length === 0) {
        return;
      }
      const requiredFields = ["id", "title", "status", "status_key", "lifecycle", "created", "summary", "motivation", "href"];
      const hasInvalidRecord = records.some((record) => {
        const hasInvalidField = requiredFields.some((field) => typeof record[field] !== "string" || record[field].length === 0);
        const hasInvalidTags = !Array.isArray(record.tags) || record.tags.some((tag) => (
          !tag || typeof tag.key !== "string" || tag.key.length === 0 || typeof tag.label !== "string" || tag.label.length === 0
        ));
        return hasInvalidField || hasInvalidTags;
      });
      if (hasInvalidRecord) {
        return;
      }
    } catch {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const createElement = (tag, className = "", text = "") => {
      const element = document.createElement(tag);
      if (className) {
        element.className = className;
      }
      if (text) {
        element.textContent = text;
      }
      return element;
    };
    const searchable = (value) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    const excerpt = (value, limit) => {
      if (value.length <= limit) {
        return value;
      }
      const candidate = value.slice(0, limit + 1);
      const boundary = candidate.lastIndexOf(" ");
      return `${candidate.slice(0, boundary > limit * 0.72 ? boundary : limit).trim()}…`;
    };
    const recordById = new Map(records.map((record) => [record.id, record]));
    const tagsByKey = new Map();
    const tagCounts = new Map();
    records.forEach((record) => {
      record.tags.forEach((tag) => {
        tagsByKey.set(tag.key, tag.label);
        tagCounts.set(tag.key, (tagCounts.get(tag.key) ?? 0) + 1);
      });
    });
    const sortedTags = [...tagsByKey].sort((left, right) => left[1].localeCompare(right[1]));
    const statusByKey = new Map(records.map((record) => [record.status_key, record.status]));
    const media = window.matchMedia("(max-width: 56em)");
    const compactMedia = window.matchMedia("(max-width: 38em)");
    const defaultState = () => ({
      query: "",
      scope: "all",
      status: "",
      sort: "",
      tags: [],
      selectedId: records[0].id,
      selectedExplicitly: false,
    });
    let state = defaultState();
    let visibleRecords = [...records];
    let urlTimer = null;
    let lastFocusedId = state.selectedId;

    records.forEach((record) => {
      record.searchText = searchable([
        `RFC ${record.id}`,
        record.title,
        record.status,
        record.tags.map((tag) => tag.label).join(" "),
        excerpt(record.summary, 380),
        excerpt(record.motivation, 460),
      ].join(" "));
    });

    const reader = createElement("section", "pp-rfc-reader");
    reader.setAttribute("aria-label", "RFC catalog");
    reader.dataset.mobileView = "results";

    const toolbar = createElement("div", "pp-rfc-reader__toolbar");
    const searchForm = createElement("form", "pp-rfc-reader__search");
    searchForm.setAttribute("role", "search");
    const searchLabel = createElement("label", "pp-sr-only", "Search RFCs");
    const searchId = "pp-rfc-search";
    searchLabel.htmlFor = searchId;
    const searchShell = createElement("div", "pp-rfc-reader__search-shell");
    const activeTags = createElement("div", "pp-rfc-reader__active-tags");
    activeTags.hidden = true;
    const searchInput = createElement("input");
    searchInput.id = searchId;
    searchInput.type = "search";
    searchInput.autocomplete = "off";
    searchInput.placeholder = "Search RFCs or choose tags";
    searchInput.setAttribute("aria-controls", "pp-rfc-records");
    searchInput.setAttribute("aria-expanded", "false");
    const tagMenuButton = createElement("button", "pp-rfc-reader__tag-menu-button");
    tagMenuButton.type = "button";
    tagMenuButton.setAttribute("aria-label", "Choose tag filters");
    tagMenuButton.setAttribute("aria-expanded", "false");
    const tagMenuLabel = createElement("span", "", "Tags");
    const tagMenuCount = createElement("span", "pp-rfc-reader__tag-menu-count");
    tagMenuCount.hidden = true;
    tagMenuButton.append(tagMenuLabel, tagMenuCount);
    const shortcut = createElement("kbd", "", "/");
    shortcut.setAttribute("aria-hidden", "true");
    searchShell.append(activeTags, searchInput, tagMenuButton, shortcut);

    const facets = createElement("div", "pp-rfc-reader__facets");
    const scopeFieldset = createElement("fieldset", "pp-rfc-segments");
    const scopeLegend = createElement("legend", "pp-sr-only", "RFC lifecycle scope");
    scopeFieldset.append(scopeLegend);
    const scopeInputs = new Map();
    const scopeDefinitions = [
      ["all", "All", records.length],
      ["active", "Active", records.filter((record) => record.lifecycle === "active").length],
      ["implemented", "Implemented", records.filter((record) => record.lifecycle === "implemented").length],
    ];
    scopeDefinitions.forEach(([value, label, count]) => {
      const item = createElement("div", "pp-rfc-segments__item");
      const input = createElement("input");
      input.type = "radio";
      input.name = "pp-rfc-scope";
      input.id = `pp-rfc-scope-${value}`;
      input.value = value;
      const inputLabel = createElement("label", "", label);
      inputLabel.htmlFor = input.id;
      inputLabel.append(createElement("span", "", String(count)));
      item.append(input, inputLabel);
      scopeFieldset.append(item);
      scopeInputs.set(value, input);
    });

    const tagInputs = new Map();
    const tagPanel = createElement("div", "pp-rfc-reader__tag-panel");
    tagPanel.id = "pp-rfc-tag-panel";
    tagPanel.hidden = true;
    const tagFieldset = createElement("fieldset");
    const tagLegend = createElement("legend", "", "Filter by tags");
    tagFieldset.append(tagLegend);
    sortedTags.forEach(([key, label]) => {
      const item = createElement("div", "pp-rfc-reader__tag-option");
      const input = createElement("input");
      input.type = "checkbox";
      input.id = `pp-rfc-tag-${key}`;
      input.value = key;
      const inputLabel = createElement("label");
      inputLabel.htmlFor = input.id;
      inputLabel.append(createElement("span", "", label), createElement("span", "", String(tagCounts.get(key))));
      item.append(input, inputLabel);
      tagFieldset.append(item);
      tagInputs.set(key, input);
    });
    const clearTagsButton = createElement("button", "pp-rfc-reader__clear-tags", "Clear tags");
    clearTagsButton.type = "button";
    tagPanel.append(tagFieldset, clearTagsButton);
    searchInput.setAttribute("aria-controls", `${searchInput.getAttribute("aria-controls")} ${tagPanel.id}`);
    tagMenuButton.setAttribute("aria-controls", tagPanel.id);
    searchForm.append(searchLabel, searchShell, tagPanel);

    const resetButton = createElement("button", "pp-rfc-reader__reset", "Reset filters");
    resetButton.type = "button";
    resetButton.hidden = true;
    facets.append(scopeFieldset);
    toolbar.append(searchForm, facets);

    const statusbar = createElement("div", "pp-rfc-reader__statusbar");
    const resultCount = createElement("p", "pp-rfc-reader__count");
    resultCount.setAttribute("role", "status");
    resultCount.setAttribute("aria-live", "polite");
    resultCount.setAttribute("aria-atomic", "true");
    const keyboardHint = createElement("p", "pp-rfc-reader__hint", "↑↓ browse · Enter open");
    keyboardHint.setAttribute("aria-hidden", "true");
    statusbar.append(resultCount, keyboardHint, resetButton);

    const index = createElement("div", "pp-rfc-reader__index");
    const master = createElement("section", "pp-rfc-reader__master");
    master.setAttribute("aria-label", "RFC results");
    const listHeader = createElement("div", "pp-rfc-reader__list-header");
    listHeader.id = "pp-rfc-list-label";
    const statusSlot = createElement("span", "pp-rfc-reader__status-slot");
    const statusFilter = createElement("details", "pp-rfc-reader__status-filter");
    const statusSummary = createElement("summary");
    statusSummary.setAttribute("role", "button");
    statusSummary.setAttribute("aria-expanded", "false");
    const statusSummaryLabel = createElement("span", "", "Status");
    const statusSummaryState = createElement("span", "pp-rfc-reader__status-summary-state");
    statusSummaryState.hidden = true;
    statusSummary.append(statusSummaryLabel, statusSummaryState);
    const statusPanel = createElement("div", "pp-rfc-reader__status-panel");
    statusPanel.id = "pp-rfc-status-panel";
    statusSummary.setAttribute("aria-controls", statusPanel.id);

    const statusInputs = new Map();
    const statusFieldset = createElement("fieldset");
    statusFieldset.append(createElement("legend", "", "Filter"));
    [["", "All statuses"], ...[...statusByKey].sort((left, right) => left[1].localeCompare(right[1]))]
      .forEach(([value, label]) => {
        const option = createElement("label", "pp-rfc-reader__status-option");
        const input = createElement("input");
        input.type = "radio";
        input.name = "pp-rfc-status";
        input.value = value;
        option.append(input, createElement("span", "", label));
        statusFieldset.append(option);
        statusInputs.set(value, input);
      });

    const sortInputs = new Map();
    const sortFieldset = createElement("fieldset");
    sortFieldset.append(createElement("legend", "", "Sort"));
    [
      ["", "RFC number"],
      ["status-asc", "Status A–Z"],
      ["status-desc", "Status Z–A"],
    ].forEach(([value, label]) => {
      const option = createElement("label", "pp-rfc-reader__status-option");
      const input = createElement("input");
      input.type = "radio";
      input.name = "pp-rfc-sort";
      input.value = value;
      option.append(input, createElement("span", "", label));
      sortFieldset.append(option);
      sortInputs.set(value, input);
    });

    statusPanel.append(statusFieldset, sortFieldset);
    statusFilter.append(statusSummary, statusPanel);
    statusSlot.append(statusFilter);
    listHeader.append(
      createElement("span", "", "RFC"),
      statusSlot,
      createElement("span", "", "Title"),
    );
    const list = createElement("div", "pp-rfc-reader__records");
    list.id = "pp-rfc-records";
    list.tabIndex = 0;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Matching RFCs");
    list.setAttribute("aria-controls", "pp-rfc-detail");
    const emptyMessage = createElement("p", "pp-rfc-reader__empty", "No RFCs match these filters.");
    emptyMessage.hidden = true;
    const detail = createElement("article", "pp-rfc-reader__detail");
    detail.id = "pp-rfc-detail";
    detail.tabIndex = 0;
    const rowById = new Map();

    records.forEach((record) => {
      const row = createElement("div", "pp-rfc-row");
      row.dataset.recordId = record.id;
      row.id = `pp-rfc-record-${record.id}`;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", "false");
      row.append(
        createElement("span", "pp-rfc-row__number", record.id),
        createElement("span", "pp-rfc-row__status", record.status),
        createElement("span", "pp-rfc-row__title", record.title),
      );
      list.append(row);
      rowById.set(record.id, row);
    });
    master.append(listHeader, list, emptyMessage);
    index.append(toolbar, statusbar, master);
    reader.append(index, detail);

    const placeStatusFilter = () => {
      if (compactMedia.matches) {
        facets.append(statusFilter);
      } else {
        statusSlot.append(statusFilter);
      }
    };

    let suppressTagPanelFocus = false;
    const setTagPanelOpen = (open, { restoreFocus = false } = {}) => {
      if (sortedTags.length === 0) {
        return;
      }
      tagPanel.hidden = !open;
      searchForm.dataset.tagsOpen = String(open);
      searchInput.setAttribute("aria-expanded", String(open));
      tagMenuButton.setAttribute("aria-expanded", String(open));
      if (open) {
        statusFilter.open = false;
      } else if (restoreFocus) {
        suppressTagPanelFocus = true;
        searchInput.focus();
        suppressTagPanelFocus = false;
      }
    };

    if (sortedTags.length === 0) {
      tagMenuButton.hidden = true;
    }
    placeStatusFilter();

    const appendMetadata = (listNode, label, value) => {
      if (!value) {
        return;
      }
      const group = createElement("div");
      group.append(createElement("dt", "", label));
      const description = createElement("dd");
      if (value instanceof Node) {
        description.append(value);
      } else {
        description.textContent = value;
      }
      group.append(description);
      listNode.append(group);
    };

    const sourceLink = (link) => {
      if (!link?.url || !link?.label) {
        return null;
      }
      const anchor = createElement("a", "", link.label);
      anchor.href = link.url;
      return anchor;
    };

    const sourceLinks = (links) => {
      const anchors = (links ?? []).map(sourceLink).filter(Boolean);
      if (anchors.length === 0) {
        return null;
      }
      if (anchors.length === 1) {
        return anchors[0];
      }
      const group = createElement("span", "pp-rfc-reader__source-links");
      anchors.forEach((anchor, index) => {
        if (index > 0) {
          group.append(createElement("span", "", "·"));
        }
        group.append(anchor);
      });
      return group;
    };

    const writeUrl = (mode = "replace", { mobileDetail = false } = {}) => {
      const url = new URL(window.location.href);
      rfcReaderContract.writeParams(url.searchParams, state);
      const existingHistoryState = window.history.state;
      const historyState = existingHistoryState && typeof existingHistoryState === "object"
        ? { ...existingHistoryState, ppRfcDetail: mobileDetail }
        : { ppRfcDetail: mobileDetail };
      window.history[mode === "push" ? "pushState" : "replaceState"](historyState, "", url);
    };

    const detailHeader = createElement("header", "pp-rfc-reader__detail-header");
    const detailBody = createElement("div", "pp-rfc-reader__detail-body");
    detail.append(detailHeader, detailBody);

    const renderDetail = (record, { focusHeading = false, resetScroll = true } = {}) => {
      detailHeader.replaceChildren();
      detailBody.replaceChildren();
      if (!record) {
        detail.hidden = true;
        return;
      }
      detail.hidden = false;
      const backButton = createElement("button", "pp-rfc-reader__back", `Back to ${visibleRecords.length} results`);
      backButton.type = "button";
      backButton.addEventListener("click", () => {
        if (window.history.state?.ppRfcDetail) {
          window.history.back();
          return;
        }
        state.selectedExplicitly = false;
        reader.dataset.mobileView = "results";
        writeUrl("replace");
        window.requestAnimationFrame(() => focusList(state.selectedId));
      }, { signal });

      const eyebrow = createElement("p", "pp-rfc-reader__eyebrow", `RFC ${record.id}`);
      const heading = createElement("h2", "", record.title);
      heading.id = "pp-rfc-detail-title";
      heading.tabIndex = -1;
      detail.setAttribute("aria-labelledby", heading.id);
      const metadata = createElement("dl", "pp-rfc-reader__metadata");
      appendMetadata(metadata, "Status", createElement("span", "pp-rfc-reader__status-pill", record.status));
      if (record.tags.length > 0) {
        const tags = createElement("span", "pp-rfc-reader__detail-tags");
        record.tags.forEach((tag) => {
          const tagButton = createElement("button", "pp-rfc-reader__tag-chip", tag.label);
          tagButton.type = "button";
          tagButton.dataset.tagKey = tag.key;
          const isActive = state.tags.includes(tag.key);
          tagButton.setAttribute("aria-pressed", String(isActive));
          tagButton.setAttribute("aria-label", `${isActive ? "Remove" : "Add"} ${tag.label} tag filter`);
          tagButton.addEventListener("click", () => {
            state.tags = rfcReaderContract.setTag(state.tags, tag.key, !state.tags.includes(tag.key));
            prepareFilterChange();
            applyControls();
            applyFilters();
            writeUrl("push");
            window.requestAnimationFrame(() => {
              detail.querySelector(`[data-tag-key="${tag.key}"]`)?.focus({ preventScroll: true });
            });
          }, { signal });
          tags.append(tagButton);
        });
        appendMetadata(metadata, "Tags", tags);
      }
      appendMetadata(metadata, "Created", record.created);
      appendMetadata(metadata, "Issue", sourceLinks(record.issue_links));
      appendMetadata(metadata, "RFC PR", sourceLinks(record.rfc_pr_links));

      const openLink = createElement("a", "pp-rfc-reader__open", "Open full RFC →");
      openLink.href = record.href;

      const summarySection = createElement("section", "pp-rfc-reader__section");
      summarySection.append(
        createElement("h3", "", "Summary"),
        createElement("p", "", excerpt(record.summary, 430)),
      );
      const motivationSection = createElement("section", "pp-rfc-reader__section");
      motivationSection.append(
        createElement("h3", "", "Why it matters"),
        createElement("p", "", excerpt(record.motivation, 540)),
      );
      const headingGroup = createElement("div", "pp-rfc-reader__detail-heading");
      headingGroup.append(eyebrow, heading);
      detailHeader.append(backButton, headingGroup, openLink);
      detailBody.append(metadata, summarySection, motivationSection);

      const related = (record.related_ids ?? []).map((id) => recordById.get(id)).filter(Boolean);
      if (related.length > 0) {
        const relatedSection = createElement("section", "pp-rfc-reader__section");
        const relatedLinks = createElement("div", "pp-rfc-reader__related");
        related.forEach((relatedRecord) => {
          const link = createElement("a", "", `RFC ${relatedRecord.id}`);
          link.href = relatedRecord.href;
          relatedLinks.append(link);
        });
        relatedSection.append(createElement("h3", "", "Related records"), relatedLinks);
        detailBody.append(relatedSection);
      }

      if (resetScroll) {
        detail.scrollTop = 0;
      }

      if (focusHeading) {
        window.requestAnimationFrame(() => heading.focus());
      }
    };

    const matchesRecord = (record) => {
      return rfcReaderContract.matches(record, state, searchable);
    };

    const syncListSelection = () => {
      const selectedRow = rowById.get(state.selectedId);
      rowById.forEach((row, id) => {
        row.setAttribute("aria-selected", String(id === state.selectedId && !row.hidden));
      });
      if (selectedRow && !selectedRow.hidden) {
        list.setAttribute("aria-activedescendant", selectedRow.id);
      } else {
        list.removeAttribute("aria-activedescendant");
      }
    };

    const applyFilters = ({ focusDetail = false } = {}) => {
      const previousSelectedId = state.selectedId;
      const orderedRecords = rfcReaderContract.sortRecords(records, state.sort);
      visibleRecords = orderedRecords.filter(matchesRecord);
      const visibleIds = new Set(visibleRecords.map((record) => record.id));
      orderedRecords.forEach((record) => {
        const row = rowById.get(record.id);
        const visible = visibleIds.has(record.id);
        row.hidden = !visible;
        list.append(row);
      });

      if (!visibleIds.has(state.selectedId)) {
        state.selectedId = rfcReaderContract.resolvedRecordId(visibleRecords, state.selectedId);
        state.selectedExplicitly = false;
      }
      syncListSelection();

      const count = visibleRecords.length;
      resultCount.textContent = count === 1 ? "1 matching design record" : `${count} matching design records`;
      emptyMessage.hidden = count !== 0;
      list.hidden = count === 0;
      list.tabIndex = count === 0 ? -1 : 0;
      listHeader.hidden = count === 0;
      resetButton.hidden = !state.query
        && state.scope === "all"
        && !state.status
        && !state.sort
        && state.tags.length === 0;
      renderDetail(recordById.get(state.selectedId), {
        focusHeading: focusDetail,
        resetScroll: previousSelectedId !== state.selectedId,
      });
      const selectedId = state.selectedId;
      ensureRowVisible(selectedId);
      window.requestAnimationFrame(() => {
        if (state.selectedId === selectedId) {
          ensureRowVisible(selectedId);
        }
      });
    };

    const prepareFilterChange = () => {
      if (media.matches) {
        state.selectedExplicitly = false;
        reader.dataset.mobileView = "results";
      }
    };

    const applyControls = () => {
      searchInput.value = state.query;
      (scopeInputs.get(state.scope) ?? scopeInputs.get("all")).checked = true;
      (statusInputs.get(state.status) ?? statusInputs.get("")).checked = true;
      (sortInputs.get(state.sort) ?? sortInputs.get("")).checked = true;
      tagInputs.forEach((input, key) => {
        input.checked = state.tags.includes(key);
      });
      const fullStatusLabel = state.status ? statusByKey.get(state.status) : "";
      const compactStatusLabel = state.sort
        ? ({ Implemented: "Impl.", "In Progress": "In prog." }[fullStatusLabel] ?? fullStatusLabel)
        : fullStatusLabel;
      const summaryState = [
        compactStatusLabel,
        state.sort ? (state.sort === "status-asc" ? "A–Z" : "Z–A") : "",
      ].filter(Boolean).join(" · ");
      statusSummaryLabel.hidden = Boolean(summaryState);
      statusSummaryState.textContent = summaryState;
      statusSummaryState.hidden = !summaryState;
      statusFilter.dataset.filtered = String(Boolean(state.status));
      statusSummary.setAttribute("aria-label", [
        "Status options",
        state.status ? `filter ${statusByKey.get(state.status)}` : "all statuses",
        state.sort === "status-asc"
          ? "sorted A to Z"
          : state.sort === "status-desc" ? "sorted Z to A" : "sorted by RFC number",
      ].join(", "));
      clearTagsButton.hidden = state.tags.length === 0;
      activeTags.replaceChildren();
      state.tags.slice(0, 1).forEach((key) => {
        const chip = createElement("button", "pp-rfc-reader__active-tag", `${tagsByKey.get(key)} ×`);
        chip.type = "button";
        chip.setAttribute("aria-label", `Remove ${tagsByKey.get(key)} tag filter`);
        chip.addEventListener("click", () => {
          state.tags = state.tags.filter((tag) => tag !== key);
          applyControls();
          applyFilters();
          writeUrl("push");
          tagMenuButton.focus({ preventScroll: true });
        }, { signal });
        activeTags.append(chip);
      });
      if (state.tags.length > 1) {
        const overflow = createElement("button", "pp-rfc-reader__active-tag", `+${state.tags.length - 1}`);
        overflow.type = "button";
        overflow.setAttribute("aria-label", `Show all ${state.tags.length} selected tag filters`);
        overflow.addEventListener("click", () => {
          setTagPanelOpen(true);
          tagMenuButton.focus({ preventScroll: true });
        }, { signal });
        activeTags.append(overflow);
      }
      activeTags.hidden = state.tags.length === 0;
      tagMenuCount.textContent = String(state.tags.length);
      tagMenuCount.hidden = state.tags.length === 0;
    };

    const readUrl = ({ preserveSelectedId = "" } = {}) => {
      const params = new URLSearchParams(window.location.search);
      const hadRedundantScope = Boolean(params.get("status") && params.get("scope"));
      state = rfcReaderContract.readParams(params, defaultState(), {
        statuses: new Set(statusByKey.keys()),
        tags: new Set(tagsByKey.keys()),
        records: new Set(recordById.keys()),
      });
      if (!state.selectedExplicitly && recordById.has(preserveSelectedId)) {
        state.selectedId = preserveSelectedId;
      }
      const requestedSelectedId = state.selectedId;
      const requestedExplicitSelection = state.selectedExplicitly;
      applyControls();
      applyFilters();
      lastFocusedId = state.selectedId;
      reader.dataset.mobileView = media.matches && state.selectedExplicitly ? "detail" : "results";
      if (hadRedundantScope || (requestedExplicitSelection && (
        !state.selectedExplicitly || state.selectedId !== requestedSelectedId
      ))) {
        writeUrl("replace");
      }
    };

    scopeInputs.forEach((input, value) => {
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        state.scope = value;
        if (value !== "all") {
          state.status = "";
        }
        prepareFilterChange();
        applyControls();
        applyFilters();
        writeUrl("push");
      }, { signal });
    });
    statusInputs.forEach((input, value) => {
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        state.status = value;
        if (value) {
          state.scope = "all";
        }
        prepareFilterChange();
        applyControls();
        applyFilters();
        writeUrl("push");
      }, { signal });
    });
    sortInputs.forEach((input, value) => {
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        state.sort = value;
        prepareFilterChange();
        applyControls();
        applyFilters();
        writeUrl("push");
      }, { signal });
    });
    statusFilter.addEventListener("toggle", () => {
      statusSummary.setAttribute("aria-expanded", String(statusFilter.open));
      if (statusFilter.open) {
        setTagPanelOpen(false);
      }
    }, { signal });
    tagInputs.forEach((input, key) => {
      input.addEventListener("change", () => {
        state.tags = rfcReaderContract.setTag(state.tags, key, input.checked);
        prepareFilterChange();
        applyControls();
        applyFilters();
        writeUrl("push");
      }, { signal });
    });
    clearTagsButton.addEventListener("click", () => {
      state.tags = [];
      prepareFilterChange();
      applyControls();
      applyFilters();
      writeUrl("push");
      searchInput.focus({ preventScroll: true });
    }, { signal });
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      prepareFilterChange();
      applyFilters();
      if (urlTimer !== null) {
        window.clearTimeout(urlTimer);
      }
      urlTimer = window.setTimeout(() => writeUrl("replace"), 150);
    }, { signal });
    searchInput.addEventListener("focus", () => {
      if (!suppressTagPanelFocus) {
        setTagPanelOpen(true);
      }
    }, { signal });
    tagMenuButton.addEventListener("click", () => {
      setTagPanelOpen(tagPanel.hidden);
      if (!tagPanel.hidden) {
        searchInput.focus({ preventScroll: true });
      }
    }, { signal });
    searchShell.addEventListener("click", (event) => {
      if (event.target === searchShell) {
        searchInput.focus();
      }
    }, { signal });
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" && visibleRecords.length > 0) {
        event.preventDefault();
        setTagPanelOpen(false);
        focusList(state.selectedId);
      }
    }, { signal });
    searchForm.addEventListener("submit", (event) => event.preventDefault(), { signal });
    resetButton.addEventListener("click", () => {
      const selectedId = state.selectedId;
      state = { ...defaultState(), selectedId };
      applyControls();
      reader.dataset.mobileView = "results";
      applyFilters();
      writeUrl("push");
      suppressTagPanelFocus = true;
      searchInput.focus();
      suppressTagPanelFocus = false;
    }, { signal });

    const ensureRowVisible = (targetId) => {
      const row = rowById.get(targetId);
      if (!row || row.hidden) {
        return;
      }

      const listRect = list.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      if (rowRect.top < listRect.top) {
        list.scrollTop -= Math.ceil(listRect.top - rowRect.top);
      } else if (rowRect.bottom > listRect.bottom) {
        list.scrollTop += Math.ceil(rowRect.bottom - listRect.bottom);
      }
    };

    const focusList = (targetId = state.selectedId) => {
      const row = rowById.get(targetId);
      if (!row || row.hidden) {
        return;
      }
      list.focus({ preventScroll: true });
      ensureRowVisible(targetId);
    };

    const selectRecord = (targetId, {
      focusHeading = media.matches,
      showDetail = media.matches,
    } = {}) => {
      const row = rowById.get(targetId);
      const record = recordById.get(targetId);
      if (!row || row.hidden || !record) {
        return;
      }

      const previousSelectedId = state.selectedId;
      state.selectedId = targetId;
      state.selectedExplicitly = !media.matches || showDetail;
      lastFocusedId = targetId;
      syncListSelection();
      renderDetail(record, {
        focusHeading,
        resetScroll: previousSelectedId !== targetId,
      });

      if (media.matches && showDetail) {
        reader.dataset.mobileView = "detail";
      } else {
        focusList(targetId);
      }
      writeUrl(
        media.matches && showDetail ? "push" : "replace",
        { mobileDetail: media.matches && showDetail },
      );
    };

    rowById.forEach((row, id) => {
      row.addEventListener("click", () => selectRecord(id), { signal });
    });

    list.addEventListener("focus", () => {
      reader.dataset.listFocus = "true";
      ensureRowVisible(state.selectedId);
    }, { signal });
    list.addEventListener("blur", () => {
      reader.dataset.listFocus = "false";
    }, { signal });
    list.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const record = recordById.get(state.selectedId);
        if (record && media.matches) {
          selectRecord(record.id, { focusHeading: true, showDetail: true });
        } else if (record) {
          window.location.assign(record.href);
        }
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const offset = event.key === "ArrowDown" ? 1 : -1;
        const targetId = rfcReaderContract.adjacentRecordId(visibleRecords, state.selectedId, offset);
        selectRecord(targetId, { focusHeading: false, showDetail: false });
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const target = event.key === "Home" ? visibleRecords[0] : visibleRecords.at(-1);
        selectRecord(target?.id, { focusHeading: false, showDetail: false });
      }
    }, { signal });

    const handleGlobalKeydown = (event) => {
      const target = event.target;
      const isEditable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
      if (event.key === "/" && !isEditable && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        searchInput.focus();
      } else if (event.key === "Escape" && !tagPanel.hidden && target instanceof Node && searchForm.contains(target)) {
        event.preventDefault();
        setTagPanelOpen(false, { restoreFocus: true });
      } else if (event.key === "Escape" && statusFilter.open && target instanceof Node && statusFilter.contains(target)) {
        event.preventDefault();
        statusFilter.open = false;
        statusSummary.focus();
      }
    };
    const handleDocumentPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!searchForm.contains(target)) {
        setTagPanelOpen(false);
      }
      if (!statusFilter.contains(target)) {
        statusFilter.open = false;
      }
    };
    window.addEventListener("keydown", handleGlobalKeydown, { signal, capture: true });
    document.addEventListener("pointerdown", handleDocumentPointerDown, { signal });
    window.addEventListener("popstate", () => {
      setTagPanelOpen(false);
      statusFilter.open = false;
      const selectedBeforeNavigation = state.selectedId;
      const wasMobileDetail = media.matches && reader.dataset.mobileView === "detail";
      readUrl({ preserveSelectedId: wasMobileDetail ? selectedBeforeNavigation : "" });
      if (media.matches) {
        window.requestAnimationFrame(() => {
          if (reader.dataset.mobileView === "detail") {
            detailHeader.querySelector("h2")?.focus();
          } else {
            focusList(state.selectedId);
          }
        });
      }
    }, { signal });
    media.addEventListener("change", () => {
      reader.dataset.mobileView = media.matches && state.selectedExplicitly ? "detail" : "results";
    }, { signal });
    compactMedia.addEventListener("change", placeStatusFilter, { signal });

    readUrl();
    host.replaceChildren(reader);
    host.hidden = false;
    fallback.hidden = true;
    host.dataset.rfcReaderReady = "true";
    disposeRfcReader = () => {
      controller.abort();
      if (urlTimer !== null) {
        window.clearTimeout(urlTimer);
      }
    };
  };

  const initializePage = () => {
    initializeSurfaceTabs();
    initializeArchitectureNav();
    initializePrimaryNavCollapse();
    initializeRfcReader();
  };

  if (window.document$?.subscribe) {
    window.document$.subscribe(initializePage);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage, { once: true });
  } else {
    initializePage();
  }
})();
