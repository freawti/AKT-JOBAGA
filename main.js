/* Awwwards-level kinetic scroll choreography (landonorris.com + lusion.co + locomotive.ca motion language). */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const langButtons = document.querySelectorAll('.lang-button');

  // 1. Preloader 0 -> 100% + upward curtain wipe
  const preloader = document.querySelector('#preloader');
  const preloaderCount = document.querySelector('#preloader-count');
  const preloaderFill = document.querySelector('#preloader-bar-fill');
  let preloaderResolve;
  const preloaderDone = new Promise((resolve) => { preloaderResolve = resolve; });

  if (preloader && !reducedMotion && window.gsap) {
    document.body.classList.add('is-loading');
    const state = { val: 0 };
    const tl = window.gsap.timeline({
      onComplete: () => {
        preloader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        preloaderResolve();
      }
    });
    tl.to(state, {
      val: 100,
      duration: 1.15,
      ease: 'power2.inOut',
      onUpdate: () => {
        const rounded = Math.round(state.val);
        if (preloaderCount) preloaderCount.textContent = String(rounded).padStart(3, '0');
        if (preloaderFill) preloaderFill.style.transform = `scaleX(${state.val / 100})`;
      }
    }).to(preloader, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.78,
      ease: 'power4.inOut'
    }, '+=0.08');
  } else {
    preloader?.classList.add('is-done');
    preloaderResolve?.();
  }

  // 2. Magnetic pull on select links (timeline arrows stay static & centered)
  if (finePointer && !reducedMotion && window.gsap) {
    document.querySelectorAll('.text-link, .back-top, .scroll-cue, .lang-button').forEach((el) => {
      el.classList.add('magnetic');
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
        window.gsap.to(el, { x: dx, y: dy, duration: 0.35, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => {
        window.gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  // 3. Word/character text splitting helpers for Lando-style masked reveals
  function splitIntoMasks(el, mode = 'words') {
    if (!el) return [];
    const walk = (node) => {
      const out = [];
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent;
          if (!text.trim()) return;
          const frag = document.createDocumentFragment();
          const tokens = text.split(/(\s+)/);
          tokens.forEach((tok) => {
            if (/^\s+$/.test(tok)) {
              frag.appendChild(document.createTextNode(tok));
              return;
            }
            if (mode === 'chars') {
              const wordWrap = document.createElement('span');
              wordWrap.style.display = 'inline-block';
              wordWrap.style.whiteSpace = 'nowrap';
              for (const ch of tok) {
                const mask = document.createElement('span');
                mask.className = 'char-mask';
                const inner = document.createElement('span');
                inner.className = 'char-inner';
                inner.textContent = ch;
                mask.appendChild(inner);
                wordWrap.appendChild(mask);
                out.push(inner);
              }
              frag.appendChild(wordWrap);
            } else {
              const mask = document.createElement('span');
              mask.className = 'word-mask';
              const inner = document.createElement('span');
              inner.className = 'word-inner';
              inner.textContent = tok;
              mask.appendChild(inner);
              frag.appendChild(mask);
              out.push(inner);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          out.push(...walk(child));
        }
      });
      return out;
    };
    return walk(el);
  }

  // 4. Language switcher (RU / EN)
  const translations = {
    ru: {
      skip: 'Перейти к содержимому', menu: 'МЕНЮ', navStory: 'История', navDistance: 'Дистанция', navKz: 'Казахстан', navAthletes: 'Атлеты',
      heroEyebrow: 'ИСТОРИЯ ДЛИННОЙ ДИСТАНЦИИ · 1987—2026', heroIntro: 'Три дисциплины.\nОдна дистанция за пределом привычного.', scroll: 'ЛИСТАЙТЕ',
      introTitle: 'ОДНА ИДЕЯ.<br><span>226 КИЛОМЕТРОВ.</span>', introBody: 'История длинного триатлона — это путь от спора на Гавайях до глобального испытания выносливости. Три вида спорта соединяются в один непрерывный маршрут.', explore: 'ИССЛЕДОВАТЬ ИСТОРИЮ',
      distanceTitle: 'ТРИ ЧАСТИ.<br><span>ОДИН ФИНИШ.</span>', distanceText: 'Стандартная полная дистанция: три этапа подряд, без остановки часов.', swim: 'Плавание', bike: 'Велосипед', run: 'Бег', total: 'ВСЕГО',
      bikeHeadline: 'ПОЙМАЙ<br><span>РИТМ.</span>', bikePrompt: 'Наведите курсор — колёса ускорятся.', bikeHint: 'HOVER TO RIDE <i>↗</i>',
      gearEyebrow: 'ЭКИПИРОВКА · ОДНО ТЕЛО', gearTitle: 'ДВЕ СТИХИИ.<br><span>ОДИН АТЛЕТ.</span>', gearDesc: 'От открытой воды в гидрокостюме до финального марафона — проведите курсором по атлету, чтобы локально проявить плавательную экипировку.', gearRunLabel: 'БЕГОВАЯ ФОРМА · 42,195 КМ', gearSwimLabel: 'ГИДРОКОСТЮМ · 3,8 КМ', gearHint: 'НАВЕДИТЕ НА АТЛЕТА · SWIM / RUN',
      timelineTitle: 'ВРЕМЯ<br><span>ДИСТАНЦИИ</span>', timelineText: 'От гавайского пролога к соревнованиям по всему миру.', timelineNote: 'Источники всех фотографий и проверенных исторических фактов собраны в assets/CREDITS.md.',
      hallTitle: 'ЛИЦА<br><span>ВЫНОСЛИВОСТИ</span>', hallText: 'Первый победитель, шестикратный чемпион и рекордсменка по числу титулов.',
      halfText: 'Половина полной дистанции. Три этапа, один финиш.', backTop: 'НАВЕРХ'
    },
    en: {
      skip: 'Skip to content', menu: 'MENU', navStory: 'Story', navDistance: 'Distance', navKz: 'Kazakhstan', navAthletes: 'Athletes',
      heroEyebrow: 'A HISTORY OF LONG DISTANCE · 1987—2026', heroIntro: 'Three disciplines.\nOne distance beyond the ordinary.', scroll: 'SCROLL',
      introTitle: 'ONE IDEA.<br><span>226 KILOMETRES.</span>', introBody: 'The story of long-distance triathlon runs from a debate in Hawai‘i to a global test of endurance. Three sports meet in one continuous course.', explore: 'EXPLORE THE STORY',
      distanceTitle: 'THREE PARTS.<br><span>ONE FINISH.</span>', distanceText: 'The standard full distance: three stages, one continuous race.', swim: 'Swim', bike: 'Bike', run: 'Run', total: 'TOTAL',
      bikeHeadline: 'FIND THE<br><span>RHYTHM.</span>', bikePrompt: 'Hover to spin up the wheels.', bikeHint: 'HOVER TO RIDE <i>↗</i>',
      gearEyebrow: 'EQUIPMENT · ONE BODY', gearTitle: 'TWO ELEMENTS.<br><span>ONE ATHLETE.</span>', gearDesc: 'From open-water neoprene to the final marathon stride — move your cursor over the athlete to subtly reveal his swim wetsuit right under the pointer.', gearRunLabel: 'RUNNING KIT · 42.195 KM', gearSwimLabel: 'SWIM WETSUIT · 3.8 KM', gearHint: 'HOVER OVER ATHLETE · SWIM / RUN',
      timelineTitle: 'TIME<br><span>IN MOTION</span>', timelineText: 'From a Hawaiian prologue to races around the world.', timelineNote: 'All photo credits and verified historical sources are documented in assets/CREDITS.md.',
      hallTitle: 'FACES OF<br><span>ENDURANCE</span>', hallText: 'The first winner, a six-time champion and the athlete with the most world titles.',
      halfText: 'Half the full distance. Three stages, one finish.', backTop: 'BACK TO TOP'
    }
  };

  function setLanguage(lang) {
    const dictionary = translations[lang] || translations.ru;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = dictionary[node.dataset.i18n];
      if (value) node.innerHTML = value.replaceAll('\n', '<br>');
    });
    langButtons.forEach((button) => {
      const active = button.dataset.lang === lang;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  langButtons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));

  // 5. Interactive 3D Athlete Localized Morph (soft feathered spot, NO visible circle, smaller radius)
  const swapStage = document.querySelector('#athlete-swap-stage');
  const swapFrame = swapStage?.querySelector('.swap-frame');
  const swapSwimImg = swapStage?.querySelector('.swap-img-swim');
  const runModeBadge = document.querySelector('.gear-mode.is-run');
  const swimModeBadge = document.querySelector('.gear-mode.is-swim');

  if (swapStage && swapFrame && swapSwimImg) {
    let targetX = 50;
    let targetY = 50;
    let curX = 50;
    let curY = 50;
    let hovering = false;
    let tapPinned = false;
    let lensRaf = 0;

    const getRevealRadius = () => (window.innerWidth < 760 ? '86px' : '118px');

    const updateSpotPosition = () => {
      curX += (targetX - curX) * 0.2;
      curY += (targetY - curY) * 0.2;
      swapFrame.style.setProperty('--mx', `${curX.toFixed(2)}%`);
      swapFrame.style.setProperty('--my', `${curY.toFixed(2)}%`);
      if (hovering || tapPinned) {
        lensRaf = requestAnimationFrame(updateSpotPosition);
      } else {
        lensRaf = 0;
      }
    };

    const setSpotActive = (active, clientX, clientY) => {
      hovering = active;
      swapStage.classList.toggle('is-swapped', active);
      swapStage.setAttribute('aria-pressed', String(active));
      runModeBadge?.classList.toggle('is-active', !active);
      swimModeBadge?.classList.toggle('is-active', active);

      if (typeof clientX === 'number' && typeof clientY === 'number') {
        const rect = swapFrame.getBoundingClientRect();
        targetX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        targetY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
        if (!lensRaf) {
          curX = targetX;
          curY = targetY;
          swapFrame.style.setProperty('--mx', `${curX.toFixed(2)}%`);
          swapFrame.style.setProperty('--my', `${curY.toFixed(2)}%`);
        }
      }

      if (active && !lensRaf) {
        lensRaf = requestAnimationFrame(updateSpotPosition);
      }

      const radius = active ? getRevealRadius() : '0px';
      if (window.gsap && !reducedMotion) {
        window.gsap.to(swapSwimImg, { '--reveal-r': radius, duration: active ? 0.34 : 0.28, ease: 'power3.out' });
      } else {
        swapSwimImg.style.setProperty('--reveal-r', radius);
      }
    };

    swapStage.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') setSpotActive(true, e.clientX, e.clientY);
    });
    swapStage.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = swapFrame.getBoundingClientRect();
      targetX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      targetY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      const nx = targetX / 100 - 0.5;
      const ny = targetY / 100 - 0.5;
      if (!reducedMotion && window.gsap) {
        window.gsap.to(swapFrame, {
          rotateY: nx * 8,
          rotateX: -ny * 6,
          duration: 0.45,
          ease: 'power2.out'
        });
      }
    });
    swapStage.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'touch') {
        tapPinned = false;
        setSpotActive(false, e.clientX, e.clientY);
      }
      if (!reducedMotion && window.gsap) {
        window.gsap.to(swapFrame, { rotateY: 0, rotateX: 0, duration: 0.65, ease: 'power3.out' });
      }
    });
    swapStage.addEventListener('click', (e) => {
      if (e.pointerType === 'touch' || !finePointer) {
        tapPinned = !tapPinned;
        setSpotActive(tapPinned, e.clientX, e.clientY);
      }
    });
    swapStage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tapPinned = !tapPinned;
        setSpotActive(tapPinned);
      }
    });
  }

  // 6. Hall of Fame 3D Tilt & Specular Sheen
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.athlete-card').forEach((card) => {
      const box = card.querySelector('.athlete-placeholder');
      if (!box) return;
      card.addEventListener('pointermove', (e) => {
        const rect = box.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        box.style.setProperty('--gx', `${((nx + 0.5) * 100).toFixed(1)}%`);
        box.style.setProperty('--gy', `${((ny + 0.5) * 100).toFixed(1)}%`);
        if (window.gsap) {
          window.gsap.to(box, {
            rotateY: nx * 12,
            rotateX: -ny * 10,
            duration: 0.35,
            ease: 'power2.out'
          });
        }
      });
      card.addEventListener('pointerleave', () => {
        if (window.gsap) {
          window.gsap.to(box, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
        }
      });
    });
  }

  // 7. Mobile Menu
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    mobileMenu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

  // 8. Timeline: click-only carousel with centered static arrows
  const timelineCards = Array.from(document.querySelectorAll('.timeline-card'));
  const timelineButtons = Array.from(document.querySelectorAll('.timeline-year-nav button'));
  const timelineCounter = document.querySelector('.timeline-counter b');
  let activeTimelineIndex = Math.max(0, timelineCards.findIndex((card) => card.classList.contains('is-active')));

  function showTimelineCard(index) {
    if (!timelineCards.length) return;
    activeTimelineIndex = (index + timelineCards.length) % timelineCards.length;
    timelineCards.forEach((card, cardIndex) => card.classList.toggle('is-active', cardIndex === activeTimelineIndex));
    timelineButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeTimelineIndex;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (timelineCounter) timelineCounter.textContent = String(activeTimelineIndex + 1).padStart(2, '0');
    const activeCard = timelineCards[activeTimelineIndex];
    if (window.gsap && !reducedMotion && activeCard) {
      const img = activeCard.querySelector('.timeline-image img');
      window.gsap.fromTo(activeCard, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power3.out', clearProps: 'transform' });
      if (img) {
        window.gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 0.78, ease: 'power3.out' });
      }
    }
  }

  timelineButtons.forEach((button) => button.addEventListener('click', () => showTimelineCard(Number(button.dataset.timelineIndex))));
  document.querySelector('.timeline-prev')?.addEventListener('click', () => showTimelineCard(activeTimelineIndex - 1));
  document.querySelector('.timeline-next')?.addEventListener('click', () => showTimelineCard(activeTimelineIndex + 1));
  document.querySelector('.timeline-year-nav')?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showTimelineCard(activeTimelineIndex - 1); timelineButtons[activeTimelineIndex]?.focus(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showTimelineCard(activeTimelineIndex + 1); timelineButtons[activeTimelineIndex]?.focus(); }
  });

  // 9. Lenis + GSAP ScrollTrigger Choreography
  if (!reducedMotion && window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: true });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      // Top page scroll hairline
      const scrollFill = document.querySelector('#scroll-progress-fill');
      if (scrollFill) {
        gsap.to(scrollFill, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.1 }
        });
      }

      // Scroll-velocity-reactive marquee ("SWIM · BIKE · RUN")
      const tickerTrack = document.querySelector('.ticker-track');
      if (tickerTrack) {
        tickerTrack.style.animation = 'none';
        let tickerX = 0;
        let scrollBoost = 0;
        lenis.on('scroll', ({ velocity }) => {
          scrollBoost = Math.max(-18, Math.min(18, velocity * 0.45));
        });
        gsap.ticker.add((_, deltaMs) => {
          const dt = Math.min(0.05, deltaMs / 1000);
          scrollBoost *= 0.92;
          tickerX -= (48 + Math.abs(scrollBoost) * 28) * dt;
          const halfWidth = tickerTrack.scrollWidth * 0.25;
          if (halfWidth > 0 && Math.abs(tickerX) >= halfWidth) {
            tickerX += halfWidth;
          }
          tickerTrack.style.transform = `translate3d(${tickerX}px, 0, 0)`;
        });
      }

      // Hero masked kinetic entrance (after preloader curtain)
      const heroWords = splitIntoMasks(document.querySelector('.hero h1'), 'chars');
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
      intro.from('.hero .eyebrow', { y: 18, autoAlpha: 0, duration: 0.55 })
        .from(heroWords, { yPercent: 115, stagger: 0.045, duration: 0.95 }, '-=0.25')
        .from('.hero-years, .hero-intro', { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.12 }, '-=0.45')
        .from('.scroll-cue, .hero-index', { autoAlpha: 0, duration: 0.45, stagger: 0.08 }, '-=0.3');
      preloaderDone.then(() => intro.play());

      // Masked word reveals for section titles
      gsap.utils.toArray('.intro-layout h2, .discipline-heading h2, .gear-shift-copy h2, .timeline-heading h2, .hall-heading h2, .half-heading h2, .kz-heading h2').forEach((heading) => {
        const words = splitIntoMasks(heading, 'words');
        gsap.from(words, {
          yPercent: 115,
          duration: 0.9,
          stagger: 0.06,
          ease: 'power4.out',
          scrollTrigger: { trigger: heading, start: 'top 86%', once: true }
        });
      });

      // Intro rule & Discipline border choreography
      gsap.from('.intro-rule span', {
        y: 16, autoAlpha: 0, stagger: 0.12, duration: 0.65, ease: 'power3.out',
        scrollTrigger: { trigger: '.intro-rule', start: 'top 90%', once: true }
      });

      // Bottom / Finale Section: triggered directly on #final-headline so ANYTHING IS POSSIBLE. visibly animates in!
      const finalSection = document.querySelector('.final-section');
      const finalHeadline = document.querySelector('#final-headline');
      if (finalSection && finalHeadline) {
        const finalChars = splitIntoMasks(finalHeadline, 'chars');
        const finalTl = gsap.timeline({
          scrollTrigger: {
            trigger: finalHeadline,
            start: 'top 92%',
            toggleActions: 'play none none reverse'
          }
        });
        finalTl
          .from(finalSection.querySelector('.eyebrow'), { y: 20, autoAlpha: 0, duration: 0.5, ease: 'power3.out' })
          .from(finalChars, {
            yPercent: 125,
            skewY: 5,
            autoAlpha: 0,
            stagger: 0.03,
            duration: 1.0,
            ease: 'power4.out'
          }, '-=0.25')
          .from(finalSection.querySelector('.back-top'), { y: 24, autoAlpha: 0, duration: 0.65, ease: 'power3.out' }, '-=0.5')
          .from('.site-footer', { y: 18, autoAlpha: 0, duration: 0.55, ease: 'power3.out' }, '-=0.35');
      }

      // Section labels & staggered rows/cards
      gsap.utils.toArray('.section-label').forEach((el) => {
        gsap.from(el, {
          scaleX: 0.92, autoAlpha: 0, y: 16, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true }
        });
      });
      gsap.utils.toArray('.discipline-row, .athlete-card, .kz-story article, .gear-mode').forEach((element, idx) => {
        gsap.from(element, {
          y: 36, autoAlpha: 0, duration: 0.78, delay: (idx % 3) * 0.06, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 90%', once: true }
        });
      });

      // Count-up numbers ("226", "2018", "1 300+", "47")
      document.querySelectorAll('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const useSpace = el.dataset.space === 'true';
        const suffix = el.dataset.suffix || '';
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            const rounded = Math.round(obj.val);
            const text = useSpace ? rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(rounded);
            el.textContent = text + suffix;
          }
        });
      });

      // Image & Orb Parallax
      gsap.to('.hero-orb', {
        yPercent: 16, scale: 1.1, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 }
      });
      gsap.utils.toArray('.kz-photo img, .athlete-placeholder img').forEach((img) => {
        gsap.fromTo(img, { scale: 1.08, yPercent: -4 }, {
          scale: 1.08, yPercent: 4, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.7 }
        });
      });

      gsap.from('.half-bar i', {
        scaleX: 0, transformOrigin: 'left center', duration: 1.1, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: '.half-bars', start: 'top 82%', once: true }
      });

      // Astana Telemetry Route Diagram: SVG stroke draw + travelling live pulse dot + node pop-in
      const routePath = document.querySelector('#kz-route-path');
      const routeTracer = document.querySelector('#kz-route-tracer');
      const routeCard = document.querySelector('.route-card');
      if (routePath && routeCard) {
        const pathLen = routePath.getTotalLength();
        gsap.set(routePath, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
        gsap.to(routePath, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: routeCard, start: 'top 82%', end: 'bottom 45%', scrub: 0.65 }
        });
        gsap.from('.route-node', {
          scale: 0, transformOrigin: 'center center', autoAlpha: 0, stagger: 0.18, duration: 0.65, ease: 'back.out(1.9)',
          scrollTrigger: { trigger: routeCard, start: 'top 78%', once: true }
        });
        gsap.from('.route-labels span', {
          y: 12, autoAlpha: 0, stagger: 0.15, duration: 0.55, ease: 'power3.out',
          scrollTrigger: { trigger: routeCard, start: 'top 74%', once: true }
        });
        if (routeTracer) {
          const tracerState = { t: 0 };
          gsap.to(tracerState, {
            t: 1,
            duration: 4.2,
            repeat: -1,
            ease: 'power1.inOut',
            onUpdate: () => {
              const pt = routePath.getPointAtLength(tracerState.t * pathLen);
              routeTracer.setAttribute('cx', pt.x.toFixed(1));
              routeTracer.setAttribute('cy', pt.y.toFixed(1));
            }
          });
        }
      }

      // Pinned 6-slide stacked story sequence (#story-slides): crisp opaque cards sliding onto each other
      const story = document.querySelector('.scroll-story');
      const storyFrame = story?.querySelector('.story-frame');
      const slides = story ? Array.from(story.querySelectorAll('.story-slide')) : [];
      if (story && storyFrame && slides.length > 1) {
        const progressBar = story.querySelector('.story-progress i');
        const currentLabel = story.querySelector('.story-current');

        slides.forEach((slide, idx) => {
          const img = slide.querySelector('.story-media img');
          gsap.set(slide, {
            autoAlpha: 1,
            zIndex: idx + 1,
            yPercent: idx === 0 ? 0 : 100,
            scale: 1,
            filter: 'brightness(1)'
          });
          if (img) gsap.set(img, { scale: idx === 0 ? 1 : 1.1 });
        });

        const slideTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: story,
            start: 'top top',
            end: `+=${(slides.length - 1) * 90}%`,
            scrub: 0.7,
            pin: storyFrame,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const activeIndex = Math.min(slides.length - 1, Math.round(self.progress * (slides.length - 1)));
              if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
              if (progressBar) gsap.set(progressBar, { scaleX: Math.max(0.08, self.progress) });
            }
          }
        });

        slides.forEach((slide, index) => {
          if (index === 0) return;
          const at = index - 1;
          const prevSlide = slides[index - 1];
          const nextImg = slide.querySelector('.story-media img');
          const copyNodes = slide.querySelectorAll('.story-copy .eyebrow, .story-year, .story-copy h2, .story-description');

          slideTimeline
            .to(prevSlide, { scale: 0.94, yPercent: -3, filter: 'brightness(0.42)', duration: 1, ease: 'power1.inOut' }, at)
            .fromTo(slide, { yPercent: 100 }, { yPercent: 0, duration: 1, ease: 'power2.out' }, at)
            .fromTo(nextImg, { scale: 1.1 }, { scale: 1, duration: 1, ease: 'power2.out' }, at)
            .fromTo(copyNodes, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.55, ease: 'power3.out' }, at + 0.35);
        });
      }
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else {
    document.querySelector('.scroll-story')?.classList.add('story-static');
  }
})();
