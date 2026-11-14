/* Interactive ATS checklist. State stays in localStorage; nothing is uploaded. */
(() => {
  const boxes = Array.from(document.querySelectorAll("[data-check]"));
  if (!boxes.length) return;

  const storageKey = "resume-radar-ats-checklist-v1";
  const countEl = document.querySelector("[data-checklist-count]");
  const bar = document.getElementById("checklist-progress");
  const resetBtn = document.querySelector("[data-checklist-reset]");
  const printBtn = document.querySelector("[data-checklist-print]");

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
  } catch (_) {
    saved = {};
  }

  const update = () => {
    const done = boxes.filter((box) => box.checked).length;
    if (countEl) countEl.textContent = String(done);
    if (bar) bar.value = done;
  };

  boxes.forEach((box) => {
    box.checked = Boolean(saved[box.dataset.check]);
    box.addEventListener("change", () => {
      saved[box.dataset.check] = box.checked;
      try {
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch (_) {
        /* storage may be disabled; the checklist still works in-session */
      }
      update();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      boxes.forEach((box) => {
        box.checked = false;
      });
      saved = {};
      try {
        localStorage.removeItem(storageKey);
      } catch (_) {
        /* ignore */
      }
      update();
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  update();
})();
