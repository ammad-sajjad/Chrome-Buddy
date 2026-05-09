document.querySelectorAll("button[data-action]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const type = btn.dataset.action;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type });
      } catch (e) {
        // content script may not be on this page (chrome:// etc)
      }
    }
  });
});
