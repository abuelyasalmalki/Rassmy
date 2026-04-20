const faqItems = Array.from(document.querySelectorAll(".faq-item"));

faqItems.forEach((item) => {
  const button = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  if (!button || !answer) return;

  button.addEventListener("click", () => {
    const isOpen = item.classList.contains("is-open");

    faqItems.forEach((otherItem) => {
      const otherButton = otherItem.querySelector(".faq-question");
      const otherAnswer = otherItem.querySelector(".faq-answer");

      if (!otherButton || !otherAnswer) return;

      otherItem.classList.remove("is-open");
      otherButton.setAttribute("aria-expanded", "false");
      otherAnswer.hidden = true;
    });

    if (!isOpen) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      answer.hidden = false;
    }
  });
});