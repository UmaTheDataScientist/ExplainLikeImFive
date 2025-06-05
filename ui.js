// Notify the background script that the content script is ready
chrome.runtime.sendMessage({ action: "contentScriptReady" });

// Cache to avoid redundant API calls
const explanationCache = {}; // { five: string, summarize: string }
let currentSelectedText = "";

// ✅ Add ping response for background.js safety check
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    sendResponse({ status: "alive" });
    return;
  }

  switch (message.action) {
    case "showLoading":
      showLoadingPopup();
      break;
    case "showExplanation":
      showExplanationPopup(message.explanation, message.selectedText);
      break;
    case "updateExplanation":
      updateExplanationUI(message.explanation, message.mode);
      break;
    case "showError":
      showErrorPopup(message.errorMessage);
      break;
  }
});

/* ========== UI Functions ========== */

function removeExistingPopup() {
  const existing = document.getElementById("elif-popup");
  if (existing) existing.remove();
}

function showLoadingPopup() {
  removeExistingPopup();
  const popup = document.createElement("div");
  popup.id = "elif-popup";
  popup.innerHTML = `
    <div id="elif-popup-content">
      <div id="elif-loading">
        <img src="${chrome.runtime.getURL("icon.png")}" alt="Loading" id="elif-loading-icon">
        <p>Loading explanation...</p>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

function showExplanationPopup(explanation, selectedText) {
  currentSelectedText = selectedText;
  removeExistingPopup();
  const popup = document.createElement("div");
  popup.id = "elif-popup";
  popup.innerHTML = `
    <div>
      <div class="header">
        <div class="header-logo">
          <img src="${chrome.runtime.getURL("brandLogo.png")}" alt="Logo">
        </div>
        <div class="brand"><h1>ELIF</h1></div>
        <div id="elif-close"><img src="${chrome.runtime.getURL("cancel.png")}" alt="Close"></div>
      </div>
      <div id="elif-popup-content">
        <h4 id="elif-title">Explained Like I'm Five</h4>
        <p id="elif-explanation">${explanation}</p>
        <div id="elif-copy">
          <img src="${chrome.runtime.getURL("copy.png")}" width="20" height="20">
        </div>
        <select class="dropdown-container" id="explanation-dropdown">
          <option value="five" selected>Explain like I'm five</option>
          <option value="summarize">Summarize content</option>
        </select>
        <div class="context-container">
          <label class="context-label">Enter context (optional):</label>
          <div class="input-container">
            <input class="context-field" type="text" placeholder="Example: Publishing, Healthcare">
            <span class="clear-icon">&times;</span>
          </div>
        </div>
        <div class="regenerate-container">
          <button class="regenerate-btn">
            <img src="${chrome.runtime.getURL("brandLogo.png")}" width="20" height="20">
            <span class="btn-text">Regenerate</span>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  explanationCache["five"] = explanation;
  bindUIEvents();
}

function updateExplanationUI(newExplanation, mode) {
  const explanationText = document.getElementById("elif-explanation");
  const title = document.getElementById("elif-title");

  if (!explanationText || !title) {
    console.warn("❌ updateExplanationUI skipped: UI not ready");
    return;
  }

  explanationText.textContent = newExplanation;
  explanationCache[mode] = newExplanation;
  title.textContent = mode === "summarize" ? "Content Summary" : "Explained Like I'm Five";
}

function showErrorPopup(errorMessage) {
  removeExistingPopup();
  const popup = document.createElement("div");
  popup.id = "elif-popup";
  popup.innerHTML = `
    <div id="elif-popup-content">
      <h2>❌ Error</h2>
      <p>${errorMessage}</p>
      <button id="elif-close">Close</button>
    </div>
  `;
  document.body.appendChild(popup);
  document.getElementById("elif-close").addEventListener("click", () => popup.remove());
}

function bindUIEvents() {
  document.getElementById("elif-close").addEventListener("click", removeExistingPopup);

  document.getElementById("elif-copy").addEventListener("click", () => {
    const text = document.getElementById("elif-explanation").textContent;
    navigator.clipboard.writeText(text).then(() => {
      const button = document.getElementById("elif-copy");
      button.innerHTML = `<span style="margin-right:5px;">Copied!</span><img src="${chrome.runtime.getURL("copied.png")}" width="20">`;
      setTimeout(() => {
        button.innerHTML = `<img src="${chrome.runtime.getURL("copy.png")}" width="20">`;
      }, 2000);
    });
  });

  document.getElementById("explanation-dropdown").addEventListener("change", (e) => {
    const mode = e.target.value;
    const context = document.querySelector(".context-field").value.trim();
    document.getElementById("elif-explanation").textContent = "Updating...";
    chrome.runtime.sendMessage({
      action: "regenerate",
      selectedText: currentSelectedText,
      mode,
      extraContext: context
    });
  });

  document.querySelector(".regenerate-btn").addEventListener("click", () => {
    const mode = document.getElementById("explanation-dropdown").value;
    const context = document.querySelector(".context-field").value.trim();
    document.getElementById("elif-explanation").textContent = "Updating...";
    chrome.runtime.sendMessage({
      action: "regenerate",
      selectedText: currentSelectedText,
      mode,
      extraContext: context
    });
  });

  const contextInput = document.querySelector(".context-field");
  const clearIcon = document.querySelector(".clear-icon");

  contextInput.addEventListener("input", () => {
    clearIcon.style.display = contextInput.value ? "block" : "none";
  });

  clearIcon.addEventListener("click", () => {
    contextInput.value = "";
    clearIcon.style.display = "none";
  });
}
