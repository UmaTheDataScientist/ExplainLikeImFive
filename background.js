// ✅ Live AWS Lambda Function URL
const apiUrl = "https://lgsi7oej3l5hzbaqqrir4zecma0zuboj.lambda-url.us-east-1.on.aws/";

// ✅ Create context menu item when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explainLike5",
    title: "Explain Like I'm Five",
    contexts: ["selection"]
  });
});

// ✅ Utility: Send message to content script only if it's ready
function sendMessageToContent(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("⚠️ Content script not ready in this tab.");
        reject(chrome.runtime.lastError);
      } else {
        chrome.tabs.sendMessage(tabId, message);
        resolve();
      }
    });
  });
}

// ✅ Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "explainLike5" && info.selectionText) {
    const selectedText = info.selectionText.trim();

    try {
      await sendMessageToContent(tab.id, { action: "showLoading" });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText,
          mode: "five",
          extraContext: ""
        })
      });

      const data = await response.json();
      if (!data.explanation) throw new Error("No explanation received from Lambda");

      console.log("✅ Sending showExplanation to UI:", data.explanation);

      chrome.tabs.sendMessage(tab.id, {
        action: "showExplanation",
        explanation: data.explanation,
        selectedText
      });

    } catch (error) {
      console.error("❌ Error during context menu click:", error);
      chrome.tabs.sendMessage(tab.id, {
        action: "showError",
        errorMessage: "Something went wrong. Please try again."
      });
    }
  }
});

// ✅ Handle regenerate messages from dropdown or button
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "regenerate") {
    const { selectedText, mode, extraContext } = message;

    console.log("🔁 Regenerate requested:", { selectedText, mode, extraContext });

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedText, mode, extraContext })
      });

      const data = await response.json();
      if (!data.explanation) throw new Error("No explanation received");

      console.log("✅ Sending updateExplanation to UI:", data.explanation);

      chrome.tabs.sendMessage(sender.tab.id, {
        action: "updateExplanation",
        explanation: data.explanation,
        mode
      });

    } catch (error) {
      console.error("❌ Error during regenerate:", error);
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "showError",
        errorMessage: "Failed to regenerate. Please try again."
      });
    }
  }
});
