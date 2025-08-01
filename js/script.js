document.addEventListener('DOMContentLoaded', function() {
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