document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Give the embedded tool a little visual feedback if it takes time to load.
  const frame = document.querySelector(".iframe-wrap iframe");
  if (frame) {
    frame.addEventListener("load", () => {
      const wrap = document.querySelector(".iframe-wrap");
      if (wrap) wrap.classList.add("loaded");
    });
  }
});
