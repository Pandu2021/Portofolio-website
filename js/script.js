document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle (dark/light)
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;

    const updateThemeIcon = (mode) => {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        icon.classList.toggle('fa-sun', mode === 'dark');
        icon.classList.toggle('fa-moon', mode !== 'dark');
    };

    const setTheme = (mode) => {
        root.classList.toggle('dark', mode === 'dark');
        try { localStorage.setItem('theme', mode); } catch {}
        updateThemeIcon(mode);
        if (themeToggle) themeToggle.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
    };

    let storedTheme = null;
    try { storedTheme = localStorage.getItem('theme'); } catch {}
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = root.classList.contains('dark') ? 'light' : 'dark';
            setTheme(next);
        });
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const primaryNav = document.getElementById('primary-nav');
    const navOverlay = document.getElementById('navOverlay');
    if (menuToggle && primaryNav) {
        const setExpanded = (expanded) => {
            menuToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            primaryNav.classList.toggle('open', !!expanded);
            if (navOverlay) navOverlay.classList.toggle('show', !!expanded);
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !expanded);
                icon.classList.toggle('fa-xmark', !!expanded);
            }
        };
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            setExpanded(!expanded);
        });
        // Close on link click (for single-page nav)
        primaryNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setExpanded(false)));
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setExpanded(false);
        });
        // Close on overlay click
        if (navOverlay) navOverlay.addEventListener('click', () => setExpanded(false));
    }

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        const onScroll = () => {
            if (window.scrollY > 300) backToTop.classList.add('show');
            else backToTop.classList.remove('show');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Fungsi untuk smooth scrolling saat mengklik tautan navigasi
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active link highlighting on scroll
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const navAnchors = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
    const setActive = () => {
        const scrollY = window.pageYOffset + 100; // header offset
        let currentId = sections[0] ? sections[0].id : '';
        sections.forEach(sec => {
            const top = sec.offsetTop;
            const bottom = top + sec.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
                currentId = sec.id;
            }
        });
        navAnchors.forEach(a => {
            const hrefId = a.getAttribute('href').substring(1);
            a.classList.toggle('active', hrefId === currentId);
            if (hrefId === currentId) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
    };
    window.addEventListener('scroll', setActive, { passive: true });
    setActive();

    // Reveal sections on scroll
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach(el => obs.observe(el));
    } else {
        // Fallback: show immediately
        revealEls.forEach(el => el.classList.add('visible'));
    }

    // Dynamic footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Handle form submission
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Sederhana validasi
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !message) {
                formStatus.textContent = 'Silakan isi semua kolom.';
                formStatus.style.color = '#dc3545';
                return;
            }

            formStatus.textContent = 'Pesan Anda sedang dikirim...';
            formStatus.style.color = '#007bff';

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    formStatus.textContent = 'Terima kasih! Pesan Anda telah terkirim.';
                    formStatus.style.color = '#28a745';
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    if (data.error) {
                        formStatus.textContent = `Gagal mengirim: ${data.error}`;
                    } else {
                        formStatus.textContent = 'Gagal mengirim pesan. Silakan coba lagi.';
                    }
                    formStatus.style.color = '#dc3545';
                }
            } catch (error) {
                formStatus.textContent = 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.';
                formStatus.style.color = '#dc3545';
            }
        });
    }
});