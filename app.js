const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyGuOBtCC4Ci0IszWzKQi0tLGomGT68nssiRxCMDPv55i-iPuZBSIFhg57WAPODAWgywg/exec";

const TASK_NOTE =
  "Select the one option you would most likely support in your professional setting.";

const form = document.querySelector("#survey-form");
const tasksContainer = document.querySelector("#tasks-container");
const statusNode = document.querySelector("#form-status");
const submitButton = document.querySelector(".submit-button");

function renderTasks() {
  window.SURVEY_TASKS.forEach((task) => {
    const article = document.createElement("article");
    article.className = "task-card";

    const header = document.createElement("div");
    header.className = "task-card__header";
    header.innerHTML = `
      <div>
        <div class="task-card__badge">Task ${task.task}</div>
        <p class="task-card__note">${TASK_NOTE}</p>
      </div>
      <h3 class="task-card__title">Choose one concept</h3>
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
            <div class="option-card__row">
              <span class="option-card__attr">${key}</span>
              <span class="option-card__value">${value}</span>
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
  const dateField = form.elements.namedItem("surveyDate");
  if (dateField && !dateField.value) {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60000)
      .toISOString()
      .split("T")[0];
    dateField.value = localDate;
  }
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
    throw new Error(`Please complete Task ${firstMissing} before submitting.`);
  }
}

function serializeForm() {
  const formData = new FormData(form);
  const profile = Object.fromEntries(formData.entries());
  const choices = getTaskChoices();

  return {
    submittedAt: new Date().toISOString(),
    profile,
    choices,
    metadata: {
      surveyVersion: "github-pages-static-v1",
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
    setTodayDefault();
    setStatus("Response submitted. Thank you for completing the survey.", "is-success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    setStatus(error.message || "Submission failed. Please try again.", "is-error");
  } finally {
    submitButton.disabled = false;
  }
});

renderTasks();
setTodayDefault();
setStatus(`${window.SURVEY_TASKS.length} tasks are loaded. Please complete every choice set.`);
