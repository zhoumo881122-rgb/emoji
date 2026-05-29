const data = window.EMOJI_DATA || [];
const i18n = window.APP_I18N || {};
const categoryI18n = window.CATEGORY_I18N || {};
const zhLabels = window.ZH_EMOJI_LABELS || {};
const currentLang = document.body.dataset.lang || "en";
const storageKey = "vagatools-emoji";
const pageSize = 180;

const popularEmoji = new Set(
  "😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😍 😘 😎 🤩 🥳 😭 😡 👍 👎 👏 🙌 🙏 💪 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💯 ✨ 🔥 🎉 ✅ ❌ ⭐ 🌟 🚀".split(
    " ",
  ),
);

const els = {
  languageSelect: document.querySelector("#languageSelect"),
  searchInput: document.querySelector("#searchInput"),
  clearSearch: document.querySelector("#clearSearch"),
  quickTabs: document.querySelector("#quickTabs"),
  categoryList: document.querySelector("#categoryList"),
  emojiGrid: document.querySelector("#emojiGrid"),
  resultCount: document.querySelector("#resultCount"),
  sectionTitle: document.querySelector("#sectionTitle"),
  emptyState: document.querySelector("#emptyState"),
  copyVisible: document.querySelector("#copyVisible"),
  toast: document.querySelector("#toast"),
  dialog: document.querySelector("#emojiDialog"),
  closeDialog: document.querySelector("#closeDialog"),
  dialogSymbol: document.querySelector("#dialogSymbol"),
  dialogName: document.querySelector("#dialogName"),
  dialogCode: document.querySelector("#dialogCode"),
  dialogGroup: document.querySelector("#dialogGroup"),
  dialogCopy: document.querySelector("#dialogCopy"),
  dialogFavorite: document.querySelector("#dialogFavorite"),
};

const state = {
  query: new URLSearchParams(location.search).get("q") || "",
  activeMode: "all",
  activeGroup: "",
  visibleLimit: pageSize,
  dialogEmoji: null,
  favorites: readStore("favorites"),
  recent: readStore("recent"),
};

const groupCounts = data.reduce((map, item) => {
  map.set(item.g, (map.get(item.g) || 0) + 1);
  return map;
}, new Map());

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(`${storageKey}:${key}`) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  localStorage.setItem(`${storageKey}:${key}`, JSON.stringify(value.slice(0, 80)));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function translatedGroup(group) {
  return categoryI18n[group]?.[currentLang] || categoryI18n[group]?.en || group;
}

function stripEmojiVariants(symbol) {
  return symbol.replace(/\uFE0F/g, "");
}

function emojiLabel(item) {
  if (currentLang === "zh-CN") {
    return zhLabels[item.e] || zhLabels[stripEmojiVariants(item.e)] || item.n;
  }
  return item.n;
}

function searchableText(item) {
  return normalize([item.e, item.n, emojiLabel(item), item.g, item.s, item.c, translatedGroup(item.g)].join(" "));
}

function itemByEmoji(symbol) {
  return data.find((item) => item.e === symbol);
}

function setQuery(query) {
  state.query = query;
  state.visibleLimit = pageSize;
  const url = new URL(location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  history.replaceState(null, "", url);
  render();
}

function setMode(mode, group = "") {
  state.activeMode = mode;
  state.activeGroup = group;
  state.visibleLimit = pageSize;
  render();
}

function getFilteredItems() {
  let items = data;
  if (state.activeMode === "popular") {
    items = items.filter((item) => popularEmoji.has(item.e));
  } else if (state.activeMode === "favorites") {
    items = state.favorites.map(itemByEmoji).filter(Boolean);
  } else if (state.activeMode === "recent") {
    items = state.recent.map(itemByEmoji).filter(Boolean);
  } else if (state.activeMode === "group" && state.activeGroup) {
    items = items.filter((item) => item.g === state.activeGroup);
  }

  const query = normalize(state.query);
  if (query) {
    items = items.filter((item) => searchableText(item).includes(query));
  }

  return items;
}

function buttonClass(active) {
  return `category-button${active ? " active" : ""}`;
}

function renderTabs() {
  const tabs = [
    { mode: "all", label: i18n.all, count: data.length },
    { mode: "popular", label: i18n.popular, count: popularEmoji.size },
    { mode: "favorites", label: i18n.favorites, count: state.favorites.length },
    { mode: "recent", label: i18n.recent, count: state.recent.length },
  ];

  els.quickTabs.innerHTML = tabs
    .map(
      (tab) => `<button class="${buttonClass(state.activeMode === tab.mode)}" data-mode="${tab.mode}" type="button">
        <strong>${escapeHtml(tab.label)}</strong><span>${tab.count}</span>
      </button>`,
    )
    .join("");
}

function renderCategories() {
  els.categoryList.innerHTML = [...groupCounts.entries()]
    .map(
      ([group, count]) => `<button class="${buttonClass(
        state.activeMode === "group" && state.activeGroup === group,
      )}" data-group="${escapeHtml(group)}" type="button">
        <strong>${escapeHtml(translatedGroup(group))}</strong><span>${count}</span>
      </button>`,
    )
    .join("");
}

function renderGrid(items) {
  const visibleItems = items.slice(0, state.visibleLimit);
  els.emojiGrid.innerHTML = visibleItems.map(cardHtml).join("");
  els.emptyState.hidden = items.length !== 0;

  if (items.length > state.visibleLimit) {
    const loadMore = document.createElement("button");
    loadMore.className = "ghost-button load-more";
    loadMore.type = "button";
    loadMore.textContent = `${i18n.all} +${Math.min(pageSize, items.length - state.visibleLimit)}`;
    loadMore.addEventListener("click", () => {
      state.visibleLimit += pageSize;
      render();
    });
    els.emojiGrid.append(loadMore);
  }
}

function cardHtml(item) {
  const favorite = state.favorites.includes(item.e);
  const label = emojiLabel(item);
  return `<article class="emoji-card" data-emoji="${escapeHtml(item.e)}" tabindex="0" aria-label="${escapeHtml(label)}">
    <button class="favorite-toggle${favorite ? " active" : ""}" type="button" data-favorite="${escapeHtml(
      item.e,
    )}" aria-label="${escapeHtml(i18n.favorites)}">${favorite ? "★" : "☆"}</button>
    <div class="emoji-symbol">${escapeHtml(item.e)}</div>
    <div class="emoji-name">${escapeHtml(label)}</div>
    <div class="emoji-code">${escapeHtml(item.c)}</div>
  </article>`;
}

function renderTitle(items) {
  let title = i18n.all;
  if (state.activeMode === "popular") title = i18n.popular;
  if (state.activeMode === "favorites") title = i18n.favorites;
  if (state.activeMode === "recent") title = i18n.recent;
  if (state.activeMode === "group") title = translatedGroup(state.activeGroup);
  if (state.query) title = `${title} · ${state.query}`;
  els.sectionTitle.textContent = title;
  els.resultCount.textContent = items.length.toLocaleString(currentLang);
}

function render() {
  const items = getFilteredItems();
  renderTabs();
  renderCategories();
  renderTitle(items);
  renderGrid(items);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

async function copyEmoji(symbol) {
  await writeClipboard(symbol);
  state.recent = [symbol, ...state.recent.filter((item) => item !== symbol)].slice(0, 40);
  writeStore("recent", state.recent);
  showToast();
  renderTabs();
}

function showToast() {
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 1300);
}

function toggleFavorite(symbol) {
  if (state.favorites.includes(symbol)) {
    state.favorites = state.favorites.filter((item) => item !== symbol);
  } else {
    state.favorites = [symbol, ...state.favorites].slice(0, 80);
  }
  writeStore("favorites", state.favorites);
  render();
  refreshDialogFavorite();
}

function openDialog(item) {
  state.dialogEmoji = item;
  els.dialogSymbol.textContent = item.e;
  els.dialogName.textContent = emojiLabel(item);
  els.dialogCode.textContent = item.c;
  els.dialogGroup.textContent = translatedGroup(item.g);
  refreshDialogFavorite();
  els.dialog.showModal();
}

function refreshDialogFavorite() {
  if (!state.dialogEmoji) return;
  const favorite = state.favorites.includes(state.dialogEmoji.e);
  els.dialogFavorite.textContent = favorite ? "★" : i18n.favorites;
}

function detectLanguageRedirect() {
  if (document.body.dataset.lang !== "zh-CN") return;
  if (sessionStorage.getItem("emojiLangChecked")) return;
  sessionStorage.setItem("emojiLangChecked", "1");
  const language = (navigator.language || "").toLowerCase();
  const match = (window.SITE_LANGUAGES || []).find((item) => {
    const code = item.code.toLowerCase();
    return code !== "zh-cn" && (language === code || language.startsWith(code.split("-")[0]));
  });
  if (match?.dir && match.dir !== ".") {
    location.replace(`/${match.dir}/${location.search}`);
  }
}

function initAdSlots() {
  const applyAdBandState = (slot) => {
    const band = slot.closest(".ad-band");
    if (!band) return;

    const status = slot.getAttribute("data-ad-status");
    const filled = status === "filled";
    const mobile = window.matchMedia("(max-width: 560px)").matches;
    const height = filled ? (mobile ? 72 : 90) : mobile ? 8 : 12;

    band.classList.toggle("ad-filled", filled);
    band.classList.toggle("ad-empty", !filled);
    band.style.setProperty("height", `${height}px`, "important");
    band.style.setProperty("min-height", `${height}px`, "important");
    band.style.setProperty("max-height", `${height}px`, "important");
    band.style.setProperty("overflow", "hidden", "important");

    if (filled) {
      slot.style.setProperty("display", "block", "important");
      slot.style.setProperty("height", `${height}px`, "important");
      slot.style.setProperty("min-height", `${height}px`, "important");
      slot.style.setProperty("max-height", `${height}px`, "important");
    } else {
      slot.style.setProperty("display", "none", "important");
      slot.style.setProperty("height", "0px", "important");
      slot.style.setProperty("min-height", "0px", "important");
      slot.style.setProperty("max-height", "0px", "important");
    }
  };

  document.querySelectorAll(".adsbygoogle").forEach((slot) => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers and local previews can block AdSense; the site should remain usable.
    }

    [900, 1800, 4000].forEach((delay) => window.setTimeout(() => applyAdBandState(slot), delay));
    new MutationObserver(() => applyAdBandState(slot)).observe(slot, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });
  });
}

els.languageSelect?.addEventListener("change", (event) => {
  location.href = event.target.value + location.search;
});

els.searchInput.value = state.query;
els.searchInput?.addEventListener("input", (event) => setQuery(event.target.value));
els.clearSearch?.addEventListener("click", () => {
  els.searchInput.value = "";
  setQuery("");
  els.searchInput.focus();
});

els.quickTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (button) setMode(button.dataset.mode);
});

els.categoryList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-group]");
  if (button) setMode("group", button.dataset.group);
});

els.emojiGrid?.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    event.stopPropagation();
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }
  const card = event.target.closest("[data-emoji]");
  if (!card) return;
  const item = itemByEmoji(card.dataset.emoji);
  if (item) {
    copyEmoji(item.e);
    openDialog(item);
  }
});

els.emojiGrid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-emoji]");
  if (!card) return;
  event.preventDefault();
  const item = itemByEmoji(card.dataset.emoji);
  if (item) {
    copyEmoji(item.e);
    openDialog(item);
  }
});

els.copyVisible?.addEventListener("click", () => {
  const symbols = getFilteredItems()
    .slice(0, 60)
    .map((item) => item.e)
    .join(" ");
  if (symbols) {
    writeClipboard(symbols);
    showToast();
  }
});

els.closeDialog?.addEventListener("click", () => els.dialog.close());
els.dialog?.addEventListener("click", (event) => {
  if (event.target === els.dialog) els.dialog.close();
});
els.dialogCopy?.addEventListener("click", () => {
  if (state.dialogEmoji) copyEmoji(state.dialogEmoji.e);
});
els.dialogFavorite?.addEventListener("click", () => {
  if (state.dialogEmoji) toggleFavorite(state.dialogEmoji.e);
});

detectLanguageRedirect();
render();
initAdSlots();
