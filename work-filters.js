const work = document.getElementById('work');
const filters = work.querySelector('.work-filters');
const filterButtons = filters.querySelectorAll('button');
const projectCards = work.querySelectorAll('.project-card');
const workGroups = work.querySelectorAll('[data-work-group]');
const workStatus = document.getElementById('work-status');

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    const category = button.dataset.category;

    for (const card of projectCards) {
      card.hidden = category !== 'all' && !card.dataset.categories.split(' ').includes(category);
    }
    for (const option of filterButtons) {
      option.setAttribute('aria-pressed', option === button);
    }
    for (const group of workGroups) {
      group.hidden = !group.querySelector('.project-card:not([hidden])');
    }

    const visibleCount = work.querySelectorAll('.project-card:not([hidden])').length;
    workStatus.textContent = button.textContent + ', ' + visibleCount + ' projects';
  });
}

filters.hidden = false;
