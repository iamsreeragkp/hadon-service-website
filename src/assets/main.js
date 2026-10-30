/* Hadon for business — site behaviour */
(() => {
  // ------------------------------------------------------------------
  // Mail. Web3Forms (free) delivers to the inbox tied to ACCESS_KEY.
  // Submissions go to the inbox the key was created with (INQUIRY_EMAIL).
  // PUBLIC_EMAIL is only shown to visitors if sending fails.
  // ------------------------------------------------------------------
  const INQUIRY_EMAIL = "srrgkp65@gmail.com";
  const PUBLIC_EMAIL = "bils@hadonlabs.com";
  const WEB3FORMS_ACCESS_KEY = "69b5a1c2-d68b-4be3-b8a1-f36558c7da85";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Header border once the page scrolls
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Services dropdown: hover on desktop, click/keyboard everywhere
  $$("[data-dropdown]").forEach((btn) => {
    const menu = document.getElementById(btn.getAttribute("aria-controls"));
    const item = btn.parentElement;
    let closeTimer;
    const set = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    };
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    item.addEventListener("mouseenter", () => { clearTimeout(closeTimer); set(true); });
    item.addEventListener("mouseleave", () => { closeTimer = setTimeout(() => set(false), 140); });
    item.addEventListener("focusout", (e) => { if (!item.contains(e.relatedTarget)) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    document.addEventListener("click", (e) => { if (!item.contains(e.target)) set(false); });
  });

  // Mobile menu
  const menuBtn = $(".menu-btn");
  if (menuBtn) {
    const setMenu = (open) => {
      document.body.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    $$("#mobile-menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    window.addEventListener("resize", () => { if (window.innerWidth > 960) setMenu(false); });
  }

  // Contact modal. Any [data-contact] opens it; href is the no-JS fallback.
  const dialog = $("#contact-dialog");
  const modalForm = $("#contact-modal-form");
  const modalSuccess = dialog && $(".contact-modal-success", dialog);
  const modalEmail = $("#contact-email");
  const modalMessage = $("#contact-message");
  const modalError = dialog && $("[data-contact-error]", dialog);

  const submitToInbox = async (fields, subject = "New contact from Hadon for business") => {
    if (!WEB3FORMS_ACCESS_KEY) {
      throw new Error("Add your free Web3Forms access key in src/assets/main.js");
    }
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject,
        from_name: "Hadon for business website",
        replyto: fields.Email,
        ...fields,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Could not send");
    }
  };

  const openContact = () => {
    if (!dialog || typeof dialog.showModal !== "function") {
      location.href = "contact.html";
      return;
    }
    document.body.classList.remove("menu-open");
    dialog.classList.remove("is-sent", "is-sending");
    if (modalForm) modalForm.reset();
    if (modalError) {
      modalError.hidden = true;
      modalError.textContent = "Please add your email and a message.";
    }
    if (modalSuccess) modalSuccess.hidden = true;
    dialog.showModal();
    if (modalEmail) modalEmail.focus();
  };

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-contact]");
    if (!trigger) return;
    e.preventDefault();
    openContact();
  });
  if (dialog) {
    $$("[data-contact-close]", dialog).forEach((btn) => btn.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }
  if (modalForm) {
    modalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (modalEmail.value || "").trim();
      const message = (modalMessage.value || "").trim();
      if (!modalEmail.checkValidity() || !email || !message) {
        modalError.hidden = false;
        (!email || !modalEmail.checkValidity() ? modalEmail : modalMessage).focus();
        return;
      }
      modalError.hidden = true;
      dialog.classList.add("is-sending");
      try {
        await submitToInbox({ Email: email, Message: message }, "New message from the Contact us pop-up");
        dialog.classList.add("is-sent");
        modalSuccess.hidden = false;
        modalSuccess.querySelector("h2").focus?.();
      } catch {
        modalError.textContent = "Could not send right now. Email us at " + PUBLIC_EMAIL + ".";
        modalError.hidden = false;
      } finally {
        dialog.classList.remove("is-sending");
      }
    });
  }

  // Live clocks for the hubs section
  const clocks = $$("time[data-tz]");
  if (clocks.length) {
    const fmt = {};
    const tick = () => {
      const now = new Date();
      clocks.forEach((el) => {
        const tz = el.dataset.tz;
        fmt[tz] ||= new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
        el.textContent = fmt[tz].format(now);
        el.dateTime = now.toISOString();
      });
    };
    tick();
    setInterval(tick, 15000);
  }

  // Contact page form — same free inbox as the modal
  const form = $(".form");
  if (form) {
    const interest = new URLSearchParams(location.search).get("interest");
    const select = $("#f-interest", form);
    if (interest && select.querySelector(`option[value="${CSS.escape(interest)}"]`)) select.value = interest;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const error = $("[data-form-error]", form);
      const required = $$("[required]", form);
      const invalid = required.filter((el) => !el.checkValidity());
      required.forEach((el) => el.setAttribute("aria-invalid", String(invalid.includes(el))));
      if (invalid.length) {
        error.textContent = "Please add your name, a work email and what you\u2019re looking for.";
        error.hidden = false;
        invalid[0].focus();
        return;
      }
      error.hidden = true;

      const d = new FormData(form);
      const looking = select.options[select.selectedIndex].text;
      const submitBtn = form.querySelector("[type=submit]");
      if (submitBtn) submitBtn.disabled = true;
      try {
        await submitToInbox(
          {
            Name: d.get("name"),
            Email: d.get("email"),
            Company: d.get("company") || "—",
            "Looking for": looking,
            "Target start date": d.get("start"),
            "Project description": d.get("brief") || "No project brief provided.",
          },
          `New project inquiry — ${looking} — ${d.get("company") || d.get("name")}`
        );
        const wrap = form.parentElement;
        wrap.classList.add("is-sent");
        $(".form-success", wrap).focus();
      } catch {
        error.textContent = "Could not send right now. Email us at " + PUBLIC_EMAIL + ".";
        error.hidden = false;
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Gentle reveal on scroll
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }
})();
