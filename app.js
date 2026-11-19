(() => {
  'use strict';
  document.documentElement.classList.add('js-ready');

  // Progressive reveal; content stays visible if the browser lacks IntersectionObserver.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px 70px 0px' });
    document.querySelectorAll('.fadein').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.fadein').forEach(el => el.classList.add('revealed'));
  }

  const progress = document.querySelector('.scroll-progress');
  let scrollFrame = null;
  function updatePageProgress() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    if (progress) progress.style.width = `${Math.min(100, (scrollY / maxScroll) * 100)}%`;
    scrollFrame = null;
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updatePageProgress);
  }, { passive: true });
  updatePageProgress();

  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobileNav');
  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir el menú');
    mobileNav.hidden = true;
  }
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Abrir el menú' : 'Cerrar el menú');
    mobileNav.hidden = isOpen;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (evt) => {
    if (!mobileNav.hidden && !evt.target.closest('.site-header')) closeMenu();
  });

  // The top and bottom books open and turn their paper leaves on hover.
  // Touch visitors can tap; keyboard visitors can press Enter or Space.
  document.querySelectorAll('[data-book]').forEach(book => {
    function toggleBook() {
      book.classList.toggle('is-open');
      book.setAttribute('aria-pressed', String(book.classList.contains('is-open')));
    }
    book.addEventListener('click', toggleBook);
    book.addEventListener('keydown', evt => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        toggleBook();
      }
    });
    book.addEventListener('pointerleave', () => {
      if (matchMedia('(hover:hover)').matches) {
        book.classList.remove('is-open');
        book.setAttribute('aria-pressed', 'false');
      }
    });
  });

  const characters = {
    mariela: {
      role: 'LA ALUMNA / PROTAGONISTA',
      title: 'El deseo de vivirlo todo. El riesgo de perderse a sí misma.',
      text: 'Mariela es una estudiante universitaria que se siente deslumbrada por su profesor. Su curiosidad y su pasión la arrastran a una relación cada vez más difícil de controlar, hasta que empieza a cuestionar la imagen que había construido de él.',
      conflict: 'Aprender a distinguir el amor de la dependencia.'
    },
    alvar: {
      role: 'EL PROFESOR / LA FASCINACIÓN',
      title: 'Un hombre brillante que nunca muestra todas sus cartas.',
      text: 'Àlvar Colomer es profesor de Historia Contemporánea de Cataluña y un firme defensor del independentismo. Cautiva a Mariela con la misma brillantez con la que presenta a sus alumnos un pasado seleccionado y sesgado. La frontera entre influencia, seducción y control se vuelve cada vez más inquietante.',
      conflict: 'El poder de decidir qué versión de la realidad prevalece.'
    },
    amigo: {
      role: 'ORIOL / EL CONTRAPUNTO',
      title: 'El amigo que le hace las preguntas que Àlvar no quiere responder.',
      text: 'Oriol conoce a Mariela y la ayuda a detectar las manipulaciones de su profesor: tanto las que la someten emocionalmente como las que sesgan el relato histórico de Cataluña. Contrasta datos, señala contradicciones y le devuelve la posibilidad de pensar por sí misma.',
      conflict: 'Confrontar el relato del profesor sin decidir en lugar de Mariela.'
    }
  };
  const charTabs = [...document.querySelectorAll('[data-character]')];
  function chooseCharacter(key) {
    const info = characters[key];
    if (!info) return;
    document.querySelector('#characterRole').textContent = info.role;
    document.querySelector('#characterTitle').textContent = info.title;
    document.querySelector('#characterText').textContent = info.text;
    document.querySelector('#characterConflict').textContent = info.conflict;
    charTabs.forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.dataset.character === key));
      btn.tabIndex = btn.dataset.character === key ? 0 : -1;
    });
  }
  charTabs.forEach((btn, index) => {
    btn.tabIndex = index === 0 ? 0 : -1;
    btn.addEventListener('click', () => chooseCharacter(btn.dataset.character));
    btn.addEventListener('keydown', evt => {
      const dir = evt.key === 'ArrowDown' || evt.key === 'ArrowRight' ? 1 : evt.key === 'ArrowUp' || evt.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      evt.preventDefault();
      const next = charTabs[(index + dir + charTabs.length) % charTabs.length];
      next.focus();
      chooseCharacter(next.dataset.character);
    });
  });

  // A usable horizontal carousel with previous/next buttons and a progress line.
  // Official covers from the book websites.  They may be blocked by some
  // preview apps; show clear links to each original asset instead of blank cards.
  document.querySelectorAll('img[data-remote-cover]').forEach(img => {
    const container = img.closest('.book-card-cover');
    const markBroken = () => container?.classList.add('image-unavailable');
    img.addEventListener('error', markBroken);
    img.addEventListener('load', () => {
      if (img.naturalWidth) container?.classList.remove('image-unavailable');
      else markBroken();
    });
    if (img.complete && !img.naturalWidth) markBroken();
  });

  const carousel = document.querySelector('#booksCarousel');
  const carouselProgress = document.querySelector('#carouselProgress');
  function carouselStep() {
    const item = carousel.querySelector('.book-card');
    return item ? item.getBoundingClientRect().width + 21 : 230;
  }
  document.querySelector('#booksPrev').addEventListener('click', () => carousel.scrollBy({left: -carouselStep() * 2, behavior:'smooth'}));
  document.querySelector('#booksNext').addEventListener('click', () => carousel.scrollBy({left: carouselStep() * 2, behavior:'smooth'}));
  function updateCarouselProgress() {
    const total = carousel.scrollWidth;
    const fraction = carousel.clientWidth / total;
    const progressFraction = carousel.scrollLeft / Math.max(1, total - carousel.clientWidth);
    if (carouselProgress) carouselProgress.style.width = `${Math.min(100, fraction * 100)}%`;
    if (carouselProgress) carouselProgress.style.transform = `translateX(${progressFraction * (1 / fraction - 1) * 100}%)`;
    document.querySelector('#booksPrev').disabled = carousel.scrollLeft <= 2;
    document.querySelector('#booksNext').disabled = carousel.scrollLeft >= total - carousel.clientWidth - 3;
  }
  carousel.addEventListener('scroll', updateCarouselProgress, {passive:true});
  window.addEventListener('resize', updateCarouselProgress, {passive:true});
  carousel.addEventListener('keydown', event => {
    if (event.target !== carousel) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      carousel.scrollBy({left: carouselStep() * (event.key === 'ArrowRight' ? 1 : -1), behavior:'smooth'});
    }
  });
  updateCarouselProgress();

  // Native accessible dialogs: backdrop and Escape close; modal focus is contained.
  let activeModal = null;
  let lastFocus = null;
  function openModal(modal) {
    if (!modal) return;
    if (activeModal) closeModal();
    activeModal = modal;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.modal-close')?.focus();
  }
  function closeModal() {
    if (!activeModal) return;
    activeModal.hidden = true;
    activeModal = null;
    document.body.classList.remove('modal-open');
    lastFocus?.focus?.();
  }
  document.querySelectorAll('.buy-open').forEach(button => button.addEventListener('click', () => openModal(document.querySelector('#buyModal'))));
  document.querySelectorAll('.preview-open').forEach(button => button.addEventListener('click', () => { showReader(0); openModal(document.querySelector('#previewModal')); }));
  document.querySelector('#pressOpen')?.addEventListener('click', () => openModal(document.querySelector('#pressImageModal')));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { if (activeModal) closeModal(); else closeMenu(); }
    if (event.key !== 'Tab' || !activeModal) return;
    const nodes = [...activeModal.querySelectorAll('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')].filter(node => node.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const readerPages = [
    ['assets/pagina-01-portadilla.webp', 'Portadilla de La alumna de María Zabay'],
    ['assets/pagina-02-epigrafe.webp', 'Página del epígrafe, poema No era amor de José Ángel Buesa'],
    ['assets/pagina-03-comienzo.webp', 'Primera página original de la novela La alumna, capítulo uno']
  ];
  // Reuse the already-loaded page images, including data URLs in the standalone HTML.
  const bookPageImages = document.querySelectorAll('.book--hero .book-sheet img');
  [1,2,4].forEach((sourceIndex, pageNumber) => {
    const pageImg = bookPageImages[sourceIndex];
    if (pageImg?.src) readerPages[pageNumber][0] = pageImg.src;
  });
  let pageIndex = 0;
  function showReader(index) {
    pageIndex = Math.max(0, Math.min(readerPages.length - 1,index));
    const page = document.querySelector('#readerPage');
    page.classList.remove('turn'); void page.offsetWidth; page.classList.add('turn');
    const pageImage = document.querySelector('#readerImage');
    pageImage.src = readerPages[pageIndex][0];
    pageImage.alt = readerPages[pageIndex][1];
    document.querySelector('#readerNumber').textContent = `${String(pageIndex + 1).padStart(2,'0')} / ${String(readerPages.length).padStart(2,'0')}`;
    document.querySelector('#readerPrev').disabled = pageIndex === 0;
    document.querySelector('#readerNext').disabled = pageIndex === readerPages.length - 1;
  }
  document.querySelector('#readerPrev').addEventListener('click', () => showReader(pageIndex - 1));
  document.querySelector('#readerNext').addEventListener('click', () => showReader(pageIndex + 1));
  showReader(0);
  document.addEventListener('keydown', event => {
    if (!activeModal || activeModal.id !== 'previewModal') return;
    if (event.key === 'ArrowLeft') showReader(pageIndex - 1);
    if (event.key === 'ArrowRight') showReader(pageIndex + 1);
  });

  // Original covers and official portrait are never replaced by false covers.
  document.querySelectorAll('.book-card-cover img, .author-portrait img').forEach(img=>{
    const failure=()=>img.closest('.book-card-cover, .author-portrait')?.classList.add('image-unavailable');
    img.addEventListener('error', failure);
    if(img.complete && img.naturalWidth===0) failure();
  });
})();

// When an official source is genuinely available, display it over the local backup.
document.querySelectorAll('#booksCarousel .catalog-official').forEach(img=>{
 const parent=img.closest('.book-card-cover');
 const loaded=()=>{if(img.naturalWidth>0){parent?.classList.add('official-loaded');parent?.classList.remove('image-unavailable')}else parent?.classList.remove('official-loaded')};
 img.addEventListener('load',loaded);img.addEventListener('error',()=>parent?.classList.remove('official-loaded'));
 if(img.complete) loaded();
});
