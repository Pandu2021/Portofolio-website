document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const primaryNav = document.getElementById('primary-nav');
    const navOverlay = document.getElementById('navOverlay');
    const header = document.querySelector('.header');
    const backToTop = document.getElementById('backToTop');
    const yearEl = document.getElementById('year');

    const updateThemeIcon = (mode) => {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        icon.classList.toggle('fa-sun', mode === 'dark');
        icon.classList.toggle('fa-moon', mode !== 'dark');
    };

    const setTheme = (mode) => {
        root.classList.toggle('dark', mode === 'dark');
        updateThemeIcon(mode);
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
            themeToggle.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        try {
            localStorage.setItem('theme', mode);
        } catch {
            // Ignore storage failure.
        }
    };

    try {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') {
            setTheme(stored);
        } else {
            setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
    } catch {
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextMode = root.classList.contains('dark') ? 'light' : 'dark';
            setTheme(nextMode);
        });
    }

    const setExpanded = (expanded) => {
        if (!menuToggle || !primaryNav) return;
        menuToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        primaryNav.classList.toggle('open', expanded);
        if (navOverlay) {
            navOverlay.classList.toggle('show', expanded);
            navOverlay.setAttribute('aria-hidden', expanded ? 'false' : 'true');
        }
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !expanded);
            icon.classList.toggle('fa-xmark', expanded);
        }
    };

    if (menuToggle && primaryNav) {
        menuToggle.addEventListener('click', () => {
            const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
            setExpanded(!isOpen);
        });

        primaryNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setExpanded(false));
        });

        if (navOverlay) {
            navOverlay.addEventListener('click', () => setExpanded(false));
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') setExpanded(false);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 920) setExpanded(false);
        });
    }

    const onScrollUI = () => {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 12);
        }
        if (backToTop) {
            backToTop.classList.toggle('show', window.scrollY > 340);
        }
    };

    window.addEventListener('scroll', onScrollUI, { passive: true });
    onScrollUI();

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href || href.length < 2) return;
            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            const headerOffset = 78;
            const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
        });
    });

    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navAnchors = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));

    const setActiveLink = () => {
        if (!sections.length || !navAnchors.length) return;
        const marker = window.pageYOffset + 128;
        let currentSectionId = sections[0].id;

        sections.forEach((section) => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            if (marker >= top && marker < bottom) {
                currentSectionId = section.id;
            }
        });

        navAnchors.forEach((anchor) => {
            const id = anchor.getAttribute('href').slice(1);
            const isCurrent = id === currentSectionId;
            anchor.classList.toggle('active', isCurrent);
            if (isCurrent) anchor.setAttribute('aria-current', 'page');
            else anchor.removeAttribute('aria-current');
        });
    };

    window.addEventListener('scroll', setActiveLink, { passive: true });
    setActiveLink();

    const revealEls = document.querySelectorAll('.reveal');
    revealEls.forEach((element, index) => {
        element.style.transitionDelay = `${Math.min(index * 40, 180)}ms`;
    });

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12 });

        revealEls.forEach((element) => revealObserver.observe(element));
    } else {
        revealEls.forEach((element) => element.classList.add('visible'));
    }

    const counters = document.querySelectorAll('[data-count]');
    const animateCount = (element) => {
        const target = Number(element.getAttribute('data-count'));
        const suffix = element.getAttribute('data-suffix') || '';
        if (!Number.isFinite(target)) return;

        if (prefersReducedMotion) {
            element.textContent = `${target}${suffix}`;
            return;
        }

        const duration = 1200;
        const startTime = performance.now();

        const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const value = Math.floor(progress * target);
            element.textContent = `${value}${suffix}`;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = `${target}${suffix}`;
            }
        };

        requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                animateCount(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.4 });
        counters.forEach((counter) => counterObserver.observe(counter));
    } else {
        counters.forEach((counter) => animateCount(counter));
    }

    const typedEl = document.getElementById('hero-typed');
    if (typedEl) {
        const words = [
            'scalable digital products',
            'data-driven business systems',
            'secure and modern web platforms'
        ];

        if (prefersReducedMotion) {
            typedEl.textContent = words[0];
        } else {
            let wordIndex = 0;
            let charIndex = 0;
            let deleting = false;

            const typeLoop = () => {
                const currentWord = words[wordIndex];
                if (!deleting) {
                    charIndex += 1;
                    typedEl.textContent = currentWord.slice(0, charIndex);
                    if (charIndex === currentWord.length) {
                        deleting = true;
                        window.setTimeout(typeLoop, 1200);
                        return;
                    }
                } else {
                    charIndex -= 1;
                    typedEl.textContent = currentWord.slice(0, charIndex);
                    if (charIndex === 0) {
                        deleting = false;
                        wordIndex = (wordIndex + 1) % words.length;
                    }
                }

                const speed = deleting ? 45 : 75;
                window.setTimeout(typeLoop, speed);
            };

            typedEl.textContent = '';
            window.setTimeout(typeLoop, 380);
        }
    }

    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const portfolioItems = Array.from(document.querySelectorAll('.portfolio-item'));
    const emptyState = document.getElementById('portfolio-empty');

    const applyPortfolioFilter = (filter) => {
        let visibleCount = 0;

        portfolioItems.forEach((item) => {
            const categories = (item.dataset.category || '').split(/\s+/).filter(Boolean);
            const visible = filter === 'all' || categories.includes(filter);
            item.hidden = !visible;
            if (visible) visibleCount += 1;
        });

        if (emptyState) {
            emptyState.hidden = visibleCount !== 0;
        }
    };

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter || 'all';
            filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
            applyPortfolioFilter(filter);
        });
    });

    applyPortfolioFilter('all');

    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    const updateFormStatus = (message, type = 'info') => {
        if (!formStatus) return;
        formStatus.textContent = message;
        formStatus.classList.remove('status-info', 'status-success', 'status-error');
        formStatus.classList.add(`status-${type}`);
    };

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.getElementById('name')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            const message = document.getElementById('message')?.value.trim() || '';

            if (!name || !email || !message) {
                updateFormStatus('Please complete all required fields.', 'error');
                return;
            }

            const action = contactForm.getAttribute('action');
            if (!action) {
                updateFormStatus('Contact form backend is not connected yet. Please use LinkedIn or Upwork for now.', 'info');
                return;
            }

            updateFormStatus('Sending your message...', 'info');

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: {
                        Accept: 'application/json'
                    }
                });

                if (!response.ok) {
                    let errorMessage = 'Failed to send message. Please try again.';
                    try {
                        const result = await response.json();
                        if (result && result.error) errorMessage = `Failed to send: ${result.error}`;
                    } catch {
                        // Keep default error message.
                    }
                    updateFormStatus(errorMessage, 'error');
                    return;
                }

                contactForm.reset();
                updateFormStatus('Thank you. Your message has been sent successfully.', 'success');
            } catch {
                updateFormStatus('Network issue occurred while sending. Please try again later.', 'error');
            }
        });
    }
});