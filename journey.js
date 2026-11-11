const stops = [
  { tick: 'Before 2021', date: 'Before 2021', city: 'Hangzhou', key: 'hangzhou',
    note: 'The starting point of my journey, before moving to New York for college.' },
  { tick: 'Aug 2021', date: 'August 2021', city: 'New York', key: 'new-york',
    note: 'Started studying industrial design at Pratt Institute.' },
  { tick: 'Jun 2023', date: 'June–August 2023', city: 'Beijing', key: 'beijing',
    note: 'Worked as a UI/UX design intern at Kuaishou Technology.' },
  { tick: 'Fall 2023', date: 'Fall 2023', city: 'New York', key: 'new-york',
    note: 'Returned to Pratt Institute to continue my undergraduate studies.' },
  { tick: 'Jun 2024', date: 'June–August 2024', city: 'Beijing', key: 'beijing',
    note: 'Joined Xiaomi’s mobile division as an industrial design intern.' },
  { tick: 'Fall 2024', date: 'Fall 2024–May 2025', city: 'New York', key: 'new-york',
    note: 'Returned to Pratt for my final year and graduated in May 2025.' },
  { tick: 'Jun 2025', date: 'June–August 2025', city: 'Hangzhou', key: 'hangzhou',
    note: 'Returned to Hangzhou for an industrial design internship at Hikvision.' },
  { tick: 'Aug 2025', date: 'August 2025–Present', city: 'Atlanta', key: 'atlanta',
    note: 'Started my Master of Industrial Design at Georgia Tech.' },
];

const slider = document.getElementById('journey-time');
const ticks = document.getElementById('journey-ticks');
const count = document.getElementById('journey-count');
const date = document.getElementById('journey-date');
const city = document.getElementById('journey-city');
const note = document.getElementById('journey-note');
const mapCities = document.querySelectorAll('.journey-city');
const legs = document.querySelectorAll('.journey-route');

const buttons = stops.map((stop, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = stop.tick;
  button.setAttribute('aria-label', stop.date + ', ' + stop.city);
  button.addEventListener('click', () => showStop(index));
  ticks.append(button);
  return button;
});

function showStop(index) {
  const stop = stops[index];
  const visited = new Set(stops.slice(0, index + 1).map(item => item.key));
  slider.value = index;
  slider.setAttribute('aria-valuetext', stop.date + ', ' + stop.city);
  count.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(stops.length).padStart(2, '0');
  date.textContent = stop.date;
  city.textContent = stop.city;
  note.textContent = stop.note;

  buttons.forEach((button, position) => button.setAttribute('aria-pressed', position === index));
  for (const marker of mapCities) {
    marker.classList.toggle('is-visited', visited.has(marker.dataset.city));
    marker.classList.toggle('is-current', marker.dataset.city === stop.key);
  }
  for (const leg of legs) {
    const end = Number(leg.dataset.leg);
    leg.classList.toggle('is-visited', end < index);
    leg.classList.toggle('is-current', end === index);
  }
}

slider.max = stops.length - 1;
slider.addEventListener('input', () => showStop(Number(slider.value)));
showStop(stops.length - 1);
document.getElementById('journey-controls').hidden = false;
