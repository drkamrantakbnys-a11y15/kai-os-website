// Shared share/copy helper (Website Next Phase, Step 4). Reused by
// /fun-facts and /ai-jokes -- no new dependency, uses the native Web
// Share API where the browser supports it, falling back to clipboard
// copy everywhere else. No third-party script, no tracking.
function initShareButtons() {
  document.querySelectorAll("[data-share-text]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-share-text") || "";
      const originalLabel = button.textContent;

      const flash = (label) => {
        button.textContent = label;
        setTimeout(() => {
          button.textContent = originalLabel;
        }, 1600);
      };

      if (navigator.share) {
        try {
          await navigator.share({ text, title: "Project KAI" });
          return;
        } catch (err) {
          // User cancelled the share sheet, or share failed -- fall
          // through to clipboard copy rather than leaving the button inert.
        }
      }

      try {
        await navigator.clipboard.writeText(text);
        flash("Copied!");
      } catch (err) {
        flash("Copy failed");
      }
    });
  });
}

initShareButtons();
