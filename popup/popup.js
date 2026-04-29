"use strict";

const PREF_ENGINE = "privacy.trackingprotection.content.protection.enabled";
const PREF_LISTS  = "privacy.trackingprotection.content.protection.test_list_urls";

const DEFAULT_LISTS = [
  "https://easylist.to/easylist/easylist.txt",
  "https://easylist.to/easylist/easyprivacy.txt",
  "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
  "https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/annoyances-others.txt"
];

const PRESET_LISTS = [
  { name: "EasyList",         url: "https://easylist.to/easylist/easylist.txt" },
  { name: "EasyPrivacy",      url: "https://easylist.to/easylist/easyprivacy.txt" },
  { name: "Cookie Monster",   url: "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt" },
  { name: "uBO Annoyances",   url: "https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/annoyances-others.txt" },
  { name: "uBO Filters",      url: "https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/filters.txt" },
  { name: "Peter Lowe",       url: "https://pgl.yoyo.org/adservers/serverlist.php?hostformat=adblockplus&showintro=1&mimetype=plaintext" },
  { name: "AdGuard Base",     url: "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_2_Base/filter.txt" },
  { name: "AdGuard Tracking", url: "https://raw.githubusercontent.com/AdguardTeam/FiltersRegistry/master/filters/filter_3_Spyware/filter.txt" },
];

const KNOWN_NAMES = {
  "easylist.to/easylist/easylist.txt":     "EasyList",
  "easylist.to/easylist/easyprivacy.txt":  "EasyPrivacy",
  "fanboy-cookiemonster.txt":              "Cookie Monster",
  "annoyances-others.txt":                "uBO Annoyances",
  "filters/filters.txt":                  "uBO Filters",
  "pgl.yoyo.org":                         "Peter Lowe",
  "filter_2_Base":                        "AdGuard Base",
  "filter_3_Spyware":                     "AdGuard Tracking",
};

// DOM
const etpToggle        = document.getElementById("etpToggle");
const etpWarn          = document.getElementById("etpWarn");
const engineCopyBtn    = document.getElementById("engineCopyBtn");
const engineMarkBtn    = document.getElementById("engineMarkBtn");
const engineAppliedEl  = document.getElementById("engineApplied");
const listContainer    = document.getElementById("listContainer");
const listCountBadge   = document.getElementById("listCountBadge");
const listsAppliedEl   = document.getElementById("listsApplied");
const newListUrl       = document.getElementById("newListUrl");
const addListBtn       = document.getElementById("addListBtn");
const listsCopyBtn     = document.getElementById("listsCopyBtn");
const listsMarkBtn     = document.getElementById("listsMarkBtn");
const presetChips      = document.getElementById("presetChips");
const valuePreviewText = document.getElementById("valuePreviewText");
const resetBtn         = document.getElementById("resetBtn");
const helpLink         = document.getElementById("helpLink");
const modalBackdrop    = document.getElementById("modalBackdrop");
const modalClose       = document.getElementById("modalClose");
const toast            = document.getElementById("toast");

// State
let lists          = [];
let etpDisabled    = false;
let engineAppliedB = false;
let listsAppliedB  = false;

// Init — read storage first, then check real ETP state via privacy API
(async () => {
  const stored = await browser.storage.local.get(["lists","etpDisabled","engineApplied","listsApplied"]);
  lists          = stored.lists          ?? DEFAULT_LISTS.slice();
  engineAppliedB = stored.engineApplied  ?? false;
  listsAppliedB  = stored.listsApplied   ?? false;

  // Read real ETP state directly — no background messaging needed
  try {
    const result = await browser.privacy.websites.trackingProtectionMode.get({});
    etpDisabled = (result.value === "never");
  } catch {
    etpDisabled = stored.etpDisabled ?? false;
  }

  renderAll();
})();

// ETP toggle — calls privacy API directly, no background script needed
etpToggle.addEventListener("change", async () => {
  etpDisabled = etpToggle.checked;
  try {
    const mode = etpDisabled ? "never" : "always";
    await browser.privacy.websites.trackingProtectionMode.set({ value: mode });
    await browser.storage.local.set({ etpDisabled });
    showToast(etpDisabled ? "⚠️ ETP disabled" : "🛡 ETP re-enabled");
  } catch (e) {
    etpDisabled = !etpDisabled; // revert on failure
    showToast("❌ Could not change ETP");
  }
  renderEtp();
});

// Copy pref name for engine
engineCopyBtn.addEventListener("click", async () => {
  await copy(PREF_ENGINE);
  showToast("📋 Copied! Paste in about:config search bar, then toggle to true");
});

// Copy pref name for lists — also copy pref name to clipboard first
document.getElementById("listsPrefName").addEventListener("click", async () => {
  await copy(PREF_LISTS);
  showToast("📋 Pref name copied!");
});
document.getElementById("enginePrefName").addEventListener("click", async () => {
  await copy(PREF_ENGINE);
  showToast("📋 Pref name copied!");
});

// Mark engine done
engineMarkBtn.addEventListener("click", async () => {
  engineAppliedB = !engineAppliedB;
  await browser.storage.local.set({ engineApplied: engineAppliedB });
  renderEngineStatus();
  showToast(engineAppliedB ? "✓ Marked as applied" : "Unmarked");
});

// Copy URL list value
listsCopyBtn.addEventListener("click", async () => {
  await copy(lists.join("|"));
  showToast("📋 Copied! In about:config find the pref, click ✏️ and paste");
});

// Mark lists done
listsMarkBtn.addEventListener("click", async () => {
  listsAppliedB = !listsAppliedB;
  await browser.storage.local.set({ listsApplied: listsAppliedB });
  renderListsStatus();
  showToast(listsAppliedB ? "✓ Marked as applied" : "Unmarked");
});

// Add list
addListBtn.addEventListener("click", addList);
newListUrl.addEventListener("keydown", e => { if (e.key === "Enter") addList(); });

async function addList() {
  const raw = newListUrl.value.trim();
  if (!raw) return;
  let url;
  try { url = new URL(raw).href; } catch { showToast("⚠️ Invalid URL"); return; }
  if (lists.includes(url)) { showToast("⚠️ Already added"); return; }
  lists.push(url);
  newListUrl.value = "";
  listsAppliedB = false;
  await browser.storage.local.set({ lists, listsApplied: false });
  renderLists();
  renderPresets();
  renderPreview();
  renderListsStatus();
  showToast("➕ Added — remember to re-apply Step 2");
}

async function removeList(url) {
  lists = lists.filter(u => u !== url);
  listsAppliedB = false;
  await browser.storage.local.set({ lists, listsApplied: false });
  renderLists();
  renderPresets();
  renderPreview();
  renderListsStatus();
  showToast("🗑 Removed — remember to re-apply Step 2");
}

// Reset
resetBtn.addEventListener("click", async () => {
  lists = DEFAULT_LISTS.slice();
  listsAppliedB = false;
  await browser.storage.local.set({ lists, listsApplied: false });
  renderLists(); renderPresets(); renderPreview(); renderListsStatus();
  showToast("↺ Reset to defaults");
});

// Modal
helpLink.addEventListener("click", e => { e.preventDefault(); modalBackdrop.classList.remove("hidden"); });
modalClose.addEventListener("click", () => modalBackdrop.classList.add("hidden"));
modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) modalBackdrop.classList.add("hidden"); });

// Clipboard
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function getFriendlyName(url) {
  for (const [frag, name] of Object.entries(KNOWN_NAMES)) {
    if (url.includes(frag)) return name;
  }
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return (parts.at(-1) || url).replace(/\.txt$/i,"").replace(/[-_]/g," ");
  } catch { return url; }
}

// Renderers
function renderAll() {
  renderEtp();
  renderEngineStatus();
  renderListsStatus();
  renderLists();
  renderPresets();
  renderPreview();
}

function renderEtp() {
  etpToggle.checked = etpDisabled;
  etpWarn.classList.toggle("hidden", !etpDisabled);
}

function renderEngineStatus() {
  engineAppliedEl.classList.toggle("hidden", !engineAppliedB);
  engineMarkBtn.textContent = engineAppliedB ? "Unmark ✗" : "Mark done ✓";
}

function renderListsStatus() {
  listsAppliedEl.classList.toggle("hidden", !listsAppliedB);
  listsMarkBtn.textContent = listsAppliedB ? "Unmark ✗" : "Mark done ✓";
}

function renderLists() {
  listContainer.innerHTML = "";
  listCountBadge.textContent = lists.length;
  for (const url of lists) {
    const name = getFriendlyName(url);
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <svg class="list-item-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
        <path d="M4.5 7l2 2 3-3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="list-item-info">
        <div class="list-item-name">${esc(name)}</div>
        <div class="list-item-url">${esc(url)}</div>
      </div>
      <button class="btn-remove" title="Remove">✕</button>`;
    item.querySelector(".btn-remove").addEventListener("click", () => removeList(url));
    listContainer.appendChild(item);
  }
}

function renderPresets() {
  presetChips.innerHTML = "";
  for (const p of PRESET_LISTS) {
    const added = lists.includes(p.url);
    const chip = document.createElement("button");
    chip.className = "chip" + (added ? " chip-added" : "");
    chip.textContent = (added ? "✓ " : "+ ") + p.name;
    chip.disabled = added;
    if (!added) chip.addEventListener("click", async () => {
      lists.push(p.url);
      listsAppliedB = false;
      await browser.storage.local.set({ lists, listsApplied: false });
      renderLists(); renderPresets(); renderPreview(); renderListsStatus();
      showToast(`➕ ${p.name} added`);
    });
    presetChips.appendChild(chip);
  }
}

function renderPreview() {
  valuePreviewText.textContent = lists.join("|") || "(no lists)";
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function esc(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
