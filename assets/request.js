import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================
   Firebase
========================= */
const app = initializeApp({
  apiKey: "AIzaSyAxshsDZ4yWv6TuinFTx1qMComAJYhqUZI",
  authDomain: "site-orders-415e4.firebaseapp.com",
  projectId: "site-orders-415e4"
});

const db = getFirestore(app);
const auth = getAuth(app);

auth.languageCode = "ar";

const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Persistence error:", error);
});

/* =========================
   Domain checker
========================= */
const DOMAIN_CHECK_ENDPOINT = "https://api.rasmi.app/domain-check";

/* =========================
   Header account button
========================= */
const accountBtn = document.getElementById("accountBtn");

let currentUserPhoneE164 = "";

if (accountBtn) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      accountBtn.textContent = "حسابي";
      accountBtn.href = "account.html";

      if (user.phoneNumber) {
        currentUserPhoneE164 = user.phoneNumber;
        syncPhoneVerificationFromCurrentUser();
      }
    } else {
      accountBtn.textContent = "دخول";
      accountBtn.href = "login.html";
      currentUserPhoneE164 = "";
    }
  });
}

/* =========================
   Form elements
========================= */
const activityTypeEl = document.getElementById("activityType");
const customTypeEl = document.getElementById("customType");
const packageEl = document.getElementById("package");
const templateEl = document.getElementById("template");
const cycleEl = document.getElementById("cycle");
const submitBtn = document.getElementById("submitBtn");
const planNoteEl = document.getElementById("planNote");

const nextStepBtn = document.getElementById("nextStepBtn");
const domainPrevBtn = document.getElementById("domainPrevBtn");
const domainNextBtn = document.getElementById("domainNextBtn");
const prevStepBtn = document.getElementById("prevStepBtn");
const verifyPrevBtn = document.getElementById("verifyPrevBtn");

const requestProgressFill = document.getElementById("requestProgressFill");
const stageEls = document.querySelectorAll(".request-stage");

const domainInput = document.getElementById("domainInput");
const domainHelpText = document.getElementById("domainHelpText");
const domainNote = document.getElementById("domainNote");
const domainChoiceBtns = document.querySelectorAll(".domain-choice-btn");
const domainCheckBtn = document.getElementById("domainCheckBtn");
const domainCheckResult = document.getElementById("domainCheckResult");

const phoneInput = document.getElementById("phone");
const phoneCodeInput = document.getElementById("phoneCode");
const sendPhoneCodeBtn = document.getElementById("sendPhoneCodeBtn");
const verifyPhoneCodeBtn = document.getElementById("verifyPhoneCodeBtn");
const phoneVerifyResult = document.getElementById("phoneVerifyResult");
const phoneVerifyTarget = document.getElementById("phoneVerifyTarget");

const requestFinalLoading = document.getElementById("requestFinalLoading");
const requestFinalLoadingText = document.getElementById("requestFinalLoadingText");

/*
  new_domain = العميل يريد اختيار دومين جديد
  client_has_domain = العميل عنده دومين حالي
  later = نخليها بعدين
*/
let selectedDomainOption = "new_domain";

let domainAvailabilityState = {
  checked: false,
  domain: "",
  available: null
};

let recaptchaVerifier = null;
let confirmationResult = null;
let phoneCodeCooldownTimer = null;

let isSendingPhoneCode = false;
let isVerifyingPhoneCode = false;
let isSubmittingRequest = false;

let phoneVerificationState = {
  codeSent: false,
  verified: false,
  phone: "",
  phoneE164: "",
  uid: ""
};

/* =========================
   Helpers
========================= */
function normalizePlanParam(value) {
  const map = {
    plus: "باقة بلس",
    basic: "باقة بلس",
    pro: "باقة برو",
    premium: "باقة برو",
    "باقة بلس": "باقة بلس",
    "باقة برو": "باقة برو"
  };

  return map[value] || value || "";
}

function normalizeCycleParam(value) {
  const map = {
    monthly: "شهري",
    month: "شهري",
    yearly: "سنوي",
    annual: "سنوي",
    year: "سنوي",
    "شهري": "شهري",
    "سنوي": "سنوي"
  };

  return map[value] || value || "";
}

function updatePlanNote() {
  const selectedPlan = packageEl.value;
  const selectedCycle = cycleEl.value;

  if (!selectedPlan) {
    planNoteEl.textContent = "اختر الباقة ونوع الاشتراك ليظهر الملخص هنا.";
    return;
  }

  if (!selectedCycle) {
    planNoteEl.textContent = "اختر نوع الاشتراك ليظهر الملخص هنا.";
    return;
  }

  if (selectedPlan === "باقة بلس" && selectedCycle === "شهري") {
    planNoteEl.textContent = "79 ريال شهريًا + رسوم تخصيص أولية.";
    return;
  }

  if (selectedPlan === "باقة بلس" && selectedCycle === "سنوي") {
    planNoteEl.textContent = "750 ريال سنويًا — التخصيص مجاني.";
    return;
  }

  if (selectedPlan === "باقة برو" && selectedCycle === "شهري") {
    planNoteEl.textContent = "159 ريال شهريًا + رسوم تخصيص أولية.";
    return;
  }

  if (selectedPlan === "باقة برو" && selectedCycle === "سنوي") {
    planNoteEl.textContent = "1299 ريال سنويًا — التخصيص مجاني.";
  }
}

function showStage(stageNumber) {
  stageEls.forEach((stage) => {
    const isTarget = Number(stage.dataset.stage) === stageNumber;
    stage.hidden = !isTarget;
    stage.classList.toggle("is-active", isTarget);
  });

  if (requestProgressFill) {
    const widths = {
      1: "25%",
      2: "50%",
      3: "75%",
      4: "100%"
    };

    requestProgressFill.style.width = widths[stageNumber] || "25%";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStepOne() {
  if (!packageEl.value) throw "اختر الباقة";
  if (!cycleEl.value) throw "اختر نوع الاشتراك";
  if (!templateEl.value) throw "اختر النموذج";
}

function normalizeDomainInput(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

function normalizePhoneInput(value) {
  let digits = String(value || "")
    .trim()
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/\D/g, "");

  if (digits.startsWith("009665")) {
    digits = "0" + digits.slice(5);
  } else if (digits.startsWith("9665")) {
    digits = "0" + digits.slice(3);
  } else if (digits.startsWith("5") && digits.length === 9) {
    digits = "0" + digits;
  }

  return digits;
}

function toSaudiE164(phone) {
  const normalized = normalizePhoneInput(phone);

  if (!/^05\d{8}$/.test(normalized)) {
    return "";
  }

  return "+966" + normalized.slice(1);
}

function normalizeVerificationCode(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/\D/g, "")
    .slice(0, 6);
}

function isValidDomain(domain) {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain);
}

function clearDomainModeSelection() {
  domainChoiceBtns.forEach((btn) => {
    btn.classList.remove("is-selected");
  });
}

function resetDomainCheckState(clearMessage = true) {
  domainAvailabilityState = {
    checked: false,
    domain: "",
    available: null
  };

  if (clearMessage && domainCheckResult) {
    domainCheckResult.hidden = true;
    domainCheckResult.textContent = "";
    domainCheckResult.classList.remove("is-available", "is-unavailable", "is-error");
  }
}

function setDomainCheckResult(type, message) {
  if (!domainCheckResult) return;

  domainCheckResult.hidden = false;
  domainCheckResult.textContent = message;
  domainCheckResult.classList.remove("is-available", "is-unavailable", "is-error");

  if (type === "available") {
    domainCheckResult.classList.add("is-available");
  } else if (type === "unavailable") {
    domainCheckResult.classList.add("is-unavailable");
  } else {
    domainCheckResult.classList.add("is-error");
  }
}

function setDomainCheckLoading(isLoading) {
  if (!domainCheckBtn) return;

  domainCheckBtn.disabled = isLoading;
  domainCheckBtn.textContent = isLoading ? "جاري التحقق..." : "تحقق من التوفر";
}

function resetPhoneVerificationState(clearMessage = true) {
  phoneVerificationState = {
    codeSent: false,
    verified: false,
    phone: "",
    phoneE164: "",
    uid: ""
  };

  confirmationResult = null;

  if (clearMessage && phoneVerifyResult) {
    phoneVerifyResult.hidden = true;
    phoneVerifyResult.textContent = "";
    phoneVerifyResult.classList.remove("is-success", "is-error", "is-loading");
  }

  setFinalLoading(false);
}

function setPhoneVerifyResult(type, message) {
  if (!phoneVerifyResult) return;

  phoneVerifyResult.hidden = false;
  phoneVerifyResult.textContent = message;
  phoneVerifyResult.classList.remove("is-success", "is-error", "is-loading");

  if (type === "success") {
    phoneVerifyResult.classList.add("is-success");
  } else if (type === "loading") {
    phoneVerifyResult.classList.add("is-loading");
  } else {
    phoneVerifyResult.classList.add("is-error");
  }
}

function setFinalLoading(show, message = "جاري تسجيل طلبك...") {
  if (!requestFinalLoading) return;

  requestFinalLoading.hidden = !show;

  if (requestFinalLoadingText) {
    requestFinalLoadingText.textContent = message;
  }
}

function setPhoneButtonsLoading(isLoading) {
  if (sendPhoneCodeBtn) {
    sendPhoneCodeBtn.disabled = isLoading;
    sendPhoneCodeBtn.textContent = isLoading ? "جاري الإرسال..." : "إعادة إرسال الرمز";
  }

  if (verifyPhoneCodeBtn) {
    verifyPhoneCodeBtn.disabled = isLoading;
  }
}

function startPhoneCodeCooldown(seconds = 60) {
  if (!sendPhoneCodeBtn) return;

  clearInterval(phoneCodeCooldownTimer);

  let remaining = seconds;
  sendPhoneCodeBtn.disabled = true;
  sendPhoneCodeBtn.textContent = `إعادة الإرسال خلال ${remaining}`;

  phoneCodeCooldownTimer = setInterval(() => {
    remaining -= 1;

    if (remaining <= 0) {
      clearInterval(phoneCodeCooldownTimer);
      phoneCodeCooldownTimer = null;
      sendPhoneCodeBtn.disabled = false;
      sendPhoneCodeBtn.textContent = "إعادة إرسال الرمز";
      return;
    }

    sendPhoneCodeBtn.textContent = `إعادة الإرسال خلال ${remaining}`;
  }, 1000);
}

function getFirebasePhoneErrorMessage(error) {
  const code = error && error.code ? error.code : "";

  if (code === "auth/invalid-phone-number") {
    return "رقم الجوال غير صحيح. اكتب الرقم بصيغة 05xxxxxxxx";
  }

  if (code === "auth/too-many-requests") {
    return "تم إرسال محاولات كثيرة. حاول لاحقًا.";
  }

  if (code === "auth/invalid-verification-code") {
    return "رمز التحقق غير صحيح.";
  }

  if (code === "auth/code-expired") {
    return "انتهت صلاحية رمز التحقق. أرسل رمزًا جديدًا.";
  }

  if (code === "auth/captcha-check-failed") {
    return "فشل التحقق الأمني. حدّث الصفحة وحاول مرة أخرى.";
  }

  if (code === "auth/billing-not-enabled") {
    return "خدمة التحقق غير مفعلة حاليًا. حاول لاحقًا.";
  }

  return "تعذر إتمام التحقق حاليًا. حاول مرة أخرى.";
}

function initRecaptchaVerifier() {
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
    }
  });

  return recaptchaVerifier;
}

function syncPhoneVerificationFromCurrentUser() {
  if (!phoneInput || !auth.currentUser || !auth.currentUser.phoneNumber) return;

  const phone = normalizePhoneInput(phoneInput.value);
  const phoneE164 = toSaudiE164(phone);

  if (phoneE164 && phoneE164 === auth.currentUser.phoneNumber) {
    phoneVerificationState = {
      codeSent: true,
      verified: true,
      phone,
      phoneE164,
      uid: auth.currentUser.uid
    };

    setPhoneVerifyResult("success", "✓ تم التحقق من رقم الجوال");
  }
}

function updatePhoneVerifyTarget() {
  if (!phoneVerifyTarget || !phoneInput) return;

  const phone = normalizePhoneInput(phoneInput.value);
  phoneVerifyTarget.textContent = phone || "رقم جوالك";
}

/* =========================
   Domain mode
========================= */
function updateDomainMode(option) {
  selectedDomainOption = option;
  resetDomainCheckState(true);

  if (domainHelpText) {
    domainHelpText.textContent = "";
    domainHelpText.hidden = true;
  }

  if (domainNote) {
    domainNote.textContent = "";
    domainNote.hidden = true;
  }

  domainChoiceBtns.forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.domainOption === option);
  });

  if (option === "new_domain") {
    domainInput.disabled = false;
    domainInput.placeholder = "example.com";

    if (domainCheckBtn) {
      domainCheckBtn.hidden = false;
    }

    clearDomainModeSelection();
    return;
  }

  if (option === "client_has_domain") {
    domainInput.disabled = false;
    domainInput.placeholder = "example.com";

    if (domainCheckBtn) {
      domainCheckBtn.hidden = true;
    }

    return;
  }

  if (option === "later") {
    domainInput.value = "";
    domainInput.disabled = true;
    domainInput.placeholder = "سيتم اختياره لاحقًا";

    if (domainCheckBtn) {
      domainCheckBtn.hidden = true;
    }
  }
}

async function checkDomainAvailability() {
  selectedDomainOption = "new_domain";
  clearDomainModeSelection();

  const domain = normalizeDomainInput(domainInput.value);

  resetDomainCheckState(false);

  if (!domain) {
    setDomainCheckResult("error", "اكتب الدومين أولًا");
    return;
  }

  if (!isValidDomain(domain)) {
    setDomainCheckResult("error", "اكتب الدومين بصيغة صحيحة مثل example.com");
    return;
  }

  setDomainCheckLoading(true);
  setDomainCheckResult("error", "جاري فحص توفر الدومين...");

  try {
    const response = await fetch(DOMAIN_CHECK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domain })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || "تعذر فحص الدومين حاليًا");
    }

    domainAvailabilityState = {
      checked: true,
      domain: data.domain || domain,
      available: data.available === true
    };

    if (domainAvailabilityState.available) {
      setDomainCheckResult("available", `✓ ${domainAvailabilityState.domain} متوفر`);
    } else {
      setDomainCheckResult("unavailable", "× الدومين غير متاح جرب اسم ثاني");
    }

  } catch (error) {
    resetDomainCheckState(false);
    setDomainCheckResult(
      "error",
      error.message || "تعذر فحص الدومين حاليًا، حاول مرة أخرى"
    );
  } finally {
    setDomainCheckLoading(false);
  }
}

/* =========================
   Phone auth
========================= */
async function sendPhoneCode() {
  if (isSendingPhoneCode) return false;

  const phone = normalizePhoneInput(phoneInput.value);
  const phoneE164 = toSaudiE164(phone);

  resetPhoneVerificationState(false);

  if (!phoneE164) {
    setPhoneVerifyResult("error", "رقم الجوال غير صحيح. اكتب الرقم بصيغة 05xxxxxxxx");
    return false;
  }

  if (auth.currentUser && auth.currentUser.phoneNumber === phoneE164) {
    phoneVerificationState = {
      codeSent: true,
      verified: true,
      phone,
      phoneE164,
      uid: auth.currentUser.uid
    };

    setPhoneVerifyResult("success", "✓ تم التحقق من رقم الجوال");
    return true;
  }

  isSendingPhoneCode = true;
  setPhoneButtonsLoading(true);
  setPhoneVerifyResult("loading", "جاري إرسال رمز التحقق...");

  try {
    await authPersistenceReady;

    const appVerifier = initRecaptchaVerifier();

    confirmationResult = await signInWithPhoneNumber(auth, phoneE164, appVerifier);

    phoneVerificationState = {
      codeSent: true,
      verified: false,
      phone,
      phoneE164,
      uid: ""
    };

    setPhoneVerifyResult("success", "تم إرسال رمز التحقق. أدخل الرمز لإتمام الطلب.");
    startPhoneCodeCooldown(60);

    return true;

  } catch (error) {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }

    setPhoneVerifyResult("error", getFirebasePhoneErrorMessage(error));
    return false;

  } finally {
    isSendingPhoneCode = false;

    if (sendPhoneCodeBtn && !phoneCodeCooldownTimer) {
      sendPhoneCodeBtn.disabled = false;
      sendPhoneCodeBtn.textContent = "إعادة إرسال الرمز";
    }

    if (verifyPhoneCodeBtn) {
      verifyPhoneCodeBtn.disabled = false;
    }
  }
}

async function verifyPhoneCode() {
  const code = normalizeVerificationCode(phoneCodeInput.value);

  if (!confirmationResult) {
    setPhoneVerifyResult("error", "أرسل رمز التحقق أولًا.");
    return false;
  }

  if (!/^\d{6}$/.test(code)) {
    setPhoneVerifyResult("error", "اكتب رمز التحقق المكوّن من 6 أرقام.");
    return false;
  }

  if (verifyPhoneCodeBtn) {
    verifyPhoneCodeBtn.disabled = true;
    verifyPhoneCodeBtn.textContent = "جاري التحقق...";
  }

  setPhoneVerifyResult("loading", "جاري التحقق من الرمز...");

  try {
    await authPersistenceReady;

    const credential = await confirmationResult.confirm(code);
    const user = credential.user;

    phoneVerificationState = {
      codeSent: true,
      verified: true,
      phone: normalizePhoneInput(phoneInput.value),
      phoneE164: user.phoneNumber,
      uid: user.uid
    };

    setPhoneVerifyResult("success", "✓ تم التحقق من رقم الجوال");
    return true;

  } catch (error) {
    setPhoneVerifyResult("error", getFirebasePhoneErrorMessage(error));
    return false;

  } finally {
    if (verifyPhoneCodeBtn) {
      verifyPhoneCodeBtn.disabled = false;
      verifyPhoneCodeBtn.textContent = "تحقق";
    }
  }
}

async function verifyPhoneCodeAndSubmit() {
  if (isVerifyingPhoneCode || isSubmittingRequest) return;

  const code = normalizeVerificationCode(phoneCodeInput.value);

  if (!/^\d{6}$/.test(code)) {
    return;
  }

  isVerifyingPhoneCode = true;

  try {
    const verified = await verifyPhoneCode();

    if (verified) {
      setPhoneVerifyResult("success", "✓ تم التحقق من رقم الجوال");
      setFinalLoading(true, "جاري تسجيل طلبك...");
      await submitRequest();
    }
  } finally {
    isVerifyingPhoneCode = false;
  }
}

/* =========================
   Validation
========================= */
function validateDomainStep() {
  if (selectedDomainOption === "later") {
    return {
      domainOption: "later",
      domain: null,
      domainStatus: "domain_later",
      domainAvailabilityChecked: false,
      domainAvailable: null
    };
  }

  const domain = normalizeDomainInput(domainInput.value);

  if (!domain) {
    throw "اكتب الدومين";
  }

  if (!isValidDomain(domain)) {
    throw "اكتب الدومين بصيغة صحيحة مثل example.com";
  }

  if (selectedDomainOption === "client_has_domain") {
    return {
      domainOption: "client_has_domain",
      domain,
      domainStatus: "needs_review",
      domainAvailabilityChecked: false,
      domainAvailable: null
    };
  }

  if (!domainAvailabilityState.checked || domainAvailabilityState.domain !== domain) {
    throw "تحقق من توفر الدومين أولًا";
  }

  if (domainAvailabilityState.available !== true) {
    throw "الدومين غير متاح، جرّب اسمًا آخر";
  }

  return {
    domainOption: "new_domain",
    domain,
    domainStatus: "pending_purchase",
    domainAvailabilityChecked: true,
    domainAvailable: true
  };
}

function validateFinalData() {
  const domainInfo = validateDomainStep();

  const name = document.getElementById("name").value.trim();
  const activityName = document.getElementById("activityName").value.trim();
  let activityType = activityTypeEl.value;
  const customTypeVal = customTypeEl.value.trim();
  const selectedPackage = packageEl.value;
  const cycle = cycleEl.value;
  const template = templateEl.value;
  const phoneRaw = phoneInput.value.trim();
  const phone = normalizePhoneInput(phoneRaw);
  const phoneE164 = toSaudiE164(phone);

  if (activityType === "أخرى") {
    activityType = customTypeVal;
  }

  if (name.length < 3) throw "اكتب اسم التاجر";
  if (activityName.length < 2) throw "اكتب اسم النشاط";
  if (!activityType) throw "اختر نوع النشاط";
  if (!selectedPackage) throw "اختر الباقة";
  if (!cycle) throw "اختر نوع الاشتراك";
  if (!template) throw "اختر النموذج";

  if (!phoneE164) {
    throw "رقم الجوال غير صحيح. اكتب الرقم بصيغة 05xxxxxxxx";
  }

  return {
    domainInfo,
    name,
    activityName,
    activityType,
    selectedPackage,
    cycle,
    template,
    phone,
    phoneE164
  };
}

async function startPhoneVerificationStep() {
  if (isSendingPhoneCode || isSubmittingRequest) return;

  try {
    const data = validateFinalData();

    updatePhoneVerifyTarget();
    showStage(4);

    if (phoneCodeInput) {
      phoneCodeInput.value = "";
      setTimeout(() => phoneCodeInput.focus(), 250);
    }

    syncPhoneVerificationFromCurrentUser();

    if (
      phoneVerificationState.verified &&
      phoneVerificationState.phoneE164 === data.phoneE164 &&
      auth.currentUser &&
      auth.currentUser.uid
    ) {
      setPhoneVerifyResult("success", "✓ تم التحقق من رقم الجوال");
      setFinalLoading(true, "جاري تسجيل طلبك...");
      await submitRequest();
      return;
    }

    await sendPhoneCode();

  } catch (error) {
    alert(error.message || error);
  }
}

/* =========================
   UI events
========================= */
if (activityTypeEl && customTypeEl) {
  activityTypeEl.onchange = () => {
    customTypeEl.style.display = activityTypeEl.value === "أخرى" ? "block" : "none";
  };
}

if (packageEl) {
  packageEl.addEventListener("change", updatePlanNote);
}

if (cycleEl) {
  cycleEl.addEventListener("change", updatePlanNote);
}

if (nextStepBtn) {
  nextStepBtn.addEventListener("click", () => {
    try {
      validateStepOne();
      showStage(2);
    } catch (error) {
      alert(error.message || error);
    }
  });
}

if (domainPrevBtn) {
  domainPrevBtn.addEventListener("click", () => {
    showStage(1);
  });
}

if (domainNextBtn) {
  domainNextBtn.addEventListener("click", () => {
    try {
      validateDomainStep();
      showStage(3);
    } catch (error) {
      alert(error.message || error);
    }
  });
}

if (prevStepBtn) {
  prevStepBtn.addEventListener("click", () => {
    showStage(2);
  });
}

if (verifyPrevBtn) {
  verifyPrevBtn.addEventListener("click", () => {
    setFinalLoading(false);
    showStage(3);
  });
}

if (domainCheckBtn) {
  domainCheckBtn.addEventListener("click", checkDomainAvailability);
}

if (domainInput) {
  domainInput.addEventListener("input", () => {
    if (selectedDomainOption !== "new_domain") {
      selectedDomainOption = "new_domain";
      clearDomainModeSelection();

      if (domainInput) {
        domainInput.disabled = false;
      }

      if (domainCheckBtn) {
        domainCheckBtn.hidden = false;
      }
    }

    resetDomainCheckState(true);
  });
}

if (sendPhoneCodeBtn) {
  sendPhoneCodeBtn.addEventListener("click", sendPhoneCode);
}

if (verifyPhoneCodeBtn) {
  verifyPhoneCodeBtn.addEventListener("click", verifyPhoneCodeAndSubmit);
}

if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    const phone = normalizePhoneInput(phoneInput.value);
    const phoneE164 = toSaudiE164(phone);

    if (
      phoneVerificationState.verified &&
      phoneVerificationState.phoneE164 &&
      phoneVerificationState.phoneE164 !== phoneE164
    ) {
      resetPhoneVerificationState(true);
    }

    syncPhoneVerificationFromCurrentUser();
  });
}

if (phoneCodeInput) {
  phoneCodeInput.addEventListener("input", () => {
    const normalizedCode = normalizeVerificationCode(phoneCodeInput.value);

    if (normalizedCode.length === 6) {
      phoneCodeInput.value = normalizedCode;
      verifyPhoneCodeAndSubmit();
    }
  });

  phoneCodeInput.addEventListener("blur", () => {
    phoneCodeInput.value = normalizeVerificationCode(phoneCodeInput.value);
  });
}

domainChoiceBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const option = btn.dataset.domainOption;
    updateDomainMode(option);
  });
});

/* =========================
   Query params
========================= */
(function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const modelParam = (params.get("model") || params.get("template") || "").trim();
  const planParam = normalizePlanParam((params.get("plan") || "").trim().toLowerCase());
  const cycleParam = normalizeCycleParam((params.get("cycle") || "").trim().toLowerCase());

  if (modelParam && templateEl) {
    for (const option of templateEl.options) {
      if (option.value === modelParam) {
        templateEl.value = modelParam;
        break;
      }
    }
  }

  if (planParam && packageEl) {
    for (const option of packageEl.options) {
      if (option.value === planParam) {
        packageEl.value = planParam;
        break;
      }
    }
  }

  if (cycleParam && cycleEl) {
    for (const option of cycleEl.options) {
      if (option.value === cycleParam) {
        cycleEl.value = cycleParam;
        break;
      }
    }
  }

  updatePlanNote();
  updateDomainMode("new_domain");
  showStage(1);
})();

/* =========================
   Submit request
========================= */
async function submitRequest() {
  if (isSubmittingRequest) return;

  isSubmittingRequest = true;

  if (submitBtn) {
    submitBtn.innerText = "جاري الإرسال...";
    submitBtn.disabled = true;
  }

  try {
    const data = validateFinalData();

    syncPhoneVerificationFromCurrentUser();

    if (
      !phoneVerificationState.verified ||
      phoneVerificationState.phoneE164 !== data.phoneE164
    ) {
      throw "تحقق من رقم الجوال قبل إتمام الطلب";
    }

    const user = auth.currentUser;

    if (!user || !user.uid) {
      throw "لم يتم تسجيل الدخول برقم الجوال. أعد التحقق من الرقم.";
    }

    const orderRef = doc(db, "orders", user.uid);
    const orderSnap = await getDoc(orderRef);

    const orderData = {
      name: data.name,
      activityName: data.activityName,
      activityType: data.activityType,
      package: data.selectedPackage,
      billingCycle: data.cycle,
      template: data.template,
      phone: data.phone,
      phoneE164: data.phoneE164,
      phoneVerified: true,
      phoneVerifiedAt: serverTimestamp(),
      status: "تم تقديم الطلب",
      userId: user.uid,
      orderId: "ORD-" + Date.now(),

      domainOption: data.domainInfo.domainOption,
      domain: data.domainInfo.domain,
      domainStatus: data.domainInfo.domainStatus,
      domainAvailabilityChecked: data.domainInfo.domainAvailabilityChecked,
      domainAvailable: data.domainInfo.domainAvailable
    };

    if (!orderSnap.exists()) {
      await setDoc(orderRef, {
        ...orderData,
        createdAt: serverTimestamp()
      });
    } else {
      await setDoc(orderRef, {
        ...orderData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: data.name,
        phone: data.phone,
        phoneE164: data.phoneE164,
        phoneVerified: true,
        role: "client",
        createdAt: serverTimestamp()
      });
    } else {
      await setDoc(userRef, {
        name: data.name,
        phone: data.phone,
        phoneE164: data.phoneE164,
        phoneVerified: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    const subRef = doc(db, "subscriptions", user.uid);
    const subSnap = await getDoc(subRef);

    const subscriptionData = {
      userId: user.uid,
      name: data.name,
      phone: data.phone,
      phoneE164: data.phoneE164,
      phoneVerified: true,
      status: "جاري التفعيل",
      plan: data.selectedPackage,
      billingCycle: data.cycle,
      template: data.template,
      siteUrl: "",
      hostingDate: "",
      domainDate: "",

      domainOption: data.domainInfo.domainOption,
      domain: data.domainInfo.domain,
      domainStatus: data.domainInfo.domainStatus,
      domainAvailabilityChecked: data.domainInfo.domainAvailabilityChecked,
      domainAvailable: data.domainInfo.domainAvailable,

      updatedAt: serverTimestamp()
    };

    if (!subSnap.exists()) {
      await setDoc(subRef, {
        subId: "SUB-" + Math.floor(100000 + Math.random() * 900000),
        ...subscriptionData,
        createdAt: serverTimestamp()
      });
    } else {
      await setDoc(subRef, subscriptionData, { merge: true });
    }

    setFinalLoading(true, "تم تسجيل طلبك بنجاح، جاري تحويلك...");

    const msg = document.createElement("div");
    msg.className = "request-success-toast";
    msg.innerText = "✓ تم إرسال الطلب بنجاح\nجاري تحويلك...";
    document.body.appendChild(msg);

    setTimeout(() => {
      window.location.href = "account.html";
    }, 1200);

  } catch (e) {
    setFinalLoading(false);
    alert(e.message || e);
  } finally {
    isSubmittingRequest = false;

    if (submitBtn) {
      submitBtn.innerText = "ابدأ موقعك الآن";
      submitBtn.disabled = false;
    }
  }
}

if (submitBtn) {
  submitBtn.onclick = startPhoneVerificationStep;
}
