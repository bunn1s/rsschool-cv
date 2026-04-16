// --- Burger MENU ---
const burger = document.getElementById('burger');
const nav = document.querySelector('.nav');

if (burger && nav) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    nav.classList.toggle('open');
    document.body.classList.toggle('no-scroll');
  });
}

const navLinks = document.querySelectorAll('.nav__link');

// --- Close Burger ---
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    nav.classList.remove('open');
    document.body.classList.remove('no-scroll');
  });
});

// --- Resize ---
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    burger.classList.remove('open');
    nav.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
});

// --- Slider (for main page) ---
const track = document.getElementById('slider-track');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

let currentStep = 0;

function updateSlider() {
  const windowWidth = window.innerWidth;
  const totalSteps = windowWidth > 768 ? 3 : 6;

  const trackWidth = track.scrollWidth;
  const viewWidth = track.parentElement.clientWidth;
  const maxScroll = trackWidth - viewWidth;
  const stepWidth = maxScroll / totalSteps;

  track.style.transform = `translateX(-${currentStep * stepWidth}px)`;

  btnPrev.disabled = (currentStep === 0);
  btnNext.disabled = (currentStep === totalSteps);
}

btnNext.addEventListener('click', () => {
  const windowWidth = window.innerWidth;
  const totalSteps = windowWidth > 768 ? 3 : 6;
  if (currentStep < totalSteps) {
    currentStep++;
    updateSlider();
  }
});

btnPrev.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    updateSlider();
  }
});

window.addEventListener('resize', () => {
  currentStep = 0;
  updateSlider();
});

updateSlider();


// --- !!! TIMER !!! ---
function updateTimer() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

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
