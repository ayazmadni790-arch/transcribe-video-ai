document.addEventListener("DOMContentLoaded", () => {
  const promptButton = document.getElementById("promptButton");
  const languageMenu = document.getElementById("languageMenu");
  const promptPopover = document.getElementById("promptPopover");
  const closePopover = document.getElementById("closePopover");
  const activeLanguageLabel = document.getElementById("activeLanguageLabel");
  const sourceText = document.getElementById("sourceText");
  const textCount = document.getElementById("textCount");
  const generateButton = document.getElementById("generateButton");
  const partsList = document.getElementById("partsList");

  const presets = {
    roman: {
      label: "Roman Urdu",
      prompt: `Create a handwritten-style study note in **Roman Urdu**, based on the provided transcript/text, regardless of the language it is given in.

- **Language Rule:** The explanation and general notes must be in **Roman Urdu**, but technical terms, main headings, country names, and scientific terms must remain in **English**.
- **Style:** Use a messy yet easily legible handwriting style so I can quickly review it during exams.
- **Highlighting:** Draw red circles around important dates, deadlines, or key chronological figures.
- **Visuals:** Add small, simple doodles next to concepts to explain them better visually.
- **Format:** Design everything to fit on a standard **A4 printable size paper** layout.`
    },
    urdu: {
      label: "Urdu",
      prompt: `Create a handwritten-style study note in **Urdu**, based on the provided transcript/text, regardless of the language it is given in.

- **Language Rule:** The explanation and general notes must be in **Urdu**, but technical terms, main headings, country names, and scientific terms must remain in **English**.
- **Style:** Use a messy yet easily legible handwriting style so I can quickly review it during exams.
- **Highlighting:** Draw red circles around important dates, deadlines, or key chronological figures.
- **Visuals:** Add small, simple doodles next to concepts to explain them better visually.
- **Format:** Design everything to fit on a standard **A4 printable size paper** layout.`
    },
    english: {
      label: "English",
      prompt: `Create a handwritten-style study note in **English**, based on the provided transcript/text, regardless of the language it is given in.

- **Language Rule:** The explanation and general notes must be in **English**, but technical terms, main headings, country names, and scientific terms must remain in **English**.
- **Style:** Use a messy yet easily legible handwriting style so I can quickly review it during exams.
- **Highlighting:** Draw red circles around important dates, deadlines, or key chronological figures.
- **Visuals:** Add small, simple doodles next to concepts to explain them better visually.
- **Format:** Design everything to fit on a standard **A4 printable size paper** layout.`
    },
    hindi: {
      label: "Hindi",
      prompt: `Create a handwritten-style study note in **Hindi**, based on the provided transcript/text, regardless of the language it is given in.

- **Language Rule:** The explanation and general notes must be in **Hindi**, but technical terms, main headings, country names, and scientific terms must remain in **English**.
- **Style:** Use a messy yet easily legible handwriting style so I can quickly review it during exams.
- **Highlighting:** Draw red circles around important dates, deadlines, or key chronological figures.
- **Visuals:** Add small, simple doodles next to concepts to explain them better visually.
- **Format:** Design everything to fit on a standard **A4 printable size paper** layout.`
    }
  };

  let activePreset = null;

  function setMenu(open) {
    languageMenu.classList.toggle("show", open);
    promptButton.classList.toggle("open", open);
    promptButton.setAttribute("aria-expanded", String(open));
  }

  promptButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenu(!languageMenu.classList.contains("show"));
  });

  languageMenu.querySelectorAll("button[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      activePreset = presets[button.dataset.lang];
      activeLanguageLabel.textContent = activePreset.label;
      sourceText.value = "";
      partsList.innerHTML = "";
      updateInput();
      setMenu(false);
      promptPopover.hidden = false;

      setTimeout(() => sourceText.focus(), 80);
    });
  });

  closePopover.addEventListener("click", () => {
    promptPopover.hidden = true;
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#promptAnchor")) {
      setMenu(false);
    }
  });

  sourceText.addEventListener("input", updateInput);

  function updateInput() {
    const length = sourceText.value.trim().length;
    textCount.textContent = `${length.toLocaleString()} character${length === 1 ? "" : "s"}`;
    generateButton.disabled = !activePreset || length === 0;
  }

  generateButton.addEventListener("click", () => {
    if (!activePreset) return;

    const text = sourceText.value.trim();
    if (!text) return;

    const parts = smartSplit(text);
    renderParts(parts);
  });

  function smartSplit(text) {
    const TARGET = 4300;
    const SOFT_MAX = 5000;
    const HARD_MAX = 5600;

    const paragraphs = text
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    const units = [];

    paragraphs.forEach((paragraph) => {
      if (paragraph.length <= SOFT_MAX) {
        units.push(paragraph);
        return;
      }

      const sentences =
        paragraph.match(/[^.!?؟۔]+[.!?؟۔]+(?:\s+|$)|[^.!?؟۔]+$/g) || [paragraph];

      sentences.forEach((sentence) => {
        const clean = sentence.trim();
        if (clean.length <= SOFT_MAX) {
          units.push(clean);
          return;
        }

        const words = clean.split(/\s+/);
        let chunk = "";

        words.forEach((word) => {
          const candidate = chunk ? `${chunk} ${word}` : word;
          if (candidate.length <= SOFT_MAX) {
            chunk = candidate;
          } else {
            if (chunk) units.push(chunk);
            chunk = word;
          }
        });

        if (chunk) units.push(chunk);
      });
    });

    const parts = [];
    let current = "";

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      const separator = current ? "\n\n" : "";
      const candidate = current + separator + unit;

      if (candidate.length <= SOFT_MAX) {
        current = candidate;
        continue;
      }

      if (
        current &&
        current.length >= TARGET &&
        unit.length <= 420 &&
        candidate.length <= HARD_MAX
      ) {
        current = candidate;
        continue;
      }

      if (current) parts.push(current.trim());
      current = unit;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  function composePrompt(partText, index, total) {
    const partNotice = total > 1
      ? `\n\nIMPORTANT CONTINUITY NOTE:\n- This is Part ${index} of ${total} from a longer source.\n- Keep this part coherent and complete.\n- Do not omit important facts.\n- If this part continues an idea from nearby text, preserve the context naturally.`
      : "";

    return `${activePreset.prompt}${partNotice}

SOURCE TEXT — PART ${index}:
------------------------------
${partText}
------------------------------`;
  }

  function renderParts(parts) {
    partsList.innerHTML = "";

    const note = document.createElement("div");
    note.className = "parts-note";
    note.textContent = parts.length > 1
      ? `${parts.length} parts created. Parts were kept on paragraph/sentence boundaries where possible.`
      : "One complete prompt created.";
    partsList.appendChild(note);

    parts.forEach((part, index) => {
      const fullPrompt = composePrompt(part, index + 1, parts.length);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-part";
      button.innerHTML = `
        <span>📋 PART ${index + 1} — CLICK TO COPY YOUR PROMPT</span>
        <span>Copy</span>
      `;

      button.addEventListener("click", async () => {
        const copied = await copyToClipboard(fullPrompt);

        if (!copied) return;

        button.classList.add("copied");
        button.innerHTML = `
          <span>✅ PART ${index + 1} — COPIED</span>
          <span>Done</span>
        `;

        setTimeout(() => {
          button.classList.remove("copied");
          button.innerHTML = `
            <span>📋 PART ${index + 1} — CLICK TO COPY YOUR PROMPT</span>
            <span>Copy</span>
          `;
        }, 1800);
      });

      partsList.appendChild(button);
    });
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.focus();
      temp.select();

      const result = document.execCommand("copy");
      temp.remove();
      return result;
    } catch {
      return false;
    }
  }
});