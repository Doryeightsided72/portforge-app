# adblock-rust Manager

> A Firefox extension that enables and manages Firefox's built-in **adblock-rust** engine — Brave's open-source, Rust-based ad and tracker blocking engine, quietly shipped in Firefox 149.

![Firefox](https://img.shields.io/badge/Firefox-149%2B-FF7139?logo=firefox-browser&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V3-4338ca)
![License](https://img.shields.io/badge/License-MPL--2.0-blue)


## Background

In March 2026, Firefox 149 silently shipped [adblock-rust](https://github.com/brave/adblock-rust) — the same Rust-based content blocking engine that powers Brave's native ad blocker. It supports network request blocking, cosmetic filtering, and is fully compatible with uBlock Origin filter list syntax.

Mozilla shipped it **disabled by default**, with no user interface and no mention in the release notes. It is controlled exclusively by two `about:config` preferences:

| Preference | Purpose |
|---|---|
| `privacy.trackingprotection.content.protection.enabled` | Enables/disables the engine |
| `privacy.trackingprotection.content.protection.test_list_urls` | Pipe-separated list of filter list URLs |

This extension gives you a proper UI to manage both.

## Features

- 🛡 **One-click ETP toggle** — Disable Firefox's built-in Enhanced Tracking Protection so adblock-rust handles blocking instead. Applied instantly via the standard WebExtension Privacy API.
- 📋 **Guided setup** — Step-by-step instructions for the `about:config` prefs that can't be set programmatically, with one-click copy buttons for every value you need to paste.
- 📝 **Filter list manager** — Add, remove, and reorder filter lists. Builds the pipe-separated value for you automatically.
- ⚡ **8 preset lists** — Quick-add popular lists including EasyList, EasyPrivacy, uBO Filters, AdGuard, and more.
- 💾 **Persistent state** — Your lists and settings survive browser restarts.
- ✅ **Progress tracking** — Mark each setup step as done to keep track of what's been applied.

---

## Why can't the extension set the prefs automatically?

Standard WebExtensions **cannot write arbitrary `about:config` preferences**. That requires a Mozilla-signed privileged add-on — something only possible through Mozilla's internal signing pipeline.

The `browser.privacy` API covers ETP (Enhanced Tracking Protection) and that toggle works instantly. But the two adblock-rust prefs have no equivalent WebExtension API, so the extension guides you through a one-time ~30 second manual setup instead.

## Requirements

- **Firefox 149 or later** (where adblock-rust is bundled)
- Windows, macOS, or Linux

## Installation

### Option A — Temporary add-on (recommended for testing)

Temporary add-ons are the easiest way to try the extension. They are removed when Firefox restarts.

1. Download the latest `adblock-rust-manager.xpi` from [Releases](../../releases)
2. Open Firefox and navigate to `about:debugging`
3. Click **"This Firefox"** in the left sidebar
4. Click **"Load Temporary Add-on…"**
5. Select the downloaded `.xpi` file
6. The purple shield icon appears in your toolbar

### Option B — Permanent installation (unsigned)

For a permanent install that survives restarts, Firefox needs to allow unsigned extensions first.

1. Go to `about:config` in Firefox
2. Search for `xpinstall.signatures.required` and set it to **`false`**
3. Go to `about:addons`
4. Click the gear icon ⚙️ → **"Install Add-on From File…"**
5. Select the `.xpi` file

> ⚠️ Setting `xpinstall.signatures.required` to `false` allows any unsigned extension to be installed. Only install extensions you trust.

### Option C — Build from source

```bash
git clone https://github.com/your-username/adblock-rust-manager
cd adblock-rust-manager
zip -r adblock-rust-manager.xpi . -x "*.DS_Store" -x "*.git*" -x "README.md"
```

Then follow Option A or B above using the generated `.xpi`.

## Usage

Once the extension is installed, click the **purple shield icon** in the Firefox toolbar to open the popup.

### Step 0 — Disable ETP (optional but recommended)

Toggle **"Disable Enhanced Tracking Protection"** at the top of the popup. This turns off Firefox's built-in ETP globally so adblock-rust handles all blocking. The change is instant — no about:config needed.

> If you prefer ETP to remain active on most sites, leave this off and only disable it for specific sites via the shield icon in the address bar.

### Step 1 — Enable the adblock-rust engine

1. Click **"Copy pref name"** in the Step 1 section — the pref name is now in your clipboard
2. Open a new Firefox tab and type `about:config` in the address bar, then press Enter
3. Accept the warning if prompted
4. Paste the pref name into the search bar: `privacy.trackingprotection.content.protection.enabled`
5. Click the **toggle button** on the right to set it to `true`
6. Back in the extension popup, click **"Mark done ✓"**

### Step 2 — Set your filter lists

1. In the extension popup, add or remove filter lists using the list manager. The four default lists are pre-loaded:
   - **EasyList** — core ad blocking
   - **EasyPrivacy** — tracker blocking
   - **Fanboy Cookie Monster** — cookie banners
   - **uBO Annoyances** — other annoyances
2. Click **"Copy URL list value"** — the combined pipe-separated value is now in your clipboard
3. Go back to `about:config` and search for: `privacy.trackingprotection.content.protection.test_list_urls`
4. Click the **pencil ✏️ icon** to edit the preference
5. Paste the copied value and click the **checkmark ✓** to save
6. Back in the popup, click **"Mark done ✓"**

That's it. adblock-rust is now active with your chosen filter lists.

## Default filter lists

| List | Purpose | URL |
|---|---|---|
| EasyList | Blocks ads on most websites | [easylist.to](https://easylist.to/easylist/easylist.txt) |
| EasyPrivacy | Blocks trackers and analytics | [easylist.to](https://easylist.to/easylist/easyprivacy.txt) |
| Fanboy Cookie Monster | Removes cookie consent banners | [fanboy.co.nz](https://secure.fanboy.co.nz/fanboy-cookiemonster.txt) |
| uBO Annoyances – Other | Blocks other annoyances | [github.com/uBlockOrigin](https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/annoyances-others.txt) |

### Available preset lists

Additional lists available via the Quick-add chips in the popup:

- uBO Filters
- Peter Lowe's Ad & Tracking Server List
- AdGuard Base Filters
- AdGuard Tracking Protection

## Testing that it works

1. In the extension popup, make sure ETP is **disabled** for the site you're testing (or use the shield icon in the address bar to disable it per-site)
2. Visit a site with known ads such as [yahoo.com](https://yahoo.com)
3. Ad slots will still render in the page layout, but the actual ad content will be blocked — you'll see empty boxes or "Advertisement" placeholders instead of real ads

## Architecture

```
adblock-rust-manager/
├── manifest.json          # MV3 manifest — action, privacy, storage, tabs permissions
├── background.js          # Seeds default storage on first install
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # All UI logic + browser.privacy API calls
│   └── popup.css          # Styles (supports light & dark mode)
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon96.png
```

### Why no experiment_apis?

An earlier version of this extension used Firefox's `experiment_apis` mechanism to write `about:config` prefs directly. This was removed because `experiment_apis` only works on Firefox Nightly and Developer Edition — it cannot be used in Release Firefox without a Mozilla-signed privileged add-on, regardless of `about:config` flags.

The current approach uses only standard MV3 WebExtension APIs and requires no special Firefox configuration beyond the one-time `about:config` setup described above.

## Permissions

| Permission | Why it's needed |
|---|---|
| `privacy` | Controls ETP via `browser.privacy.websites.trackingProtectionMode` |
| `storage` | Persists filter lists and toggle states across sessions |
| `clipboardWrite` | Copies pref names and URL list values to your clipboard |

## License

MPL-2.0 — the same license as adblock-rust itself.
