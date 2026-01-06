import { AuthService } from './modules/AuthService.js';
import { DriveService } from './modules/DriveService.js';
import { GeneratorService } from './modules/GeneratorService.js';
import { UIService } from './modules/UIService.js';
import * as Data from './modules/Data.js';

class LetterGeneratorApp {
    constructor() {
        // Configuration
        this.config = {
            googleClientId: '15549700374-urha9ddap4kb61q6is6n95kq752p2g12.apps.googleusercontent.com',
            googleApiKey: 'AIzaSyD9XSsffQgsVc2oRJl0BFHYpyx4SkFwd8s',
            templateRootId: '1Ah7Hke5-O2oWa--8LlxhH3ZI7e29qGho',
            gasUploadUrl: 'https://script.google.com/macros/s/AKfycbyqMPDH3Ci3uQeS2iNWjyAfScwLKihHUOFUSOQ2Wvklyz4O3NrPfv8LU49w-B_kkFip/exec',
            // Supabase config is global window.SUPABASE_URL provided by env/script
            supabaseUrl: window.SUPABASE_URL,
            supabaseKey: window.SUPABASE_ANON_KEY
        };

        // Services
        this.ui = new UIService();
        this.auth = new AuthService({
            supabaseUrl: this.config.supabaseUrl,
            supabaseKey: this.config.supabaseKey,
            googleClientId: this.config.googleClientId
        });
        this.drive = new DriveService(this.config.googleApiKey, this.config.gasUploadUrl);
        this.generator = new GeneratorService(this.drive, this.config.templateRootId);

        // State
        this.generatedResults = [];
        this.facilitators = [];
        this.usersData = [];
    }

    async init() {
        try {
            this.ui.initializeAnimations();
            this.ui.populateSelect("waktuPelaksanaan", Data.timeSlots, "-- Pilih Waktu --");
            this.populateBTSPrograms();
            this.setupEventListeners();

            // LISTEN FOR PARENT SESSION (Robust Fix)
            window.addEventListener("message", (event) => {
                if (event.data && event.data.type === "SYNC_USER") {
                    console.log("[LetterGen] Syncing user from parent:", event.data.user?.username);
                    this.auth.currentUser = event.data.user;
                    this.ui.hideLoginModal();
                    this.ui.showNotification(`Sesi tersinkronisasi: ${event.data.user.username}`, "success");
                    this.refreshUI();
                    // Load protected data now that we have a user
                    if (!this.usersData || this.usersData.length === 0) this.loadInitialData();
                }
            });

            // CHECK LOCAL STORAGE FALLBACK
            const existingUserStr = localStorage.getItem("odt_user");
            if (existingUserStr) {
                try {
                    const existingUser = JSON.parse(existingUserStr);
                    this.auth.currentUser = existingUser;
                    // We don't hide modal here immediately if we wait for postMessage, 
                    // BUT for speed let's trust it.
                    console.log("[LetterGen] Found local session");
                } catch (e) { }
            }

            // DECIDE LOGIN MODAL STATE
            if (this.auth.currentUser) {
                this.ui.hideLoginModal();
                this.loadInitialData();
            } else {
                // Wait a short moment for PostMessage, otherwise show login
                // Or just show it, and PostMessage will hide it rapidly.
                this.ui.showLoginModal();
            }

            // Initialize Auth (Google)
            this.auth.initGoogleAuth("https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly", (token) => {
                console.log("Google Auth Success");
            });

            // Initial UI Refresh
            this.ui.updateProgressBar();
            this.refreshUI();

        } catch (e) {
            console.error("Initialization Error:", e);
            this.ui.showNotification("Gagal inisialisasi aplikasi.", "error");
        }
    }

    async loadInitialData() {
        // Parallel fetch
        const [facilitators, users] = await Promise.all([
            this.auth.fetchFacilitators(),
            this.auth.fetchUsers()
        ]);

        this.facilitators = facilitators.length > 0 ? facilitators : Data.facilitators; // Fallback to mock
        this.usersData = users;

        // Populate Facilitator Dropdowns
        this.populateFacilitators();

        // Populate Recipient Dropdown
        this.populateRecipients();
    }

    setupEventListeners() {
        const add = (id, evt, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(evt, fn);
        };

        // Form Visibility Triggers
        const triggers = [
            "jenisSurat", "sifatSurat", "jenisKurikulum",
            "lingkupInternal", "lingkupEksternal",
            "varianIndividu", "varianPenugasan", "varianKelompok",
            "jumlahBTS", "jumlahFasilitator"
        ];
        triggers.forEach(id => add(id, "change", () => this.refreshUI()));

        // BTS Dynamic Triggers
        [1, 2, 3].forEach(i => add(`btsPelatihan${i}`, "change", () => this.refreshUI()));
        [1, 2, 3].forEach(i => add(`namaFasilitator${i}`, "change", () => this.refreshUI())); // Should handle autofill company

        // Actions
        add("generateBtn", "click", () => this.handleGenerate());
        add("resetBtn", "click", () => window.location.reload()); // Simple reset

        // Login
        add("loginBtn", "click", () => this.handleLogin());
        document.getElementById("loginPassword")?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.handleLogin();
        });

        // Forgot Password
        add("forgotPasswordBtnLink", "click", () => this.ui.showForgotPasswordModal());
        add("backToLoginBtn", "click", () => {
            this.ui.hideForgotPasswordModal();
            this.ui.showLoginModal();
        });
        add("sendResetBtn", "click", () => this.handleSendResetLink());

        // Password Toggle
        const toggleBtn = document.getElementById("togglePasswordBtn");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                const input = document.getElementById("loginPassword");
                const eyeOpen = document.getElementById("eyeIconOpen");
                const eyeClosed = document.getElementById("eyeIconClosed");
                if (input.type === "password") {
                    input.type = "text";
                    eyeOpen.classList.remove("hidden");
                    eyeClosed.classList.add("hidden");
                } else {
                    input.type = "password";
                    eyeOpen.classList.add("hidden");
                    eyeClosed.classList.remove("hidden");
                }
            });
        }

        // Modal Actions
        add("modalPreviewBtn", "click", () => this.handlePreview());
        add("modalSendBtn", "click", () => this.handleSendToTask());
        add("modalDownloadBtn", "click", () => this.handleDownload());
        add("closeSuccessBtn", "click", () => this.ui.hideSuccessModal());
        add("closeWarningBtn", "click", () => this.ui.hideWarningModal());

        // Input Saving
        document.querySelectorAll("input, select, textarea").forEach(el => {
            el.addEventListener("change", () => this.ui.updateProgressBar());
            el.addEventListener("input", () => this.ui.updateProgressBar());
        });
    }

    // --- LOGIC ---

    async handleLogin() {
        const u = document.getElementById("loginUsername")?.value?.trim();
        const p = document.getElementById("loginPassword")?.value;
        const err = document.getElementById("loginError");
        const btn = document.getElementById("loginBtn");

        if (!u || !p) {
            if (err) { err.querySelector("span").textContent = "Mohon isi username & password."; err.classList.remove("hidden"); }
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = "Verifikasi..."; }
        if (err) err.classList.add("hidden");

        try {
            const user = await this.auth.login(u, p);
            this.ui.hideLoginModal();
            this.ui.showNotification(`Selamat datang, ${user.username}!`, "success");

            // Trigger background reload if data was missing
            if (!this.usersData || this.usersData.length === 0) this.loadInitialData();

        } catch (e) {
            if (err) {
                err.querySelector("span").textContent = e.message || "Login gagal.";
                err.classList.remove("hidden");
            }
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = "Masuk"; }
        }
    }

    async handleSendResetLink() {
        const input = document.getElementById("forgotInput")?.value?.trim();
        const msg = document.getElementById("forgotMessage");
        const btn = document.getElementById("sendResetBtn");

        if (!input) {
            msg.textContent = "Mohon isi email/HP.";
            msg.className = "text-xs p-2 rounded text-center bg-red-100 text-red-600 block";
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = "Memproses..."; }

        try {
            await this.auth.sendResetLink(input);
            msg.textContent = `Link reset telah dikirim ke ${input}.`;
            msg.className = "text-xs p-2 rounded text-center bg-green-100 text-green-600 block";
        } catch (e) {
            msg.textContent = e.message;
            msg.className = "text-xs p-2 rounded text-center bg-red-100 text-red-600 block";
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = "Kirim Link Reset"; }
        }
    }

    async handleGenerate() {
        const formData = this.collectFormData();

        // Validation (Simple for now, relies on required attribs mostly, 
        // but we should use the rules from Data.js if stricter validation needed)
        // For brevity, using basic check
        if (!this.auth.getCurrentUser()) {
            this.ui.showNotification("Sesi habis. Silakan login kembali.", "error");
            this.ui.showLoginModal();
            return;
        }

        this.ui.showLoadingModal();
        this.generatedResults = [];

        try {
            // Determine Scopes
            const scopes = [];
            if (formData.lingkupInternal) scopes.push("internal");
            if (formData.lingkupEksternal) scopes.push("eksternal");
            if (scopes.length === 0) scopes.push("internal");

            // Look up Facilitator Institutions
            // formData only has names (namaFasilitator1, etc.)
            // We need to find the matching 'perusahaan' from this.facilitators
            [1, 2, 3].forEach(i => {
                const name = formData[`namaFasilitator${i}`];
                if (name && Array.isArray(this.facilitators)) {
                    // Try to find case-insensitive match just in case
                    const f = this.facilitators.find(obj => obj.nama && obj.nama.toLowerCase() === name.toLowerCase());

                    if (f) {
                        // Check multiple possible column names for institution
                        const instansi = f.perusahaan || f.instansi || f.institution || f.agency || "";
                        if (!instansi) console.warn(`[Generator] Warning: No institution found for facilitator ${name}`, f);
                        formData[`instansiFasilitator${i}`] = instansi;
                    } else {
                        console.warn(`[Generator] Warning: Facilitator not found in data for name: ${name}`);
                        formData[`instansiFasilitator${i}`] = "";
                    }
                }
            });

            // Generate
            for (const scope of scopes) {
                const res = await this.generator.generateLetter(formData, scope, this.auth.getCurrentUser());
                this.generatedResults.push(res);
            }

            this.ui.hideLoadingModal();
            this.ui.showSuccessModal();

        } catch (e) {
            this.ui.hideLoadingModal();
            console.error(e);
            this.ui.showNotification("Gagal: " + e.message, "error");
        }
    }

    handlePreview() {
        if (this.generatedResults.length > 0) {
            this.generatedResults.forEach(res => {
                if (res.url) window.open(res.url, "_blank");
            });
        }
    }

    handleDownload() {
        if (this.generatedResults.length > 0) {
            this.generatedResults.forEach(res => {
                if (res.blob) window.saveAs(res.blob, res.filename);
            });
            this.ui.showNotification("Mulai mengunduh...", "success");
        }
    }

    handleSendToTask() {
        if (this.generatedResults.length === 0) return;

        const recipientId = document.getElementById("recipientSelect")?.value;
        const recipient = this.usersData?.find(u => u.email === recipientId)
            ? {
                id: recipientId,
                name: this.usersData.find(u => u.email === recipientId).username,
                channel: "Komentar"
            }
            : null;

        let message = "Surat telah dibuat. Link GDrive:\n";
        let primaryUrl = "";

        this.generatedResults.forEach(res => {
            message += `- ${res.filename}: ${res.url}\n`;
            if (!primaryUrl) primaryUrl = res.url;
        });

        // Post Message to parent (React App)
        window.parent.postMessage({
            type: "SEND_GENERATED_LETTER",
            payload: {
                filename: this.generatedResults[0].filename, // Use first as primary
                fileUrl: primaryUrl,
                message: message,
                recipient: recipient
            }
        }, "*");

        this.ui.showNotification("Link dikirim ke sistem utama!", "success");
    }

    // --- DOM HELPERS ---

    collectFormData() {
        const formData = {};
        document.querySelectorAll("input, select, textarea").forEach(el => {
            if (el.type === "checkbox") formData[el.id] = el.checked;
            else if (el.type === "radio") { if (el.checked) formData[el.name] = el.value; }
            else formData[el.id] = el.value;
        });
        return formData;
    }

    populateFacilitators() {
        const list = this.facilitators.map(f => ({ value: f.nama, text: f.nama }));
        [1, 2, 3].forEach(i => {
            this.ui.populateSelect(`namaFasilitator${i}`, list, "-- Pilih Fasilitator --");
        });
    }

    populateRecipients() {
        if (!this.usersData) return;
        const list = this.usersData.map(u => ({
            value: u.email,
            text: `${u.username} (${u.position} - ${u.team})`
        }));
        this.ui.populateSelect("recipientSelect", list, "Pilih penerima (opsional)");
    }

    populateBTSPrograms() {
        const progs = Object.keys(Data.btsTrainingPrograms);
        const list = progs.map(p => ({ value: p, text: p }));
        [1, 2, 3].forEach(i => {
            this.ui.populateSelect(`btsPelatihan${i}`, list, "-- Pilih Pelatihan --");
        });
    }

    refreshUI() {
        this.ui.updateProgressBar();

        // --- Facilitator Section Visibility ---
        const isExternal = document.getElementById("lingkupEksternal")?.checked;
        const hasLettterType = !!document.getElementById("jenisSurat")?.value;
        const showFacilitators = hasLettterType && isExternal;

        const facSec = document.getElementById("facilitatorSection");
        if (showFacilitators) {
            this.ui.showSection(facSec);

            // Ensure 'Jumlah Fasilitator' dropdown is visible ONLY if Kelompok
            const isKelompok = document.getElementById("varianKelompok")?.checked;
            const jfSec = document.getElementById("jumlahFasilitatorSection");

            let effectiveNum = 1;

            if (isKelompok) {
                this.ui.showSection(jfSec);
                const val = parseInt(document.getElementById("jumlahFasilitator")?.value);
                effectiveNum = isNaN(val) ? 0 : val; // If unselected, usually 0 or logic handles it
            } else {
                this.ui.hideSection(jfSec);
                effectiveNum = 1; // Force 1 if not Kelompok
            }

            // Always show Fasilitator 1 by default if section is active (Minimum 1)
            this.ui.showSection(document.getElementById("fasilitator1Section"));

            // Handle 2 & 3
            const f2 = document.getElementById("fasilitator2Section");
            const f3 = document.getElementById("fasilitator3Section");

            if (effectiveNum >= 2) this.ui.showSection(f2); else this.ui.hideSection(f2);
            if (effectiveNum >= 3) this.ui.showSection(f3); else this.ui.hideSection(f3);

            // Handle Variants & Institution
            const vp = document.getElementById("varianPenugasan")?.checked;
            const instSec = document.getElementById("institutionSection");
            if (vp) this.ui.showSection(instSec); else this.ui.hideSection(instSec);

            // Also toggle inputs inside just in case (though section toggle handles visuals)
            this.ui.setFieldVisible("pimpinan", vp);
            this.ui.setFieldVisible("instansi", vp);

        } else {
            this.ui.hideSection(facSec);
        }

        // --- Existing Logic for Mitra / Topik ---
        const js = document.getElementById("jenisSurat")?.value;
        const jk = document.getElementById("jenisKurikulum")?.value;
        const hideMitra = js === "Bahan Tayang Standar" || (js === "Kurikulum Silabus" && jk === "ECP");

        this.ui.setFieldVisible("mitraKerjasama", !hideMitra);
        this.ui.setFieldVisible("topikRapat", !hideMitra);

        // --- Curriculum vs BTS Sections ---
        const curSec = document.getElementById("curriculumSection");
        const btsSec = document.getElementById("btsSection");

        if (js === "Kurikulum Silabus") {
            this.ui.showSection(curSec);
            this.ui.hideSection(btsSec);

            // Sub-sections for Curriculum
            const perihalSec = document.getElementById("perihalKPKSection");
            const ecpSec = document.getElementById("tahapECPSection");

            if (jk === "KPK") this.ui.showSection(perihalSec); else this.ui.hideSection(perihalSec);
            if (jk === "ECP") this.ui.showSection(ecpSec); else this.ui.hideSection(ecpSec);

        } else if (js === "Bahan Tayang Standar") {
            this.ui.hideSection(curSec);
            this.ui.showSection(btsSec);
            const num = parseInt(document.getElementById("jumlahBTS")?.value) || 0;
            [1, 2, 3].forEach(i => {
                const el = document.getElementById(`bts${i}Section`);
                if (i <= num) this.ui.showSection(el); else this.ui.hideSection(el);
            });
        } else {
            this.ui.hideSection(curSec);
            this.ui.hideSection(btsSec);
        }
    }
}

// Initialize
window.app = new LetterGeneratorApp();
document.addEventListener("DOMContentLoaded", () => window.app.init());
