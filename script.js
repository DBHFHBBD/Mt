document.addEventListener('DOMContentLoaded', () => {

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to animate
    const animateElements = document.querySelectorAll('.hero-content, .glass-card, .showcase-text, .showcase-img, .banner-content, .testimonial-card, .spec-item');

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
    });

    // Add visible class styling dynamically
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(styleSheet);

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple "Buy" Button Interaction & Validation
    const buyButtons = document.querySelectorAll('.cta-button-pulse, .cta-button-small');
    const colorError = document.getElementById('color-error');

    buyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Check if it's the main buy button that goes to checkout
            if (btn.id === 'btn-comprar' || btn.getAttribute('href') === 'https://go.plataformafortpay.com.br/akfsugc784') {
                const selectedColor = document.querySelector('input[name="product-color"]:checked');

                if (!selectedColor) {
                    e.preventDefault(); // Stop redirection
                    if (colorError) {
                        colorError.style.display = 'block';
                        // Scroll to options if far
                        const container = document.querySelector('.color-selection-container');
                        if (container) {
                            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                    return; // Stop execution
                } else {
                    if (colorError) colorError.style.display = 'none';
                    // In a real scenario, you might append the parameter to the URL here
                    // const checkoutUrl = new URL(btn.getAttribute('href'));
                    // checkoutUrl.searchParams.set('cor', selectedColor.value);
                    // window.open(checkoutUrl.toString(), '_blank');
                }
            }

            if (btn.getAttribute('onclick')) return; // let inline onclick work for demo

            // Add a ripple effect or simple feedback
            setTimeout(() => {
                btn.style.transform = '';
            }, 100);

        });
    });

    // FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        questionBtn.addEventListener('click', () => {
            // Close other items (optional, remove if you want multiple open at once)
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Hide error when a color is clicked
    const colorInputs = document.querySelectorAll('input[name="product-color"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (colorError) colorError.style.display = 'none';
        });
    });

    // Hover effect for 3D card (Mouse movement tracking)
    const card = document.querySelector('.holo-card');
    const heroSection = document.querySelector('.hero-section');

    if (card && heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
            card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });

        heroSection.addEventListener('mouseenter', (e) => {
            card.style.transition = "none";
        });

        heroSection.addEventListener('mouseleave', (e) => {
            card.style.transition = "all 0.5s ease";
            card.style.transform = `rotateY(0deg) rotateX(0deg)`;
        });
    }
    // CEP Auto-fill

});


