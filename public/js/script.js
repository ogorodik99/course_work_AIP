document.addEventListener("DOMContentLoaded", () => {
    // ===== Scroll animations =====
    const animatedElements = document.querySelectorAll(".hidden-fade, .hidden-slide");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show-anim");
                }
            });
        },
        { threshold: 0.15 }
    );

    animatedElements.forEach((el) => observer.observe(el));

    // ===== Navbar scroll effect =====
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        });
    }

    // ===== Smooth scroll for anchor links =====
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});
