const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJw2eK05zWIdtc5qymbgdKr9uhcRVkw27I2yIzULjKDzth5gjxB0a_PF_ynLkFSWMX/exec";

const TASK_NOTE =
  "Please review the three textbook options and choose the one you prefer.";

const form = document.querySelector("#survey-form");
const tasksContainer = document.querySelector("#tasks-container");
const featureCheckboxes = document.querySelector("#feature-checkboxes");
const statusNode = document.querySelector("#form-status");
const submitButton = document.querySelector(".submit-button");

const LEVEL_SYMBOLS = {
  "Text lessons": "T",
  "Text + pictures": "🖼️",
  "Captioned videos": "🎬",
  "Interactive visuals": "✨",
  "No vocabulary help": "–",
  "Picture support": "🖼️",
  "Pictures + sign support": "🤟",
  "Pictures + sign + explanation": "💬",
  "Standard text": "A",
  "Simplified text": "S",
  "Short sections": "§",
  "Personalized reading": "↔",
  "Quiz only": "?",
  "Instant feedback": "✓",
  "Learning hints": "💡",
  "AI tutor": "AI",
  "No sign support": "–",
  "Sign for keywords": "KW",
  "Sign for words & sentences": "W+S",
  "Full lesson signing": "FULL",
  "Basic navigation": "→",
  "Icon-based navigation": "◈",
  "Progress tracking": "%",
  "Progress + review": "↺",
  Free: "0",
  "Low cost": "$",
  "Moderate cost": "$$",
  "High cost": "$$$",
};

function getLevelSymbol(level) {
  return LEVEL_SYMBOLS[level] || "•";
}

function getAttributeTheme(feature) {
  return `attribute-${feature.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function getFeatureHeadings() {
  const firstTask = window.SURVEY_TASKS[0];
  if (!firstTask || !firstTask.alternatives[0]) {
    return [];
  }

  return Object.keys(firstTask.alternatives[0]).filter((key) => key !== "alternative");
}

function renderFeatureCheckboxes() {
  getFeatureHeadings().forEach((feature) => {
    const label = document.createElement("label");
    label.className = "feature-option";
    label.innerHTML = `
      <input type="checkbox" name="topFeatures" value="${feature}" />
      <span>${feature}</span>
    `;
    featureCheckboxes.appendChild(label);
  });
}

function renderTasks() {
  window.SURVEY_TASKS.forEach((task) => {
    const article = document.createElement("article");
    article.className = "task-card";

    const header = document.createElement("div");
    header.className = "task-card__header";
    header.innerHTML = `
      <div>
        <div class="task-card__badge">Choice set ${task.task}</div>
        <p class="task-card__note">${TASK_NOTE}</p>
      </div>
      <h3 class="task-card__title">Which textbook option do you prefer?</h3>
    `;

    const optionsGrid = document.createElement("div");
    optionsGrid.className = "options-grid";

    task.alternatives.forEach((option) => {
      const wrapper = document.createElement("label");
      wrapper.className = "option-card";

      const optionRows = Object.entries(option)
        .filter(([key]) => key !== "alternative")
        .map(
          ([key, value]) => `
            <div class="option-card__row ${getAttributeTheme(key)}">
              <span class="option-card__attr">${key}</span>
              <span class="option-card__value">
                <span class="option-card__level-symbol" aria-hidden="true">${getLevelSymbol(value)}</span>
                <span>${value}</span>
              </span>
            </div>
          `
        )
        .join("");

      wrapper.innerHTML = `
        <input type="radio" name="task_${task.task}" value="${option.alternative}" required />
        <span class="option-card__surface">
          <span class="option-card__top">
            <span class="option-card__label">Option ${option.alternative}</span>
            <span class="option-card__check" aria-hidden="true"></span>
          </span>
          <span class="option-card__list">${optionRows}</span>
        </span>
      `;

      optionsGrid.appendChild(wrapper);
    });

    article.appendChild(header);
    article.appendChild(optionsGrid);

    tasksContainer.appendChild(article);
  });
}

function setTodayDefault() {
  return new Date().toISOString().split("T")[0];
}

function generateParticipantId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `P-${stamp}-${random}`;
}

function getTaskChoices() {
  return window.SURVEY_TASKS.map((task) => {
    const selected = form.querySelector(`input[name="task_${task.task}"]:checked`);
    return {
      task: task.task,
      selectedAlternative: selected ? Number(selected.value) : null,
    };
  });
}

function validateTaskCompletion() {
  const incomplete = getTaskChoices().filter((item) => item.selectedAlternative === null);
  if (incomplete.length > 0) {
    const firstMissing = incomplete[0].task;
    throw new Error(`Please complete Choice set ${firstMissing} before submitting.`);
  }

  if (!form.querySelector('input[name="topFeatures"]:checked')) {
    throw new Error("Please select at least one feature in Overall Feedback.");
  }
}

function serializeForm() {
  const formData = new FormData(form);
  const profile = Object.fromEntries(formData.entries());
  const choices = getTaskChoices();
  const topFeatures = Array.from(
    form.querySelectorAll('input[name="topFeatures"]:checked')
  ).map((node) => node.value);
  const submittedAt = new Date().toISOString();

  return {
    submittedAt,
    profile: {
      participantId: generateParticipantId(),
      surveyDate: setTodayDefault(),
      name: profile.name || "",
      email: profile.email || "",
      profession: profile.profession || "",
      experienceYears: profile.experienceYears || "",
      workSetting: profile.workSetting || "",
      usesAiTools: profile.usesAiTools || "",
      involvedInSelection: profile.involvedInSelection || "",
      topFeatures,
    },
    choices,
    metadata: {
      surveyVersion: "github-pages-static-v2",
      totalTasks: window.SURVEY_TASKS.length,
      userAgent: navigator.userAgent,
    },
  };
}

async function submitToAppsScript(payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    throw new Error("Add your Google Apps Script web app URL in app.js before deployment.");
  }

  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
}

function setStatus(message, type = "") {
  statusNode.textContent = message;
  statusNode.classList.remove("is-error", "is-success");
  if (type) {
    statusNode.classList.add(type);
  }
}

form.addEventListener("change", () => {
  const remaining = getTaskChoices().filter((item) => item.selectedAlternative === null).length;
  if (remaining === 0) {
    setStatus("All tasks completed. You can submit now.");
  } else {
    setStatus(`${remaining} task${remaining === 1 ? "" : "s"} still need a selection.`);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    validateTaskCompletion();
    submitButton.disabled = true;
    setStatus("Submitting your response...", "");

    const payload = serializeForm();
    await submitToAppsScript(payload);

    form.reset();
    setStatus("Response submitted. Thank you for completing the survey.", "is-success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    setStatus(error.message || "Submission failed. Please try again.", "is-error");
  } finally {
    submitButton.disabled = false;
  }
});

renderFeatureCheckboxes();
renderTasks();
setStatus(`${window.SURVEY_TASKS.length} tasks are loaded. Please complete every choice set.`);
