// --- Button GIFTS ---
const highlightActiveLink = () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav__link');

  navLinks.forEach(link => {

    if (link.getAttribute('href').includes(currentPath) && currentPath !== '/') {
      link.classList.add('nav__link--active');
    } else if (currentPath === '/' && link.getAttribute('href').includes('index.html')) {
        link.classList.add('nav__link--active');
    }
  });
};

window.addEventListener('DOMContentLoaded', highlightActiveLink);


// --- Burger MENU ---
const burger = document.getElementById("burger");
const nav = document.querySelector(".nav");

if (burger && nav) {
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    nav.classList.toggle("open");
    document.body.classList.toggle("no-scroll");
  });
}

const navLinks = document.querySelectorAll(".nav__link");

// --- Close Burger ---
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    burger.classList.remove("open");
    nav.classList.remove("open");
    document.body.classList.remove("no-scroll");
  });
});

// --- Resize ---
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    burger.classList.remove("open");
    nav.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }
});

// --- Slider ---
const track = document.getElementById("slider-track");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");

if (track && btnPrev && btnNext) {
  let currentStep = 0;

  function updateSlider() {
    const windowWidth = window.innerWidth;
    const totalSteps = windowWidth > 768 ? 3 : 6;

    const trackWidth = track.scrollWidth;
    const viewWidth = track.parentElement.clientWidth;
    const maxScroll = trackWidth - viewWidth;
    const stepWidth = maxScroll / totalSteps;

    track.style.transform = `translateX(-${currentStep * stepWidth}px)`;

    btnPrev.disabled = currentStep === 0;
    btnNext.disabled = currentStep === totalSteps;
  }

  btnNext.addEventListener("click", () => {
    const windowWidth = window.innerWidth;
    const totalSteps = windowWidth > 768 ? 3 : 6;
    if (currentStep < totalSteps) {
      currentStep++;
      updateSlider();
    }
  });

  btnPrev.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      updateSlider();
    }
  });

  window.addEventListener("resize", () => {
    currentStep = 0;
    updateSlider();
  });

  updateSlider();
}

// --- !!! TIMER !!! ---
function updateTimer() {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!daysEl) return;

  const nextYear = new Date().getUTCFullYear() + 1;
  const targetDate = new Date(Date.UTC(nextYear, 0, 1));
  const now = new Date();

  const diff = targetDate - now;

  if (diff <= 0) {
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  daysEl.textContent = days;
  hoursEl.textContent = hours;
  minutesEl.textContent = minutes;
  secondsEl.textContent = seconds;
}

setInterval(updateTimer, 1000);
updateTimer();

// --- GIFTS PAGE 2 ---
let allGifts = [];

async function loadGifts() {
  const giftsContainer = document.getElementById("gifts-container");
  const bestContainer = document.getElementById("best-gifts-container");
  const container = giftsContainer || bestContainer;
  if (!container) return;

  try {
    const response = await fetch("./gifts.json");
    allGifts = await response.json();

    if (container.id === "best-gifts-container") {
      const shuffled = [...allGifts].sort(() => 0.5 - Math.random());
      renderGifts(shuffled.slice(0, 4), container);
    } else {
      renderGifts(allGifts, container);
      initTabs();
    }
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
}

function renderGifts(data, container) {
  if (!container) return;
  container.innerHTML = "";

  data.forEach((gift) => {
    const card = document.createElement("div");
    card.classList.add("gift-card");
    const categoryClass = gift.category.toLowerCase().split(" ").join("-");

    let imageName = "";
    if (gift.category === "For Work") imageName = "gift-work";
    else if (gift.category === "For Health") imageName = "gift-health";
    else if (gift.category === "For Harmony") imageName = "gift-harmony";

    card.innerHTML = `
      <div class="gift-card__image">
        <img src="./assets/img/image-gifts/${imageName}.png" alt="${gift.name}">
      </div>
      <div class="gift-card__content">
        <h3 class="gift-card__category ${categoryClass}">${gift.category}</h3>
        <h2 class="gift-card__title">${gift.name}</h2>
      </div>
    `;

    card.addEventListener("click", () => {
      openModal(gift);
    });

    container.appendChild(card);
  });
}

function initTabs() {
  const tabs = document.querySelectorAll(".tabs__btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      tabs.forEach((btn) => btn.classList.remove("tabs__btn--active"));
      e.target.classList.add("tabs__btn--active");
      const category = e.target.textContent.trim();
      if (category === "All") {
        renderGifts(allGifts, document.getElementById("gifts-container"));
      } else {
        const filtered = allGifts.filter((gift) => gift.category === category);
        renderGifts(filtered, document.getElementById("gifts-container"));
      }
    });
  });
}

loadGifts();

// --- Modal ---
function openModal(gift) {
  const overlay = document.getElementById("modal-overlay");
  const modalBody = document.getElementById("modal-body");
  if (!overlay || !modalBody) return;

  const categoryClass = gift.category.toLowerCase().split(" ").join("-");
  const imageName =
    gift.category === "For Work"
      ? "gift-work"
      : gift.category === "For Health"
        ? "gift-health"
        : "gift-harmony";

  const sp = gift.superpowers || {};
  const powers = [
    { name: "Live", value: sp.live || "+0" },
    { name: "Create", value: sp.create || "+0" },
    { name: "Love", value: sp.love || "+0" },
    { name: "Dream", value: sp.dream || "+0" },
  ];

  const renderSnowflakes = (value) => {
    const num = parseInt(value.toString().replace(/\D/g, "")) || 0;
    const count = num / 100;
    let html = "";
    for (let i = 0; i < 5; i++) {
      html += `
      <img
        src="./assets/img/snowflake.svg"
        alt="snowflake"
        class="modal-snowflake"
        style="width: 16px; height: 16px; opacity: ${i < count ? "1" : "0.1"}"
      >`;
    }
    return html;
  };

  const statsHtml = powers
    .map(
      (p) => `
    <div class="modal-row">
      <span class="modal-row-name">${p.name}</span>
      <div class="modal-row-data">
        <span class="modal-row-value">${p.value}</span>
        <div class="modal-row-stars">${renderSnowflakes(p.value)}</div>
      </div>
    </div>
  `,
    )
    .join("");

  modalBody.innerHTML = `
    <div class="modal-container">
      <div class="modal-img-wrap">
        <img src="./assets/img/image-gifts/${imageName}.png" alt="${gift.name}">
      </div>
      <div class="modal-content-wrap">
      <p class="gift-card__category ${categoryClass}">${gift.category}</p>
      <h3 class="modal-title">${gift.name}</h3>
      <p class="modal-description">${gift.description}</p>

      <h4 class="modal-subtitle">Adds superpowers:</h4>
      <div class="modal-stats-block">
        ${statsHtml}
      </div>
    </div>
  </div>
`;

  overlay.classList.add("open");
  document.body.classList.add("no-scroll");
}

document.getElementById("modal-overlay")?.addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay" || e.target.closest("#modal-close")) {
    document.getElementById("modal-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
  }
});

// --- Button back to top ---
const btnTop = document.getElementById("back-to-top");

if (btnTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btnTop.classList.add("visible");
    } else {
      btnTop.classList.remove("visible");
    }
  });

  btnTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}
