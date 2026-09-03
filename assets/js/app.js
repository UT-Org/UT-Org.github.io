/**
 * ABC Tutoring prototype application.
 *
 * State intentionally lives in memory. That is ideal for this no-login
 * prototype: it is fast, easy to inspect, and contains no persistent student
 * information. A production booking service can replace submitBooking()
 * without changing the UI architecture.
 */
(function initializeApp() {
  const { tutors, bookingDates, bookingTimes } = window.ABCTutoringData;
  const analytics = window.ABCTutoringAnalytics;

  const state = {
    activeFilter: "All",
    selectedTutor: tutors.find((tutor) => tutor.id === "maya-chen"),
    selectedDate: bookingDates[0],
    selectedTime: bookingTimes[0],
    bookingStep: "closed",
    bookingActive: false,
  };

  const elements = {
    tutorGrid: document.querySelector("#tutorGrid"),
    modal: document.querySelector("#bookingModal"),
    stepAvailability: document.querySelector("#stepAvailability"),
    bookingForm: document.querySelector("#bookingForm"),
    success: document.querySelector("#bookingSuccess"),
    summaryName: document.querySelector("#summaryName"),
    summarySubject: document.querySelector("#summarySubject"),
    summaryRate: document.querySelector("#summaryRate"),
    miniFace: document.querySelector("#miniFace"),
    subject: document.querySelector("#subjectSelect"),
    progressDetails: document.querySelector("#progressDetails"),
    modalTitle: document.querySelector("#modalTitle"),
    modalSubtitle: document.querySelector("#modalSubtitle"),
    parentName: document.querySelector("#parentName"),
    dateOptions: document.querySelector("#dateOptions"),
    timeOptions: document.querySelector("#timeOptions"),
  };

  function track(eventName, properties = {}) {
    analytics.track(eventName, properties);
  }

  function getBookingContext() {
    return {
      tutor_id: state.selectedTutor.id,
      subject: state.selectedTutor.subject,
      rate: state.selectedTutor.rate,
      date: `${state.selectedDate.label} ${state.selectedDate.date}`,
      time: state.selectedTime,
      stage: state.bookingStep,
    };
  }

  function getFilteredTutors() {
    if (state.activeFilter === "All" || state.activeFilter === "Online") {
      return tutors;
    }
    return tutors.filter((tutor) => tutor.subject === state.activeFilter);
  }

  function tutorCardTemplate(tutor) {
    return `
      <article class="tutor-card" data-tutor-id="${tutor.id}">
        <div class="portrait ${tutor.portraitClass}">
          <span class="available">${tutor.nextAvailable}</span>
        </div>
        <div class="card-body">
          <div class="name-row">
            <h3>${tutor.name}</h3>
            <span class="rate">$${tutor.rate}<small>/hr</small></span>
          </div>
          <div class="tags">
            <span class="tag">${tutor.subject}</span>
            <span class="tag">${tutor.grades}</span>
            <span class="tag">Online + in person</span>
          </div>
          <p class="detail">${tutor.bio}</p>
          <div class="card-actions">
            <button class="btn light" data-action="profile">View profile</button>
            <button class="btn primary" data-action="book">See availability</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderTutors() {
    elements.tutorGrid.innerHTML = getFilteredTutors()
      .map(tutorCardTemplate)
      .join("");
  }

  function renderScheduleOptions() {
    elements.dateOptions.innerHTML = bookingDates
      .map(
        (date, index) => `
          <button class="date-btn ${index === 0 ? "active" : ""}"
                  data-date-index="${index}">
            <small>${date.label}</small>${date.date}
          </button>
        `,
      )
      .join("");

    elements.timeOptions.innerHTML = bookingTimes
      .map(
        (time, index) => `
          <button class="time-btn ${index === 0 ? "active" : ""}"
                  data-time-index="${index}">
            ${time}
          </button>
        `,
      )
      .join("");
  }

  function setActiveOption(container, activeButton) {
    container
      .querySelectorAll("button")
      .forEach((button) => button.classList.toggle("active", button === activeButton));
  }

  function openBooking(tutor = state.selectedTutor) {
    state.selectedTutor = tutor;
    state.selectedDate = bookingDates[0];
    state.selectedTime = bookingTimes[0];
    state.bookingStep = "availability";
    state.bookingActive = true;

    renderScheduleOptions();
    elements.summaryName.textContent = tutor.name;
    elements.summarySubject.textContent = `${tutor.subject} · ${tutor.grades}`;
    elements.summaryRate.textContent = `$${tutor.rate}`;
    elements.miniFace.className = `mini-face ${tutor.portraitClass}`;
    elements.subject.value = tutor.subject;

    elements.stepAvailability.classList.remove("hidden");
    elements.bookingForm.classList.add("hidden");
    elements.success.classList.add("hidden");
    elements.progressDetails.classList.remove("on");
    elements.modalTitle.textContent = "Book a session";
    elements.modalSubtitle.textContent = "Choose a time that works for you.";
    elements.modal.classList.add("open");
    document.body.style.overflow = "hidden";

    track("tutor_availability_viewed", getBookingContext());
  }

  function closeBooking(reason = "dismissed") {
    if (state.bookingActive) {
      track("booking_abandoned", {
        ...getBookingContext(),
        reason,
      });
    }

    state.bookingActive = false;
    state.bookingStep = "closed";
    elements.modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function showBookingDetails() {
    state.bookingStep = "details";
    track("booking_details_viewed", getBookingContext());

    elements.stepAvailability.classList.add("hidden");
    elements.bookingForm.classList.remove("hidden");
    elements.progressDetails.classList.add("on");
    elements.modalSubtitle.textContent = "Tell us a little about your learner.";
    elements.parentName.focus();
  }

  function showAvailability() {
    track("booking_step_back", {
      ...getBookingContext(),
      from_step: "details",
    });
    state.bookingStep = "availability";

    elements.bookingForm.classList.add("hidden");
    elements.stepAvailability.classList.remove("hidden");
    elements.progressDetails.classList.remove("on");
  }

  function submitBooking(event) {
    event.preventDefault();
    const formData = new FormData(elements.bookingForm);

    // Prototype behavior: confirmation is client-side only. Do not persist PII.
    state.bookingStep = "complete";
    track("booking_completed", {
      ...getBookingContext(),
      subject: formData.get("subject"),
      grade_band: formData.get("grade"),
      session_format: formData.get("format"),
    });
    state.bookingActive = false;

    elements.bookingForm.classList.add("hidden");
    elements.success.classList.remove("hidden");
    elements.modalTitle.textContent = "Booking confirmed";
    elements.modalSubtitle.textContent = "A great next step.";
  }

  function handleTutorGridClick(event) {
    const actionButton = event.target.closest("[data-action]");
    const card = event.target.closest("[data-tutor-id]");
    if (!actionButton || !card) return;

    const tutor = tutors.find((item) => item.id === card.dataset.tutorId);
    if (actionButton.dataset.action === "book") {
      openBooking(tutor);
      return;
    }

    track("tutor_profile_viewed", {
      tutor_id: tutor.id,
      subject: tutor.subject,
    });
    card.querySelector(".detail").textContent =
      `${tutor.bio}. Sessions are tailored to each student's pace and goals.`;
  }

  function handleFilterClick(event) {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.activeFilter = button.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((item) => item.classList.toggle("active", item === button));
    renderTutors();

    track("tutor_list_filtered", {
      filter: state.activeFilter,
      result_count: elements.tutorGrid.children.length,
    });
  }

  function bindEvents() {
    elements.tutorGrid.addEventListener("click", handleTutorGridClick);
    document.querySelector(".filterbar").addEventListener("click", handleFilterClick);

    document.querySelectorAll("[data-subject]").forEach((card) => {
      card.addEventListener("click", () => {
        const subject = card.dataset.subject;
        document.querySelector(`[data-filter="${subject}"]`).click();
        document.querySelector("#tutors").scrollIntoView();
        track("subject_interest", { subject });
      });
    });

    document.querySelectorAll("[data-book]").forEach((button) => {
      button.addEventListener("click", () => openBooking());
    });

    elements.dateOptions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-date-index]");
      if (!button) return;
      state.selectedDate = bookingDates[Number(button.dataset.dateIndex)];
      setActiveOption(elements.dateOptions, button);
    });

    elements.timeOptions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-time-index]");
      if (!button) return;
      state.selectedTime = bookingTimes[Number(button.dataset.timeIndex)];
      setActiveOption(elements.timeOptions, button);
    });

    document.querySelector("#closeBooking").addEventListener("click", () => {
      closeBooking("close_button");
    });
    document.querySelector("#continueBooking").addEventListener("click", showBookingDetails);
    document.querySelector("#backBooking").addEventListener("click", showAvailability);
    document.querySelector("#finishBooking").addEventListener("click", () => {
      closeBooking("confirmation_done");
    });
    elements.bookingForm.addEventListener("submit", submitBooking);

    elements.modal.addEventListener("click", (event) => {
      if (event.target === elements.modal) closeBooking("backdrop");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && elements.modal.classList.contains("open")) {
        closeBooking("escape_key");
      }
    });

    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.addEventListener("click", () => track("contact_clicked", { method: "phone" }));
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.addEventListener("click", () => track("contact_clicked", { method: "email" }));
    });

    window.addEventListener("pagehide", () => {
      if (!state.bookingActive) return;
      track("booking_abandoned", {
        ...getBookingContext(),
        reason: "page_exit",
      });
      state.bookingActive = false;
    });
  }

  renderTutors();
  renderScheduleOptions();
  bindEvents();
})();
