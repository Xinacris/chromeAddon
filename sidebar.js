document.addEventListener("DOMContentLoaded", () => {
  const promptInput = document.getElementById("prompt-input");
  const sendButton = document.getElementById("send-button");
  const responseContainer = document.getElementById("response-container");

  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const body = document.body;
  const darkModeIcon = document.getElementById("dark-mode-icon");
  const lightModeIcon = document.getElementById("light-mode-icon");
  const h1 = document.querySelector("h1");

  responseContainer.style.resize = "vertical";
  responseContainer.style.minHeight = "100px";

  function applyDarkMode(isDark) {
    const darkModeStyles = {
      backgroundColor: "#202124",
      responseBackgroundColor: "#343538",
      promptBackgroundColor: "#343538",
      textColor: "white",
    };

    const lightModeStyles = {
      backgroundColor: "white",
      responseBackgroundColor: "#f9f9f9",
      promptBackgroundColor: "white",
      textColor: "black",
    };

    const styles = isDark ? darkModeStyles : lightModeStyles;

    darkModeIcon.classList.toggle("hidden", isDark);
    lightModeIcon.classList.toggle("hidden", !isDark);
    body.style.backgroundColor = styles.backgroundColor;
    responseContainer.style.backgroundColor = styles.responseBackgroundColor;
    promptInput.style.backgroundColor = styles.promptBackgroundColor;
    h1.style.color = styles.textColor;
    promptInput.style.color = styles.textColor;
    responseContainer.style.color = styles.textColor;
  }

  let isDarkMode = localStorage.getItem("darkMode") === "true";
  applyDarkMode(isDarkMode);

  darkModeToggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyDarkMode(isDarkMode);
  });

  promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendButton.click();
    }
  });

  function HtmlTransition(responseText) {
    responseText = responseText.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    responseText = responseText.replace(/\*(.*?)\*/g, "<i>$1</i>");
    responseText = responseText.replace(/\n/g, "<br>");
    responseText = responseText.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );
    responseText = responseText.replace(/__(.*?)__/g, "<u>$1</u>");
    responseText = responseText.replace(/(\*|\d+\.) (.*?)\n/g, "<li>$2</li>");
    responseText = responseText.replace(/(\n\s*\*|\n\s*\d+\.)/g, "<ul>");
    responseText = responseText.replace(/(\n\s\*\s*$)/g, "</ul>");
    responseText = responseText.replace(/(\n\s*\d+\.)/g, "<ol>");
    responseText = responseText.replace(/(\n\s*\d+\.\s*$)/g, "</ol>");

    return responseText;
  }

  sendButton.addEventListener("click", async () => {
    const prompt = promptInput.value;
    responseContainer.textContent = "Loading...";

    try {
      const apiKey = await new Promise((resolve) => {
        chrome.storage.local.get(["apiKey"], (result) => {
          resolve(result.apiKey);
        });
      });

      if (!apiKey) {
        responseContainer.textContent =
          "No API Key found, Please set it in the extension popup menu.";
        return;
      }
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generation_config: {
              max_output_tokens: 2000,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const responseText = data.candidates[0].content.parts[0].text;
        document.getElementById("response-container").innerHTML =
          HtmlTransition(responseText);
      } else if (data.error) {
        responseContainer.textContent = `Error from Gemini API: ${data.error.message}`;
      } else {
        responseContainer.textContent = "No response from Gemini";
      }
    } catch (error) {
      console.error("Error fetching Gemini API:", error);
      responseContainer.textContent = `Failed to fetch response from Gemini API: ${error.message}`;
    }
    promptInput.value = "";
  });
});
