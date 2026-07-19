(() => {
  const rfcReaderContract = {
    adjacentRecordId(records, currentId, offset) {
      if (records.length === 0) {
        return "";
      }
      const currentIndex = Math.max(0, records.findIndex((record) => record.id === currentId));
      const nextIndex = Math.max(0, Math.min(records.length - 1, currentIndex + offset));
      return records[nextIndex].id;
    },

    setTag(tags, key, selected) {
      const next = selected
        ? [...new Set([...tags, key])]
        : tags.filter((tag) => tag !== key);
      return next.sort();
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
    const defaultState = () => ({
      query: "",
      scope: "all",
      status: "",
      tags: [],
      selectedId: records[0].id,
      selectedExplicitly: false,
    });
    let state = defaultState();
    let visibleRecords = [...records];
    let urlTimer = null;
    let lastFocusedRecord = null;

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
    const searchInput = createElement("input");
    searchInput.id = searchId;
    searchInput.type = "search";
    searchInput.autocomplete = "off";
    searchInput.placeholder = "Search RFCs, tags, or concepts";
    searchInput.setAttribute("aria-controls", "pp-rfc-records");
    const shortcut = createElement("kbd", "", "/");
    shortcut.setAttribute("aria-hidden", "true");
    searchForm.append(searchLabel, searchInput, shortcut);

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

    const statusLabel = createElement("label", "pp-sr-only", "Filter by status");
    const statusSelect = createElement("select", "pp-rfc-reader__select");
    statusSelect.id = "pp-rfc-status";
    statusLabel.htmlFor = statusSelect.id;
    statusSelect.append(new Option("Status", ""));
    statusByKey.forEach((label, value) => statusSelect.append(new Option(label, value)));

    const tagInputs = new Map();
    const tagFilter = createElement("details", "pp-rfc-reader__tag-filter");
    const tagSummary = createElement("summary", "", "Tags");
    const tagPanel = createElement("div", "pp-rfc-reader__tag-panel");
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
    tagFilter.append(tagSummary, tagPanel);

    const activeTags = createElement("div", "pp-rfc-reader__active-tags");
    activeTags.hidden = true;
    const clearActiveTagsButton = createElement("button", "pp-rfc-reader__clear-active-tags", "Clear tags");
    clearActiveTagsButton.type = "button";

    const resetButton = createElement("button", "pp-rfc-reader__reset", "Reset filters");
    resetButton.type = "button";
    resetButton.hidden = true;
    facets.append(scopeFieldset, statusLabel, statusSelect);
    if (sortedTags.length > 0) {
      facets.append(tagFilter, activeTags);
    } else {
      facets.classList.add("pp-rfc-reader__facets--status-only");
    }
    toolbar.append(searchForm, facets);

    const statusbar = createElement("div", "pp-rfc-reader__statusbar");
    const resultCount = createElement("p", "pp-rfc-reader__count");
    resultCount.setAttribute("role", "status");
    resultCount.setAttribute("aria-live", "polite");
    resultCount.setAttribute("aria-atomic", "true");
    const keyboardHint = createElement("p", "pp-rfc-reader__hint", "/ search · ↓ enter list · ↑↓ select · Enter open · Esc clear");
    statusbar.append(resultCount, resetButton);

    const index = createElement("div", "pp-rfc-reader__index");
    const master = createElement("section", "pp-rfc-reader__master");
    master.setAttribute("aria-label", "RFC results");
    const listHeader = createElement("div", "pp-rfc-reader__list-header");
    ["RFC", "Status", "Title"].forEach((label) => listHeader.append(createElement("span", "", label)));
    const list = createElement("fieldset", "pp-rfc-reader__records");
    list.id = "pp-rfc-records";
    const listLegend = createElement("legend", "pp-sr-only", "Matching RFCs");
    list.append(listLegend);
    const emptyMessage = createElement("p", "pp-rfc-reader__empty", "No RFCs match these filters.");
    emptyMessage.hidden = true;
    const detail = createElement("article", "pp-rfc-reader__detail");
    detail.id = "pp-rfc-detail";
    const rowById = new Map();
    const inputById = new Map();

    records.forEach((record) => {
      const row = createElement("div", "pp-rfc-row");
      row.dataset.recordId = record.id;
      const input = createElement("input", "pp-rfc-row__control");
      input.type = "radio";
      input.name = "pp-rfc-record";
      input.id = `pp-rfc-record-${record.id}`;
      input.value = record.id;
      input.setAttribute("aria-controls", detail.id);
      const label = createElement("label", "pp-rfc-row__label");
      label.htmlFor = input.id;
      label.append(
        createElement("span", "pp-rfc-row__number", record.id),
        createElement("span", "pp-rfc-row__status", record.status),
        createElement("span", "pp-rfc-row__title", record.title),
      );
      row.append(input, label);
      list.append(row);
      rowById.set(record.id, row);
      inputById.set(record.id, input);
    });
    master.append(listHeader, list, emptyMessage);
    index.append(toolbar, statusbar, master, keyboardHint);
    reader.append(index, detail);

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

    const writeUrl = (mode = "replace") => {
      const url = new URL(window.location.href);
      rfcReaderContract.writeParams(url.searchParams, state);
      window.history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
    };

    const renderDetail = (record, focusHeading = false) => {
      detail.replaceChildren();
      if (!record) {
        detail.hidden = true;
        return;
      }
      detail.hidden = false;
      const backButton = createElement("button", "pp-rfc-reader__back", `Back to ${visibleRecords.length} results`);
      backButton.type = "button";
      backButton.addEventListener("click", () => {
        state.selectedExplicitly = false;
        reader.dataset.mobileView = "results";
        writeUrl("replace");
        window.requestAnimationFrame(() => (lastFocusedRecord ?? inputById.get(state.selectedId))?.focus());
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
          const isActive = state.tags.includes(tag.key);
          tagButton.setAttribute("aria-pressed", String(isActive));
          tagButton.setAttribute("aria-label", `${isActive ? "Remove" : "Add"} ${tag.label} tag filter`);
          tagButton.addEventListener("click", () => {
            state.tags = rfcReaderContract.setTag(state.tags, tag.key, !state.tags.includes(tag.key));
            prepareFilterChange();
            applyControls();
            applyFilters();
            writeUrl("push");
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
      detail.append(backButton, eyebrow, heading, metadata, openLink, summarySection, motivationSection);

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
        detail.append(relatedSection);
      }

      if (focusHeading) {
        window.requestAnimationFrame(() => heading.focus());
      }
    };

    const matchesRecord = (record) => {
      return rfcReaderContract.matches(record, state, searchable);
    };

    const applyFilters = ({ focusDetail = false } = {}) => {
      visibleRecords = records.filter(matchesRecord);
      const visibleIds = new Set(visibleRecords.map((record) => record.id));
      records.forEach((record) => {
        const row = rowById.get(record.id);
        const input = inputById.get(record.id);
        const visible = visibleIds.has(record.id);
        row.hidden = !visible;
        input.disabled = !visible;
      });

      if (!visibleIds.has(state.selectedId)) {
        state.selectedId = visibleRecords[0]?.id ?? "";
        state.selectedExplicitly = false;
      }
      inputById.forEach((input, id) => {
        input.checked = id === state.selectedId && visibleIds.has(id);
      });

      const count = visibleRecords.length;
      resultCount.textContent = count === 1 ? "1 matching design record" : `${count} matching design records`;
      emptyMessage.hidden = count !== 0;
      list.hidden = count === 0;
      listHeader.hidden = count === 0;
      resetButton.hidden = !state.query && state.scope === "all" && !state.status && state.tags.length === 0;
      renderDetail(recordById.get(state.selectedId), focusDetail);
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
      statusSelect.value = statusByKey.has(state.status) ? state.status : "";
      tagInputs.forEach((input, key) => {
        input.checked = state.tags.includes(key);
      });
      tagSummary.textContent = state.tags.length > 0 ? `Tags · ${state.tags.length}` : "Tags";
      clearTagsButton.hidden = state.tags.length === 0;
      activeTags.replaceChildren();
      state.tags.forEach((key) => {
        const chip = createElement("button", "pp-rfc-reader__active-tag", `${tagsByKey.get(key)} ×`);
        chip.type = "button";
        chip.setAttribute("aria-label", `Remove ${tagsByKey.get(key)} tag filter`);
        chip.addEventListener("click", () => {
          state.tags = state.tags.filter((tag) => tag !== key);
          applyControls();
          applyFilters();
          writeUrl("push");
        }, { signal });
        activeTags.append(chip);
      });
      if (state.tags.length > 0) {
        activeTags.append(clearActiveTagsButton);
      }
      activeTags.hidden = state.tags.length === 0;
    };

    const readUrl = () => {
      const params = new URLSearchParams(window.location.search);
      state = rfcReaderContract.readParams(params, defaultState(), {
        statuses: new Set(statusByKey.keys()),
        tags: new Set(tagsByKey.keys()),
        records: new Set(recordById.keys()),
      });
      applyControls();
      applyFilters();
      reader.dataset.mobileView = media.matches && state.selectedExplicitly ? "detail" : "results";
    };

    scopeInputs.forEach((input, value) => {
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        state.scope = value;
        prepareFilterChange();
        applyFilters();
        writeUrl("push");
      }, { signal });
    });
    statusSelect.addEventListener("change", () => {
      state.status = statusSelect.value;
      prepareFilterChange();
      applyFilters();
      writeUrl("push");
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
    }, { signal });
    clearActiveTagsButton.addEventListener("click", () => {
      state.tags = [];
      prepareFilterChange();
      applyControls();
      applyFilters();
      writeUrl("push");
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
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" && visibleRecords.length > 0) {
        event.preventDefault();
        focusRecord(state.selectedId);
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
      searchInput.focus();
    }, { signal });

    const focusRecord = (targetId) => {
      const target = inputById.get(targetId);
      const row = rowById.get(targetId);
      if (!target || !row) {
        return;
      }

      const pageX = window.scrollX;
      const pageY = window.scrollY;
      target.focus({ preventScroll: true });
      if (!target.checked) {
        target.click();
      }

      const listRect = list.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      if (rowRect.top < listRect.top) {
        list.scrollTop -= listRect.top - rowRect.top;
      } else if (rowRect.bottom > listRect.bottom) {
        list.scrollTop += rowRect.bottom - listRect.bottom;
      }

      window.scrollTo(pageX, pageY);
      window.requestAnimationFrame(() => window.scrollTo(pageX, pageY));
    };

    inputById.forEach((input, id) => {
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        lastFocusedRecord = input;
        state.selectedId = id;
        state.selectedExplicitly = true;
        renderDetail(recordById.get(id), media.matches);
        if (media.matches) {
          reader.dataset.mobileView = "detail";
        } else {
          input.focus({ preventScroll: true });
        }
        writeUrl(media.matches ? "push" : "replace");
      }, { signal });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          window.location.assign(recordById.get(id).href);
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const offset = event.key === "ArrowDown" ? 1 : -1;
          const targetId = rfcReaderContract.adjacentRecordId(visibleRecords, id, offset);
          focusRecord(targetId);
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          const target = event.key === "Home" ? visibleRecords[0] : visibleRecords.at(-1);
          focusRecord(target?.id);
        }
      }, { signal });
    });

    const handleGlobalKeydown = (event) => {
      const target = event.target;
      const isEditable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
      const targetInReader = target instanceof Node && reader.contains(target);
      if (event.key === "/" && !isEditable && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        searchInput.focus();
      } else if (event.key === "Escape" && targetInReader && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (tagFilter.open) {
          event.preventDefault();
          tagFilter.open = false;
          tagSummary.focus();
          return;
        }
        const hasActiveState = state.query || state.scope !== "all" || state.status || state.tags.length > 0 || state.selectedExplicitly;
        if (!hasActiveState) {
          return;
        }
        event.preventDefault();
        const selectedId = state.selectedId;
        state = { ...defaultState(), selectedId };
        reader.dataset.mobileView = "results";
        applyControls();
        applyFilters();
        writeUrl("replace");
        if (target === searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeydown, { signal, capture: true });
    window.addEventListener("popstate", readUrl, { signal });
    media.addEventListener("change", () => {
      reader.dataset.mobileView = media.matches && state.selectedExplicitly ? "detail" : "results";
    }, { signal });

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
