export class UIService {
    constructor() {
        this.progressBar = document.getElementById("progressBar");
    }

    initializeAnimations() {
        if (window.Typed && document.getElementById("typewriter")) {
            new Typed("#typewriter", {
                strings: ["Aplikasi Pembuatan Surat Dinas", "Profesional & Terintegrasi"],
                typeSpeed: 50, backSpeed: 30, backDelay: 3000, loop: true, cursorChar: "|", autoInsertCss: true,
            });
        }

        if (window.anime) {
            anime({
                targets: '.form-section, .form-control, .btn-primary, .btn-secondary',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: anime.stagger(50),
                easing: 'easeOutQuad',
                duration: 800
            });
        }

        if (window.Splitting) Splitting();
    }

    updateProgressBar() {
        if (!this.progressBar) return;
        const form = document.getElementById("letterForm");
        if (!form) return;

        const inputs = form.querySelectorAll("input, select");
        let filled = 0;
        let total = 0;

        inputs.forEach(input => {
            if (input.offsetParent !== null && input.hasAttribute("required")) { // Visible and required
                total++;
                if (input.value.trim() !== "") filled++;
            }
        });

        const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
        this.progressBar.style.width = pct + "%";
    }

    // --- MODALS ---
    showModal(id) {
        const m = document.getElementById(id);
        if (m) {
            m.classList.remove("hidden");

            // Check for inner card with ID {id}Card for specific animations
            const card = document.getElementById(`${id}Card`);

            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                m.classList.remove("opacity-0");
                m.classList.remove("scale-90"); // For modals that animate self

                if (card) {
                    card.classList.remove("opacity-0");
                    card.classList.remove("scale-90");
                }
            }, 10);
        }
    }

    hideModal(id) {
        const m = document.getElementById(id);
        if (m) {
            m.classList.add("opacity-0");
            m.classList.add("scale-90");

            const card = document.getElementById(`${id}Card`);
            if (card) {
                card.classList.add("opacity-0");
                card.classList.add("scale-90");
            }

            setTimeout(() => m.classList.add("hidden"), 300);
        }
    }

    showLoginModal() { this.showModal("loginModal"); }
    hideLoginModal() { this.hideModal("loginModal"); }

    showForgotPasswordModal() {
        this.hideLoginModal();
        this.showModal("forgotPasswordModal");
        const msg = document.getElementById("forgotMessage");
        const input = document.getElementById("forgotInput");
        if (msg) { msg.classList.add("hidden"); msg.textContent = ""; msg.className = "text-xs hidden p-2 rounded text-center"; }
        if (input) input.value = "";
    }

    hideForgotPasswordModal() { this.hideModal("forgotPasswordModal"); }

    showLoadingModal(msg = "Memproses...") {
        const m = document.getElementById("loadingModal");
        if (m) {
            const p = m.querySelector("p");
            if (p) p.textContent = msg;
            m.classList.remove("hidden");
        }
    }
    hideLoadingModal() {
        const m = document.getElementById("loadingModal");
        if (m) m.classList.add("hidden");
    }

    showSuccessModal() { this.showModal("successModal"); }
    hideSuccessModal() { this.hideModal("successModal"); }

    showWarningModal(missingFields) {
        const list = document.getElementById("warningList");
        if (list) {
            list.innerHTML = "";
            missingFields.forEach(field => {
                const li = document.createElement("li");
                li.textContent = `• ${field}`;
                list.appendChild(li);
            });
        }
        this.showModal("warningModal");
    }
    hideWarningModal() { this.hideModal("warningModal"); }

    showPreviewModal() { this.showModal("previewModal"); }
    hidePreviewModal() { this.hideModal("previewModal"); }

    showNotification(message, type = "info") {
        // Simple toast implementation or use existing if any
        // Reusing standard alert for now if no custom toast in index.html, 
        // BUT main.js had a showNotification implementation? 
        // Let's create a DOM element for it if it doesn't exist or use alert fallback.
        // Looking at main.js previously, I didn't see a complex toast logic in the snippet.
        // Wait, looking at index.html... there isn't a toast container. 
        // I will stick to a simple alert OR inject a notification div.

        // Let's inject a nice toast
        const div = document.createElement("div");
        div.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg text-white font-semibold z-[200] transform transition-all duration-500 translate-y-10 opacity-0 ${type === "error" ? "bg-red-600" : type === "success" ? "bg-green-600" : "bg-blue-600"}`;
        div.textContent = message;
        document.body.appendChild(div);

        // Animate in
        requestAnimationFrame(() => {
            div.classList.remove("translate-y-10", "opacity-0");
        });

        // Remove after 3s
        setTimeout(() => {
            div.classList.add("translate-y-10", "opacity-0");
            setTimeout(() => div.remove(), 500);
        }, 3000);
    }

    // --- VISIBILITY RULES ---
    setFieldVisible(id, isVisible) {
        const el = document.getElementById(id);
        if (!el) return;
        const container = el.closest('div'); // Assuming wrapped in div
        if (container) {
            if (isVisible) container.classList.remove("hidden");
            else container.classList.add("hidden");
        }
    }

    showSection(el) {
        if (!el) return;
        el.classList.remove("section-hidden");
        el.classList.add("section-visible");
        el.classList.remove("hidden"); // Ensure tailwind hidden is removed
    }

    hideSection(el) {
        if (!el) return;
        el.classList.remove("section-visible");
        el.classList.add("section-hidden");
        // We don't add "hidden" immediately to allow transition, 
        // but for layout flow, section-hidden max-height:0 handles it.
    }

    populateSelect(id, options, placeholder = "-- Pilih --") {
        const el = document.getElementById(id);
        if (!el) return;
        const currentVal = el.value;
        el.innerHTML = `<option value="">${placeholder}</option>`;
        options.forEach(opt => {
            const o = document.createElement("option");
            o.value = opt.value || opt.nama || opt;
            o.textContent = opt.text || opt.nama || opt;
            el.appendChild(o);
        });
        if (currentVal) el.value = currentVal;
    }
}
