"use strict";
// Background script — seeds default storage on first install only.
// ETP is now controlled directly from the popup via browser.privacy API.

const DEFAULT_LISTS = [
  "https://easylist.to/easylist/easylist.txt",
  "https://easylist.to/easylist/easyprivacy.txt",
  "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
  "https://raw.githubusercontent.com/uBlockOrigin/uAssets/refs/heads/master/filters/annoyances-others.txt"
];

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    await browser.storage.local.set({
      etpDisabled:   false,
      lists:         DEFAULT_LISTS,
      engineApplied: false,
      listsApplied:  false
    });
  }
});
