const selectedModelNameEl = document.querySelector("[data-selected-model-name]");
const changeModelLinkEl = document.querySelector("[data-change-model-link]");
const billingTabs = Array.from(document.querySelectorAll("[data-billing-tab]"));
const planLinks = Array.from(document.querySelectorAll("[data-plan-link]"));
const priceValues = Array.from(document.querySelectorAll("[data-price-yearly]"));
const cycleLabels = Array.from(document.querySelectorAll("[data-cycle-label]"));
const planSubnotes = Array.from(document.querySelectorAll("[data-plan-subnote]"));
const planSavings = Array.from(document.querySelectorAll("[data-plan-saving]"));

const params = new URLSearchParams(window.location.search);

const selectedModel = (params.get("model") || "").trim();
const selectedType = (params.get("type") || "").trim();
let selectedCycle = (params.get("cycle") || "yearly").trim().toLowerCase();

const validCycles = ["monthly", "yearly"];
if (!validCycles.includes(selectedCycle)) {
  selectedCycle = "yearly";
}

function updateSelectedModel() {
  if (selectedModelNameEl) {
    selectedModelNameEl.textContent = selectedModel || "---";
  }

  if (changeModelLinkEl) {
    changeModelLinkEl.href = selectedType
      ? `models.html?type=${encodeURIComponent(selectedType)}`
      : "models.html";
  }
}

function updatePlanLinks() {
  planLinks.forEach((linkEl) => {
    const planKey = linkEl.dataset.planLink;

    if (!selectedModel) {
      linkEl.href = "models.html";
      return;
    }

    const requestParams = new URLSearchParams();
    requestParams.set("model", selectedModel);
    requestParams.set("plan", planKey);
    requestParams.set("cycle", selectedCycle);

    if (selectedType) {
      requestParams.set("type", selectedType);
    }

    linkEl.href = `request.html?${requestParams.toString()}`;
  });
}

function updatePrices() {
  const isMonthly = selectedCycle === "monthly";

  billingTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.billingTab === selectedCycle);
  });

  priceValues.forEach((priceEl) => {
    priceEl.textContent = isMonthly
      ? priceEl.dataset.priceMonthly
      : priceEl.dataset.priceYearly;
  });

  cycleLabels.forEach((labelEl) => {
    labelEl.textContent = isMonthly ? "ريال شهريًا" : "ريال سنويًا";
  });

  planSubnotes.forEach((noteEl) => {
    if (!noteEl.dataset.yearlyText) {
      noteEl.dataset.yearlyText = noteEl.textContent;
    }

    noteEl.textContent = isMonthly ? "رسوم تخصيص أولية" : noteEl.dataset.yearlyText;
  });

  planSavings.forEach((savingEl) => {
    if (!savingEl.dataset.originalText) {
      savingEl.dataset.originalText = savingEl.textContent;
    }

    savingEl.textContent = isMonthly ? "" : savingEl.dataset.originalText;
  });

  updatePlanLinks();
}

billingTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    selectedCycle = tab.dataset.billingTab;
    updatePrices();
  });
});

planLinks.forEach((linkEl) => {
  linkEl.addEventListener("click", (event) => {
    if (!selectedModel) {
      event.preventDefault();
      alert("اختر نموذجًا أولًا");
      window.location.href = selectedType
        ? `models.html?type=${encodeURIComponent(selectedType)}`
        : "models.html";
    }
  });
});

updateSelectedModel();
updatePrices();