// Main JavaScript for Template Letter Generator
// Handles all form interactions, validation, and document generation

class LetterGenerator {
  constructor() {
    this.formData = {};
    this.isGenerating = false;
    this.init().catch((err) => console.error("Init error:", err));
  }

  // Safe wrapper: if anime.js failed to load, don't crash the app.
  safeAnime(config) {
    try {
      if (window.anime) return window.this.safeAnime(config);
      // Minimal fallback for common cases (progress bar / simple show/hide)
      const targets = config?.targets;
      const applyWidth = config?.width;
      if (targets && applyWidth != null) {
        const els =
          typeof targets === "string"
            ? Array.from(document.querySelectorAll(targets))
            : targets instanceof Element
            ? [targets]
            : Array.isArray(targets)
            ? targets
            : [];
        els.forEach((el) => {
          try {
            el.style.width = applyWidth;
          } catch (_) {}
        });
      }
    } catch (_) {}
    return null;
  }

  async init() {
    this.initializeUI();

    // Facilitators
    // - Supabase is the primary source
    // - data.js is fallback ONLY if Supabase fails/unavailable
    this.fallbackFacilitators =
      typeof facilitators !== "undefined" && Array.isArray(facilitators)
        ? facilitators.slice()
        : [];
    this.facilitators = [];
    this.setupEventListeners();
    this.loadFormState();
    this.initializeCharts();
    this.startParticleAnimation();
    this.populateTimeSlots();

    // Populate facilitator dropdowns (Supabase-first, fallback only on failure)
    this.populateFacilitators({ loading: true });
    const loadedFromSupabase = await this.refreshFacilitatorsFromSupabase();
    if (!loadedFromSupabase) {
      this.facilitators = this.fallbackFacilitators.slice();
    }
    this.populateFacilitators();
    this.populateBTSPrograms();
    this.applyVisibilityRules();
  }

  // Initialize UI components
  initializeUI() {
    // Initialize typewriter effect
    if (document.getElementById("typewriter")) {
      new Typed("#typewriter", {
        strings: [
          "Generator Surat Template",
          "Pembuat Dokumen Otomatis",
          "Surat Formal Profesional",
        ],
        typeSpeed: 60,
        backSpeed: 40,
        backDelay: 2000,
        loop: true,
        cursorChar: "|",
        autoInsertCss: true,
      });
    }

    // Initialize splitting.js for text animations
    if (typeof Splitting !== "undefined") {
      Splitting();
    }

    // Initialize progress bar
    this.updateProgressBar();
  }

  // Setup all event listeners
  setupEventListeners() {
    // Main form change listeners
    document
      .getElementById("jenisSurat")
      .addEventListener("change", (e) => this.handleJenisSuratChange(e));
    document
      .getElementById("sifatSurat")
      .addEventListener("change", (e) => this.handleSifatSuratChange(e));
    document
      .getElementById("jenisKurikulum")
      .addEventListener("change", (e) => this.handleJenisKurikulumChange(e));

    // Checkbox listeners
    document
      .getElementById("lingkupInternal")
      .addEventListener("change", () => {
        this.applyVisibilityRules();
        this.updateProgressBar();
        this.saveFormState();
      });
    document
      .getElementById("lingkupEksternal")
      .addEventListener("change", () => {
        this.applyVisibilityRules();
        this.updateProgressBar();
        this.saveFormState();
      });

    // Variant listeners
    document
      .getElementById("varianIndividu")
      .addEventListener("change", () => this.handleVariantChange());
    document
      .getElementById("varianPenugasan")
      .addEventListener("change", () => this.handleVariantChange());
    document
      .getElementById("varianKelompok")
      .addEventListener("change", () => this.handleVariantChange());

    // BTS listeners
    document
      .getElementById("jumlahBTS")
      .addEventListener("change", (e) => this.handleJumlahBTSChange(e));
    document
      .getElementById("btsPelatihan1")
      .addEventListener("change", (e) => this.handleBTSPelatihanChange(e, 1));
    document
      .getElementById("btsPelatihan2")
      .addEventListener("change", (e) => this.handleBTSPelatihanChange(e, 2));
    document
      .getElementById("btsPelatihan3")
      .addEventListener("change", (e) => this.handleBTSPelatihanChange(e, 3));

    // Facilitator listeners
    document
      .getElementById("jumlahFasilitator")
      .addEventListener("change", (e) => this.handleJumlahFasilitatorChange(e));
    document
      .getElementById("namaFasilitator1")
      .addEventListener("change", (e) => this.handleFasilitatorChange(e, 1));
    document
      .getElementById("namaFasilitator2")
      .addEventListener("change", (e) => this.handleFasilitatorChange(e, 2));
    document
      .getElementById("namaFasilitator3")
      .addEventListener("change", (e) => this.handleFasilitatorChange(e, 3));

    // Button listeners
    document
      .getElementById("generateBtn")
      .addEventListener("click", () => this.handleGenerate());
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.handleReset());
    document
      .getElementById("previewBtn")
      .addEventListener("click", () => this.handlePreview());

    // Modal listeners
    document
      .getElementById("closeSuccessBtn")
      .addEventListener("click", () => this.closeSuccessModal());
    document
      .getElementById("downloadBtn")
      .addEventListener("click", () => this.handleDownload());

    // Form field listeners for auto-save
    const formInputs = document.querySelectorAll("input, select, textarea");
    formInputs.forEach((input) => {
      input.addEventListener("change", () => this.saveFormState());
      input.addEventListener("input", () => this.saveFormState());
    });

    // Real-time validation
    formInputs.forEach((input) => {
      input.addEventListener("blur", (e) => this.validateField(e.target));
    });
  }

  // Handle jenis surat change
  handleJenisSuratChange(event) {
    const value = event.target.value;
    const curriculumSection = document.getElementById("curriculumSection");
    const btsSection = document.getElementById("btsSection");

    if (value === "Kurikulum Silabus") {
      this.showSection(curriculumSection);
      this.hideSection(btsSection);
    } else if (value === "Bahan Tayang Standar") {
      this.hideSection(curriculumSection);
      this.showSection(btsSection);
    }

    this.updateProgressBar();
    this.applyVisibilityRules();
    this.saveFormState();
  }

  // Handle sifat surat change
  handleSifatSuratChange(event) {
    const value = event.target.value;
    const facilitatorSection = document.getElementById("facilitatorSection");

    if (value === "undangan") {
      this.showSection(facilitatorSection);
    } else if (value === "hasil") {
      this.hideSection(facilitatorSection);
    }

    this.applyVisibilityRules();
    this.updateProgressBar();
    this.saveFormState();
  }

  // Handle jenis kurikulum change
  handleJenisKurikulumChange(event) {
    const value = event.target.value;
    const perihalKPKSection = document.getElementById("perihalKPKSection");
    const tahapECPSection = document.getElementById("tahapECPSection");

    if (value === "KPK") {
      this.showSection(perihalKPKSection);
      this.hideSection(tahapECPSection);
    } else if (value === "ECP") {
      this.hideSection(perihalKPKSection);
      this.showSection(tahapECPSection);
    } else {
      this.hideSection(perihalKPKSection);
      this.hideSection(tahapECPSection);
    }

    this.updateProgressBar();
    this.applyVisibilityRules();
    this.saveFormState();
  }

  // Handle variant change
  handleVariantChange() {
    const individu = document.getElementById("varianIndividu").checked;
    const penugasan = document.getElementById("varianPenugasan").checked;
    const kelompok = document.getElementById("varianKelompok").checked;

    const jumlahFasilitatorSection = document.getElementById(
      "jumlahFasilitatorSection"
    );
    const institutionSection = document.getElementById("institutionSection");

    if (kelompok) {
      this.showSection(jumlahFasilitatorSection);
    } else {
      this.hideSection(jumlahFasilitatorSection);
    }

    if (penugasan || kelompok) {
      this.showSection(institutionSection);
    } else {
      this.hideSection(institutionSection);
    }

    this.updateFacilitatorFields();
    this.updateProgressBar();
    this.saveFormState();
    this.applyVisibilityRules();
  }

  // Handle jumlah BTS change
  handleJumlahBTSChange(event) {
    const count = parseInt(event.target.value) || 0;

    // Hide all BTS sections first
    for (let i = 1; i <= 3; i++) {
      const section = document.getElementById(`bts${i}Section`);
      this.hideSection(section);
    }

    // Show required sections
    for (let i = 1; i <= count; i++) {
      const section = document.getElementById(`bts${i}Section`);
      this.showSection(section);
    }

    this.updateProgressBar();
    this.saveFormState();
  }

  // Handle BTS pelatihan change
  handleBTSPelatihanChange(event, index) {
    const selectedProgram = event.target.value;
    const materiDropdown = document.getElementById(`btsMateri${index}`);

    // Clear existing options
    materiDropdown.innerHTML = '<option value="">-- Pilih Materi --</option>';

    if (selectedProgram && btsTrainingPrograms[selectedProgram]) {
      btsTrainingPrograms[selectedProgram].forEach((topic) => {
        const option = document.createElement("option");
        option.value = topic;
        option.textContent = topic;
        materiDropdown.appendChild(option);
      });

      // Auto-select first topic
      if (btsTrainingPrograms[selectedProgram].length > 0) {
        materiDropdown.value = btsTrainingPrograms[selectedProgram][0];
      }
    }

    this.updateProgressBar();
    this.saveFormState();
  }

  // Handle jumlah fasilitator change
  handleJumlahFasilitatorChange(event) {
    const count = parseInt(event.target.value) || 0;
    this.updateFacilitatorFields(count);
    this.updateProgressBar();
    this.saveFormState();
  }

  // Update facilitator fields based on count
  updateFacilitatorFields(count = null) {
    if (count === null) {
      const kelompok = document.getElementById("varianKelompok").checked;
      if (kelompok) {
        count =
          parseInt(document.getElementById("jumlahFasilitator").value) || 0;
      } else {
        count = 1; // Default for individu
      }
    }

    // Hide all facilitator sections first
    for (let i = 1; i <= 3; i++) {
      const section = document.getElementById(`fasilitator${i}Section`);
      this.hideSection(section);
    }

    // Show required sections
    for (let i = 1; i <= count; i++) {
      const section = document.getElementById(`fasilitator${i}Section`);
      this.showSection(section);
    }
  }

  // Handle facilitator change
  handleFasilitatorChange(event, index) {
    const selectedName = event.target.value;
    const institutionDiv = document.getElementById(
      `instansiFasilitator${index}`
    );

    if (selectedName) {
      const facilitator = this.facilitators.find(
        (f) => f.nama === selectedName
      );
      if (facilitator) {
        institutionDiv.textContent = `Instansi: ${facilitator.perusahaan}`;
      }
    } else {
      institutionDiv.textContent = "";
    }

    this.updateProgressBar();
    this.saveFormState();
  }

  // Show section with animation
  showSection(element) {
    element.classList.remove("section-hidden");
    element.classList.add("section-visible");

    this.safeAnime({
      targets: element,
      opacity: [0, 1],
      translateY: [-20, 0],
      duration: 500,
      easing: "easeOutQuart",
    });
  }

  // Hide section with animation
  hideSection(element, clear = true) {
    element.classList.remove("section-visible");
    element.classList.add("section-hidden");

    if (clear) {
      this.clearInputsInElement(element);
    }
  }

  // Clear all inputs/selects/textareas inside an element
  clearInputsInElement(element) {
    if (!element) return;

    const inputs = element.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      if (input.type === "checkbox" || input.type === "radio") {
        input.checked = false;
      } else {
        input.value = "";
      }

      const err = document.getElementById(`${input.id}Error`);
      if (err) err.classList.remove("show");
    });

    // Clear facilitator institution labels (these are <div>, not inputs)
    [1, 2, 3].forEach((i) => {
      const div = document.getElementById(`instansiFasilitator${i}`);
      if (div) div.textContent = "";
    });
  }

  // ===== VISIBILITY RULE HELPERS (HIDE instead of DISABLE) =====

  // Find wrapper for a field (prefer `${fieldId}Group`)
  getFieldWrapper(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return null;

    return (
      document.getElementById(`${fieldId}Group`) ||
      input.closest(".form-group") ||
      input.closest(".field-group") ||
      input.parentElement
    );
  }

  // Hide/show a field wrapper, and clear when hidden
  setFieldVisible(fieldId, visible, clearWhenHidden = true) {
    const input = document.getElementById(fieldId);
    const wrapper = this.getFieldWrapper(fieldId);
    if (!input || !wrapper) return;

    wrapper.style.display = visible ? "" : "none";

    if (!visible && clearWhenHidden) {
      if (input.type === "checkbox" || input.type === "radio")
        input.checked = false;
      else input.value = "";

      const err = document.getElementById(`${fieldId}Error`);
      if (err) err.classList.remove("show");
    }
  }

  // Return true if a field is visible (wrapper not hidden)
  isFieldVisible(fieldId) {
    const wrapper = this.getFieldWrapper(fieldId);
    if (!wrapper) return true; // if wrapper missing, assume visible

    // Hidden via wrapper display:none
    if (wrapper.style.display === "none") return false;

    // Hidden via parent section (.section-hidden)
    if (wrapper.closest(".section-hidden")) return false;

    return true;
  }

  // Apply your business rules by hiding fields
  applyVisibilityRules() {
    const jenisSurat = document.getElementById("jenisSurat")?.value || "";
    const jenisKurikulum =
      document.getElementById("jenisKurikulum")?.value || "";

    const sifatSurat = document.getElementById("sifatSurat")?.value || "";

    const lingkupInternal =
      document.getElementById("lingkupInternal")?.checked || false;
    const lingkupEksternal =
      document.getElementById("lingkupEksternal")?.checked || false;
    const isInternalOnly = lingkupInternal && !lingkupEksternal;

    const varianPenugasan =
      document.getElementById("varianPenugasan")?.checked || false;

    // Rule 1 & 2: hide mitraKerjasama + topikRapat
    const hideMitraAndTopik =
      jenisSurat === "Bahan Tayang Standar" ||
      (jenisSurat === "Kurikulum Silabus" && jenisKurikulum === "ECP");

    this.setFieldVisible("mitraKerjasama", !hideMitraAndTopik, true);
    this.setFieldVisible("topikRapat", !hideMitraAndTopik, true);

    // Rule 3: if varian != penugasan then hide pimpinan + instansi
    const hidePimpinanInstansi = !varianPenugasan;

    this.setFieldVisible("pimpinan", !hidePimpinanInstansi, true);
    this.setFieldVisible("instansi", !hidePimpinanInstansi, true);

    // Rule 4: If Lingkup = Internal only AND jenis surat is Kurikulum Silabus or BTS
    // then hide Manajemen Fasilitator section entirely.
    const facilitatorSection = document.getElementById("facilitatorSection");
    const hideFacilitatorSection =
      isInternalOnly &&
      (jenisSurat === "Kurikulum Silabus" || jenisSurat === "Bahan Tayang Standar");

    if (facilitatorSection) {
      if (hideFacilitatorSection) {
        this.hideSection(facilitatorSection, true);
      } else {
        // Keep original behavior when not forced-hidden by Rule 4
        if (sifatSurat === "undangan") this.showSection(facilitatorSection);
        else this.hideSection(facilitatorSection, true);
      }
    }
  }

  // ===== SUPABASE (Facilitators) =====
  getSupabaseConfig() {
    // 1) Recommended: set these in index.html before main.js:
    //    <script>window.SUPABASE_URL="..."; window.SUPABASE_ANON_KEY="...";</script>
    // 2) Or set window.__ENV__ = { SUPABASE_URL, SUPABASE_ANON_KEY }
    const url =
      (window.__ENV__ && window.__ENV__.SUPABASE_URL) ||
      window.SUPABASE_URL ||
      window.REACT_APP_SUPABASE_URL ||
      "";
    const anonKey =
      (window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) ||
      window.SUPABASE_ANON_KEY ||
      window.REACT_APP_SUPABASE_ANON_KEY ||
      "";

    return { url, anonKey };
  }

  async ensureSupabaseLoaded() {
    // If supabase-js is already loaded (UMD), it will be available as window.supabase
    if (window.supabase && typeof window.supabase.createClient === "function")
      return;

    // Dynamically load Supabase JS (UMD) so index.html doesn't need manual edits
    await new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-supabase-js="true"]'
      );
      if (existing) return resolve();

      const s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      s.async = true;
      s.defer = true;
      s.dataset.supabaseJs = "true";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Gagal memuat supabase-js dari CDN"));
      document.head.appendChild(s);
    });
  }

  async getSupabaseClient() {
    await this.ensureSupabaseLoaded();
    const { url, anonKey } = this.getSupabaseConfig();

    if (!url || !anonKey) {
      console.warn(
        "[Supabase] SUPABASE_URL / SUPABASE_ANON_KEY belum diset. Dropdown fasilitator akan pakai data lokal (data.js)."
      );
      return null;
    }

    // Create once and reuse
    if (!this.supabase) {
      this.supabase = window.supabase.createClient(url, anonKey);
    }
    return this.supabase;
  }

  async refreshFacilitatorsFromSupabase() {
    try {
      const client = await this.getSupabaseClient();
      if (!client) return false;

      const table = window.SUPABASE_FACILITATORS_TABLE || "facilitators";

      // IMPORTANT: change table name if yours is different
      // Expected columns: nama (text), perusahaan (text)
      const { data, error } = await client
        .from(table)
        .select("id, nama, perusahaan")
        .order("nama", { ascending: true });

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        this.facilitators = data.map((row) => ({
          nama: row.nama || "",
          perusahaan: row.perusahaan || "",
        }));
        console.log(
          `[Supabase] Fasilitator berhasil dimuat: ${this.facilitators.length} data`
        );
        return true;
      } else {
        console.warn(
          "[Supabase] Table facilitators kosong. Tetap pakai data lokal (data.js)."
        );
        return false;
      }
    } catch (err) {
      console.error("[Supabase] Gagal fetch fasilitator:", err);
      // Keep fallback
      return false;
    }
  }

  // Populate time slots dropdown
  populateTimeSlots() {
    const timeDropdown = document.getElementById("waktuPelaksanaan");
    timeSlots.forEach((time) => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      timeDropdown.appendChild(option);
    });
  }

  // Populate facilitators dropdown

  // Populate facilitators dropdown (from this.facilitators)
  // options: {loading: boolean}
  populateFacilitators(options = {}) {
    const { loading = false } = options;

    const facilitatorDropdowns = [
      document.getElementById("namaFasilitator1"),
      document.getElementById("namaFasilitator2"),
      document.getElementById("namaFasilitator3"),
    ];

    facilitatorDropdowns.forEach((dropdown) => {
      if (!dropdown) return;

      const current = dropdown.value;

      // Clear existing options
      dropdown.innerHTML = loading
        ? '<option value="">Memuat fasilitator...</option>'
        : '<option value="">-- Pilih Nama Fasilitator --</option>';

      if (!loading) {
        (this.facilitators || []).forEach((facilitator) => {
          const option = document.createElement("option");
          option.value = facilitator.nama;
          option.textContent = facilitator.nama;
          dropdown.appendChild(option);
        });

        // Restore selection if still exists
        if (current) dropdown.value = current;
      }
    });
  }

  // Populate BTS programs dropdown
  populateBTSPrograms() {
    const btsDropdowns = [
      document.getElementById("btsPelatihan1"),
      document.getElementById("btsPelatihan2"),
      document.getElementById("btsPelatihan3"),
    ];

    btsDropdowns.forEach((dropdown) => {
      if (dropdown) {
        Object.keys(btsTrainingPrograms).forEach((program) => {
          const option = document.createElement("option");
          option.value = program;
          option.textContent = program;
          dropdown.appendChild(option);
        });
      }
    });
  }

  // Update progress bar
  updateProgressBar() {
    const requiredFields = this.getRequiredFields();
    const completedFields = this.getCompletedFields(requiredFields);
    const progress =
      requiredFields.length > 0
        ? (completedFields / requiredFields.length) * 100
        : 0;

    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
      this.safeAnime({
        targets: progressBar,
        width: `${progress}%`,
        duration: 500,
        easing: "easeOutQuart",
      });
    }
  }

  // Get required fields based on current selections
  getRequiredFields() {
    const jenisSurat = document.getElementById("jenisSurat").value;
    const sifatSurat = document.getElementById("sifatSurat").value;
    const jenisKurikulum = document.getElementById("jenisKurikulum").value;
    const perihalKPK = document.getElementById("perihalKPK").value;

    // Base required fields (topikRapat is conditional now)
    let requiredFields = [
      "jenisSurat",
      "sifatSurat",
      "bulanSurat",
      "tanggalPelaksanaan",
    ];

    // Only require topikRapat if visible
    if (this.isFieldVisible("topikRapat")) {
      requiredFields.push("topikRapat");
    }

    if (jenisSurat === "Kurikulum Silabus") {
      requiredFields.push("jenisKurikulum");

      if (jenisKurikulum === "KPK") {
        requiredFields.push("perihalKPK");

        // Only require mitraKerjasama if visible AND perihal demands it
        if (
          perihalKPK === "persiapan pelatihan" &&
          this.isFieldVisible("mitraKerjasama")
        ) {
          requiredFields.push("mitraKerjasama");
        }
      } else if (jenisKurikulum === "ECP") {
        requiredFields.push("tahapECP");
      }
    } else if (jenisSurat === "Bahan Tayang Standar") {
      requiredFields.push("jumlahBTS", "btsPelatihan1", "btsMateri1");
    }

    if (sifatSurat === "undangan") {
      requiredFields.push("waktuPelaksanaan");

      const lingkupEksternal =
        document.getElementById("lingkupEksternal").checked;
      if (lingkupEksternal) {
        const varianKelompok =
          document.getElementById("varianKelompok").checked;
        if (varianKelompok) {
          requiredFields.push("jumlahFasilitator");
        }
      }
    }

    // If pimpinan/instansi are hidden, do not require them (future proof)
    // (You didn't require them before, but this keeps it consistent.)
    requiredFields = requiredFields.filter((fid) => this.isFieldVisible(fid));

    return requiredFields;
  }

  // Get count of completed required fields
  getCompletedFields(requiredFields) {
    let count = 0;
    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field && field.value && field.value.trim() !== "") {
        count++;
      }
    });
    return count;
  }

  // Validate individual field
  validateField(field) {
    const fieldId = field.id;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldId}Error`);

    // Clear previous error
    if (errorElement) {
      errorElement.classList.remove("show");
    }

    // Check if field is required
    const requiredFields = this.getRequiredFields();
    if (requiredFields.includes(fieldId) && !value) {
      this.showFieldError(
        fieldId,
        `${fieldLabels[fieldId] || fieldId} harus diisi`
      );
      return false;
    }

    // Field-specific validations
    switch (fieldId) {
      case "tanggalPelaksanaan":
        if (value) {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            this.showFieldError(
              fieldId,
              "Tanggal tidak boleh kurang dari hari ini"
            );
            return false;
          }
        }
        break;
    }

    return true;
  }

  // Show field error
  showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
    }
  }

  // Validate entire form
  validateForm() {
    const requiredFields = this.getRequiredFields();
    let isValid = true;

    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field && !this.validateField(field)) {
        isValid = false;
      }
    });

    // Check scope selection
    const lingkupInternal = document.getElementById("lingkupInternal").checked;
    const lingkupEksternal =
      document.getElementById("lingkupEksternal").checked;
    if (!lingkupInternal && !lingkupEksternal) {
      alert(
        "Silakan pilih minimal satu lingkup surat (Internal atau Eksternal)"
      );
      isValid = false;
    }

    return isValid;
  }

  // Handle generate button click
  async handleGenerate() {
    console.log('[LetterGenerator] Generate clicked');
    if (this.isGenerating) return;

    if (!this.validateForm()) {
      this.showNotification("Mohon lengkapi semua field yang diperlukan", "error");
      return;
    }

    this.isGenerating = true;
    this.showLoadingModal();

    try {
      await this.generateDocument();
      this.showSuccessModal();
    } catch (err) {
      console.error("Generate error:", err);
      this.showNotification(
        err?.message ? `Gagal membuat surat: ${err.message}` : "Gagal membuat surat",
        "error"
      );
    } finally {
      this.hideLoadingModal();
      this.isGenerating = false;
    }
  }
  // ===== LETTER TEMPLATE (Supabase Storage + DB mapping) =====

  getLetterTemplatesConfig() {
    return {
      table: window.SUPABASE_LETTER_TEMPLATES_TABLE || "letter_templates",
      bucketDefault: window.SUPABASE_LETTER_TEMPLATES_BUCKET || "letter-templates",
      maxCandidates: window.SUPABASE_LETTER_TEMPLATES_MAX || 200,
    };
  }

  // Derive a normalized key set from form data for template matching
  deriveTemplateKeys(formData) {
    const internal = !!formData.lingkupInternal;
    const eksternal = !!formData.lingkupEksternal;

    const isInternalOnly = internal && !eksternal;
    const scope = eksternal ? "Eksternal" : isInternalOnly ? "Internal only" : "Internal";

    let varian = "";
    if (formData.varianPenugasan) varian = "Penugasan";
    else if (formData.varianKelompok) varian = "Kelompok";
    else if (formData.varianIndividu) varian = "Individu";

    const jenisSurat = formData.jenisSurat || "";
    const jenisKurikulum =
      jenisSurat === "Kurikulum Silabus" ? (formData.jenisKurikulum || "") : "";

    return {
      lingkup: scope,
      varian_surat: varian,
      jenis_surat: jenisSurat,
      jenis_kurikulum: jenisKurikulum || null,
    };
  }

  // Fetch active template candidates then score in JS (simple + robust)
  async fetchTemplateCandidates(keys) {
    const client = await this.getSupabaseClient();
    if (!client) return [];

    const { table, maxCandidates } = this.getLetterTemplatesConfig();

    const { data, error } = await client
      .from(table)
      .select(
        "id, code, name, description, lingkup, varian_surat, jenis_surat, jenis_kurikulum, bucket, storage_path, version, priority, is_active"
      )
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("version", { ascending: false })
      .limit(maxCandidates);

    if (error) throw error;

    // Optional pre-filter (fast reject) to reduce scoring work
    return (data || []).filter((t) => {
      const ok =
        (t.lingkup == null || t.lingkup === keys.lingkup) &&
        (t.varian_surat == null || t.varian_surat === keys.varian_surat) &&
        (t.jenis_surat == null || t.jenis_surat === keys.jenis_surat) &&
        (t.jenis_kurikulum == null || t.jenis_kurikulum === keys.jenis_kurikulum);
      return ok;
    });
  }

  // Score: prefer non-null exact matches; then priority/version
  scoreTemplateRow(row, keys) {
    const scoreField = (rowValue, keyValue) => {
      if (rowValue == null || rowValue === "") return 1; // wildcard
      if (rowValue === keyValue) return 10; // exact match
      return -999; // reject
    };

    const s =
      scoreField(row.lingkup, keys.lingkup) +
      scoreField(row.varian_surat, keys.varian_surat) +
      scoreField(row.jenis_surat, keys.jenis_surat) +
      scoreField(row.jenis_kurikulum, keys.jenis_kurikulum);

    if (s < 0) return -999;

    // Add priority/version weight
    return s * 1000 + (row.priority || 0) * 10 + (row.version || 0);
  }

  selectBestTemplate(candidates, keys) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    let best = null;
    let bestScore = -Infinity;

    for (const row of candidates) {
      const score = this.scoreTemplateRow(row, keys);
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }

    return best;
  }

  // Ensure Docx templating libs exist (PizZip + docxtemplater + FileSaver)
  async ensureDocxLibsLoaded() {
    const need = (name) => !(window[name]);

    // docxtemplater exports window.docxtemplater in browser build
    const hasDocxTemplater =
      window.docxtemplater && typeof window.docxtemplater === "function";

    const tasks = [];

    const loadScript = (src, attrName) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-${attrName}="true"]`);
        if (existing) return resolve();

        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.defer = true;
        s.dataset[attrName] = "true";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Gagal memuat library: ${src}`));
        document.head.appendChild(s);
      });

    if (!window.PizZip) {
      tasks.push(
        loadScript("https://cdn.jsdelivr.net/npm/pizzip@3.1.7/dist/pizzip.min.js", "pizzip")
      );
    }

    if (!hasDocxTemplater) {
      tasks.push(
        loadScript(
          "https://cdn.jsdelivr.net/npm/docxtemplater@3.50.0/build/docxtemplater.js",
          "docxtemplater"
        )
      );
    }

    if (!window.saveAs) {
      tasks.push(
        loadScript(
          "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js",
          "filesaver"
        )
      );
    }

    if (tasks.length > 0) await Promise.all(tasks);

    const ok =
      window.PizZip &&
      window.docxtemplater &&
      typeof window.docxtemplater === "function" &&
      typeof window.saveAs === "function";

    if (!ok) {
      throw new Error(
        "Library DOCX belum siap. Pastikan PizZip, docxtemplater, dan FileSaver bisa dimuat."
      );
    }
  }

  async downloadTemplateBlob({ bucket, path }) {
    const client = await this.getSupabaseClient();
    if (!client) throw new Error("Supabase client tidak tersedia");

    // Try direct download
    const { data, error } = await client.storage.from(bucket).download(path);

    if (!error && data) return data;

    // If storage is private, try signed URL as fallback
    if (typeof client.storage.from(bucket).createSignedUrl === "function") {
      const signed = await client.storage.from(bucket).createSignedUrl(path, 60);
      if (signed?.data?.signedUrl) {
        const resp = await fetch(signed.data.signedUrl);
        if (!resp.ok) throw new Error("Gagal download template (signed url)");
        return await resp.blob();
      }
    }

    throw error || new Error("Gagal download template dari Storage");
  }

  async blobToArrayBuffer(blob) {
    return await blob.arrayBuffer();
  }

  renderDocx(arrayBuffer, payload) {
    const zip = new window.PizZip(arrayBuffer);

    const doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // IMPORTANT: your template uses [placeholder] format
      delimiters: { start: "[", end: "]" },
    });

    doc.render(payload);

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return out;
  }

  // Build a payload for docx placeholders. Keep keys stable!
  buildDocxPayload(formData) {
    // Map UI ids -> placeholder keys. Adjust if your template uses different names.
    // NOTE: return empty string for missing values to avoid docxtemplater errors.
    const safe = (v) => (v == null ? "" : String(v));

    // Derive some convenience values
    const tanggal = safe(formData.tanggalPelaksanaan);
    const waktu = safe(formData.waktuPelaksanaan);

    return {
      // Common
      jenis_surat: safe(formData.jenisSurat),
      sifat_surat: safe(formData.sifatSurat),
      bulan_surat: safe(formData.bulanSurat),
      lampiran: safe(formData.lampiran),
      mitra_kerjasama: safe(formData.mitraKerjasama),
      topik_rapat: safe(formData.topikRapat),
      tanggal_pelaksanaan: tanggal,
      waktu_pelaksanaan: waktu,
      tahap_ecp: safe(formData.tahapECP),
      perihal_kpk: safe(formData.perihalKPK),

      // Facilitators (names + institutions)
      fasilitator1: safe(formData.namaFasilitator1),
      fasilitator2: safe(formData.namaFasilitator2),
      fasilitator3: safe(formData.namaFasilitator3),
      instansi_fasilitator1: safe(formData.instansiFasilitator1),
      instansi_fasilitator2: safe(formData.instansiFasilitator2),
      instansi_fasilitator3: safe(formData.instansiFasilitator3),

      // Penugasan fields
      pimpinan: safe(formData.pimpinan),
      instansi: safe(formData.instansi),

      // BTS
      bts_pelatihan1: safe(formData.btsPelatihan1),
      bts_materi1: safe(formData.btsMateri1),
      bts_pelatihan2: safe(formData.btsPelatihan2),
      bts_materi2: safe(formData.btsMateri2),
      bts_pelatihan3: safe(formData.btsPelatihan3),
      bts_materi3: safe(formData.btsMateri3),

      // Add more mappings here as your template grows
    };
  }


  // ===== TEMPLATE PATH (Python-style deterministic path on Storage) =====
  slugifyPathSegment(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  /**
   * Adopted from your Python app concept:
   * base: <sifat_surat>/<jenis_surat>/<collaboration_type>/
   * then dynamic:
   * - UNDANGAN + KURIKULUM SILABUS:
   *   <jenis_kurikulum>/<perihal_kpk OR tahap_ecp>/<varian>/temp_letter_<collab>_<varian>.docx
   * - UNDANGAN + BTS:
   *   <varian>/temp_letter_<collab>_<varian>.docx
   * - HASIL + KURIKULUM SILABUS:
   *   <jenis_kurikulum>/<perihal_kpk OR tahap_ecp>/temp_letter_<collab>.docx
   * - HASIL + BTS:
   *   temp_letter_<collab>.docx
   */
  buildStorageTemplatePathFromPythonConcept(formData) {
    const sifatRaw = (formData.sifatSurat || "").trim().toLowerCase();
    const jenisRaw = (formData.jenisSurat || "").trim().toLowerCase();

    const sifatSeg = this.slugifyPathSegment(formData.sifatSurat);
    const jenisSeg = this.slugifyPathSegment(formData.jenisSurat);

    const collab = formData.lingkupEksternal ? "eksternal" : "internal";

    let varian = "";
    if (formData.varianIndividu) varian = "individu";
    else if (formData.varianPenugasan) varian = "penugasan";
    else if (formData.varianKelompok) varian = "kelompok";

    const varianSeg = this.slugifyPathSegment(varian);

    const jenisKurikulum = this.slugifyPathSegment(formData.jenisKurikulum);
    const perihalKPK = this.slugifyPathSegment(formData.perihalKPK);
    const tahapECP = this.slugifyPathSegment(formData.tahapECP);

    const subKey = formData.jenisKurikulum === "KPK" ? perihalKPK : tahapECP;

    const base = `${sifatSeg}/${jenisSeg}/${collab}/`;

    let dynamic = "";

    if (sifatRaw === "undangan") {
      if (jenisRaw === "kurikulum silabus") {
        const parts = [jenisKurikulum, subKey, varianSeg].filter(Boolean);
        dynamic = `${parts.join("/")}/temp_letter_${collab}_${varianSeg}.docx`;
      } else if (jenisRaw === "bahan tayang standar") {
        dynamic = `${varianSeg}/temp_letter_${collab}_${varianSeg}.docx`;
      } else {
        dynamic = `temp_letter_${collab}.docx`;
      }
    } else if (sifatRaw === "hasil") {
      if (jenisRaw === "kurikulum silabus") {
        const parts = [jenisKurikulum, subKey].filter(Boolean);
        dynamic = `${parts.join("/")}/temp_letter_${collab}.docx`;
      } else if (jenisRaw === "bahan tayang standar") {
        dynamic = `temp_letter_${collab}.docx`;
      } else {
        dynamic = `temp_letter_${collab}.docx`;
      }
    } else {
      // default safe fallback
      dynamic = `temp_letter_${collab}.docx`;
    }

    const { bucketDefault } = this.getLetterTemplatesConfig();
    return { bucket: bucketDefault, path: base + dynamic };
  }

  // ===== GENERATED LETTERS (Open in web + download) =====
  getGeneratedLettersConfig() {
    return {
      bucket: window.SUPABASE_GENERATED_LETTERS_BUCKET || "generated-letters",
      folder: window.SUPABASE_GENERATED_LETTERS_FOLDER || "generated",
      signedExpirySeconds:
        window.SUPABASE_GENERATED_LETTERS_SIGNED_EXPIRY || 60 * 60, // 1 hour
      openWithOfficeViewer: true,
    };
  }

  async uploadGeneratedDocx(blob, filename) {
    const client = await this.getSupabaseClient();
    if (!client) throw new Error("Supabase client tidak tersedia");

    const cfg = this.getGeneratedLettersConfig();
    const ts = new Date();
    const safeName = this.slugifyPathSegment(filename.replace(/\.docx$/i, "")) || "surat";
    const path = `${cfg.folder}/${ts.getFullYear()}/${String(ts.getMonth() + 1).padStart(2, "0")}/${Date.now()}_${safeName}.docx`;

    const file = new File([blob], filename.endsWith(".docx") ? filename : `${filename}.docx`, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const { error } = await client.storage.from(cfg.bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    if (error) throw error;
    return { bucket: cfg.bucket, path };
  }

  async getFileAccessUrls(bucket, path) {
    const client = await this.getSupabaseClient();
    const cfg = this.getGeneratedLettersConfig();

    // Try public URL first (works only if bucket is public)
    let directUrl = null;
    try {
      const pub = client.storage.from(bucket).getPublicUrl(path);
      if (pub?.data?.publicUrl) directUrl = pub.data.publicUrl;
    } catch (_) {}

    // Always attempt signed URL (works for private buckets too, if user has permission)
    let signedUrl = null;
    try {
      const signed = await client.storage.from(bucket).createSignedUrl(path, cfg.signedExpirySeconds);
      if (signed?.data?.signedUrl) signedUrl = signed.data.signedUrl;
    } catch (_) {}

    // Prefer signed URL if available (more likely to be accessible for private buckets)
    const downloadUrl = signedUrl || directUrl;

    if (!downloadUrl) {
      throw new Error(
        "Tidak bisa membuat URL file. Pastikan bucket public atau policy Storage mengizinkan signedUrl."
      );
    }

    // Office Online viewer for DOCX
    const viewerUrl = cfg.openWithOfficeViewer
      ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}`
      : downloadUrl;

    return { downloadUrl, viewerUrl };
  }

  openGeneratedLetter(viewerUrl) {
    // If you have an iframe in modal, use it; else open new tab
    const frame = document.getElementById("docPreviewFrame");
    if (frame && frame.tagName === "IFRAME") {
      frame.src = viewerUrl;
    } else {
      window.open(viewerUrl, "_blank", "noopener,noreferrer");
    }
  }

  async publishAndOpenGeneratedLetter(docxBlob, filename) {
    try {
      const uploaded = await this.uploadGeneratedDocx(docxBlob, filename);
      const { downloadUrl, viewerUrl } = await this.getFileAccessUrls(
        uploaded.bucket,
        uploaded.path
      );

      this.generatedDownloadUrl = downloadUrl;
      this.generatedViewerUrl = viewerUrl;

      // Auto open after generate
      this.openGeneratedLetter(viewerUrl);

      return { downloadUrl, viewerUrl };
    } catch (err) {
      console.warn(
        "[GeneratedLetters] Upload/open gagal. Fallback ke download lokal.",
        err
      );
      // Fallback: local download
      await this.ensureDocxLibsLoaded();
      window.saveAs(docxBlob, filename);
      this.generatedDownloadUrl = null;
      this.generatedViewerUrl = null;
      return null;
    }
  }

  async getTemplateRowForForm(formData) {
    const keys = this.deriveTemplateKeys(formData);

    const candidates = await this.fetchTemplateCandidates(keys);
    const best = this.selectBestTemplate(candidates, keys);
    return best;
  }

  async createDocxBlobFromSupabaseTemplate({ templateRow, payload }) {
    await this.ensureDocxLibsLoaded();

    const bucket =
      templateRow.bucket || this.getLetterTemplatesConfig().bucketDefault;
    const path = templateRow.storage_path;

    if (!path) throw new Error("storage_path template kosong / belum diset");

    const tplBlob = await this.downloadTemplateBlob({ bucket, path });
    const ab = await this.blobToArrayBuffer(tplBlob);
    const outBlob = this.renderDocx(ab, payload);
    return outBlob;
  }

  // Generate document (DOCX)
  async generateDocument() {
    const formData = this.collectFormData();
    const filename = this.generateFilename(formData);
    this.generatedFilename = filename;

    // Build payload for placeholders like [fasilitator1], etc.
    const payload = this.buildDocxPayload(formData);

    // 1) Prefer DB mapping (letter_templates) → Storage template
    let templateRow = null;
    try {
      templateRow = await this.getTemplateRowForForm(formData);
    } catch (err) {
      console.warn(
        "[Template] Gagal ambil mapping dari DB. Coba fallback path deterministic.",
        err
      );
    }

    if (templateRow) {
      const outBlob = await this.createDocxBlobFromSupabaseTemplate({
        templateRow,
        payload,
      });

      await this.publishAndOpenGeneratedLetter(outBlob, filename);
      console.log("[Template] Using DB-mapped template:", templateRow);
      return;
    }

    // 2) Fallback: Python-style deterministic Storage path (adopted concept)
    try {
      const built = this.buildStorageTemplatePathFromPythonConcept(formData);
      console.log("[Template] Trying deterministic path:", built);

      const tplBlob = await this.downloadTemplateBlob({
        bucket: built.bucket,
        path: built.path,
      });
      const ab = await this.blobToArrayBuffer(tplBlob);
      const outBlob = this.renderDocx(ab, payload);

      await this.publishAndOpenGeneratedLetter(outBlob, filename);
      return;
    } catch (err) {
      console.warn(
        "[Template] Deterministic path gagal. Pastikan file template ada di Storage dengan struktur folder yang benar.",
        err
      );
    }

    // 3) Last fallback: legacy templatePaths (only logs for now)
    const legacyTemplatePath =
      typeof this.resolveTemplatePath === "function"
        ? this.resolveTemplatePath(formData)
        : null;

    console.warn(
      "[Template] Tidak menemukan template. legacyTemplatePath:",
      legacyTemplatePath
    );

    this.showNotification(
      "Template tidak ditemukan. Pastikan tabel letter_templates aktif atau file template ada di Storage sesuai struktur folder.",
      "error"
    );
  }



  // Collect all form data
  collectFormData() {
    const data = {};

    // Helper: only collect values from visible fields (hidden fields must not be included)
    const getValueIfVisible = (fieldId) => {
      if (!this.isFieldVisible(fieldId)) return "";
      const el = document.getElementById(fieldId);
      return el ? el.value : "";
    };
    const getCheckedIfVisible = (fieldId) => {
      if (!this.isFieldVisible(fieldId)) return false;
      const el = document.getElementById(fieldId);
      return el ? !!el.checked : false;
    };

    // Basic fields
    data.jenisSurat = getValueIfVisible("jenisSurat");
    data.sifatSurat = getValueIfVisible("sifatSurat");
    data.jenisKurikulum = getValueIfVisible("jenisKurikulum");
    data.perihalKPK = getValueIfVisible("perihalKPK");
    data.bulanSurat = getValueIfVisible("bulanSurat");
    data.lampiran = getValueIfVisible("lampiran");
    data.mitraKerjasama = getValueIfVisible("mitraKerjasama");
    data.topikRapat = getValueIfVisible("topikRapat");
    data.tanggalPelaksanaan = getValueIfVisible("tanggalPelaksanaan");
    data.waktuPelaksanaan = getValueIfVisible("waktuPelaksanaan");
    data.tahapECP = getValueIfVisible("tahapECP");

    // Scope
    data.lingkupInternal = getCheckedIfVisible("lingkupInternal");
    data.lingkupEksternal = getCheckedIfVisible("lingkupEksternal");

    // BTS
    data.jumlahBTS = getValueIfVisible("jumlahBTS");
    data.btsPelatihan1 = getValueIfVisible("btsPelatihan1");
    data.btsMateri1 = getValueIfVisible("btsMateri1");
    data.btsPelatihan2 = getValueIfVisible("btsPelatihan2");
    data.btsMateri2 = getValueIfVisible("btsMateri2");
    data.btsPelatihan3 = getValueIfVisible("btsPelatihan3");
    data.btsMateri3 = getValueIfVisible("btsMateri3");

    // Facilitators
    data.varianIndividu = getCheckedIfVisible("varianIndividu");
    data.varianPenugasan = getCheckedIfVisible("varianPenugasan");
    data.varianKelompok = getCheckedIfVisible("varianKelompok");
    data.jumlahFasilitator = getValueIfVisible("jumlahFasilitator");
    data.namaFasilitator1 = getValueIfVisible("namaFasilitator1");
    data.namaFasilitator2 = getValueIfVisible("namaFasilitator2");
    data.namaFasilitator3 = getValueIfVisible("namaFasilitator3");
    data.pimpinan = getValueIfVisible("pimpinan");
    data.instansi = getValueIfVisible("instansi");

    // Get institution names for facilitators
    if (data.namaFasilitator1) {
      const f1 = this.facilitators.find(
        (f) => f.nama === data.namaFasilitator1
      );
      data.instansiFasilitator1 = f1 ? f1.perusahaan : "";
    }
    if (data.namaFasilitator2) {
      const f2 = this.facilitators.find(
        (f) => f.nama === data.namaFasilitator2
      );
      data.instansiFasilitator2 = f2 ? f2.perusahaan : "";
    }
    if (data.namaFasilitator3) {
      const f3 = this.facilitators.find(
        (f) => f.nama === data.namaFasilitator3
      );
      data.instansiFasilitator3 = f3 ? f3.perusahaan : "";
    }

    return data;
  }

  // Resolve template path based on form data
  resolveTemplatePath(data) {
    try {
      let path = templatePaths[data.jenisSurat];
      if (!path) return null;

      path = path[data.sifatSurat];
      if (!path) return null;

      // Determine scope
      let scope = "internal";
      if (data.lingkupEksternal && !data.lingkupInternal) {
        scope = "eksternal";
      } else if (data.lingkupInternal && data.lingkupEksternal) {
        scope = "eksternal"; // Default to external if both selected
      }

      path = path[scope];
      if (!path) return null;

      // Handle specific curriculum types
      if (data.jenisSurat === "Kurikulum Silabus") {
        if (data.jenisKurikulum === "KPK") {
          path = path[data.jenisKurikulum];
          if (path && data.perihalKPK) {
            path = path[data.perihalKPK];
          }
        } else if (data.jenisKurikulum === "ECP") {
          path = path[data.jenisKurikulum] || path["default"];
        }
      }

      // Handle variant for undangan external
      if (data.sifatSurat === "undangan" && scope === "eksternal") {
        if (data.varianIndividu) {
          path = path["individu"];
        } else if (data.varianPenugasan) {
          path = path["penugasan"];
        } else if (data.varianKelompok) {
          path = path["kelompok"];
        }
      }

      // Default path if specific path not found
      if (typeof path === "object" && path["default"]) {
        path = path["default"];
      }

      return typeof path === "string" ? path : null;
    } catch (error) {
      console.error("Error resolving template path:", error);
      return null;
    }
  }

  // Generate filename
  generateFilename(data) {
    let filename = "surat_";

    // Add scope
    if (data.lingkupEksternal) {
      filename += "eksternal_";
    } else {
      filename += "internal_";
    }

    // Add letter type
    filename += data.jenisSurat.toLowerCase().replace(/\s+/g, "_") + "_";

    // Add specific identifier
    if (data.jenisSurat === "Kurikulum Silabus") {
      if (data.jenisKurikulum === "KPK" && data.perihalKPK) {
        filename += data.perihalKPK.replace(/\s+/g, "_") + "_";
      } else if (data.jenisKurikulum === "ECP" && data.tahapECP) {
        filename += data.tahapECP.replace(/\s+/g, "_") + "_";
      }
    } else if (data.jenisSurat === "Bahan Tayang Standar" && data.btsMateri1) {
      filename += data.btsMateri1.replace(/\s+/g, "_") + "_";
    }

    // Add topic
    if (data.topikRapat) {
      filename += data.topikRapat.replace(/\s+/g, "_").substring(0, 30) + "_";
    }

    // Add variant for undangan external
    if (data.sifatSurat === "undangan" && data.lingkupEksternal) {
      if (data.varianIndividu) {
        filename += "individu_";
      } else if (data.varianPenugasan) {
        filename += "penugasan_";
      } else if (data.varianKelompok) {
        filename += "kelompok_";
      }
    }

    // Add date and extension
    const today = new Date();
    filename +=
      today.getFullYear() +
      "_" +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      "_" +
      today.getDate().toString().padStart(2, "0") +
      ".docx";

    return filename;
  }

  // Handle reset button click
  handleReset() {
    if (confirm("Apakah Anda yakin ingin mereset semua field?")) {
      document.getElementById("letterForm").reset();
      this.clearAllErrors();
      this.hideAllConditionalSections();
      this.updateProgressBar();
      localStorage.removeItem("letterFormState");
      this.showNotification("Form berhasil direset", "success");
    }
  }

  // Clear all error messages
  clearAllErrors() {
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach((element) => {
      element.classList.remove("show");
    });
  }

  // Hide all conditional sections
  hideAllConditionalSections() {
    const conditionalSections = [
      "curriculumSection",
      "btsSection",
      "facilitatorSection",
      "perihalKPKSection",
      "tahapECPSection",
      "jumlahFasilitatorSection",
      "institutionSection",
    ];

    conditionalSections.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        this.hideSection(section);
      }
    });

    // Hide BTS sections
    for (let i = 1; i <= 3; i++) {
      const section = document.getElementById(`bts${i}Section`);
      if (section) {
        this.hideSection(section);
      }
    }

    // Hide facilitator sections
    for (let i = 1; i <= 3; i++) {
      const section = document.getElementById(`fasilitator${i}Section`);
      if (section) {
        this.hideSection(section);
      }
    }
  }

  // Handle preview button click
  handlePreview() {
    this.showNotification("Fitur preview akan segera tersedia", "info");
  }

  // Show loading modal
  showLoadingModal() {
    document.getElementById("loadingModal").classList.remove("hidden");
  }

  // Hide loading modal
  hideLoadingModal() {
    document.getElementById("loadingModal").classList.add("hidden");
  }

  // Show success modal
  showSuccessModal() {
    document.getElementById("successModal").classList.remove("hidden");

    // Add success animation
    this.safeAnime({
      targets: "#successModal .bg-white",
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 500,
      easing: "easeOutBack",
    });
  }

  // Close success modal
  closeSuccessModal() {
    document.getElementById("successModal").classList.add("hidden");
  }

  // Handle download button click
  handleDownload() {
    this.showNotification("Mengunduh surat...", "success");

    const url = this.generatedDownloadUrl;
    const filename = this.generatedFilename || "surat_template.docx";

    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // If we fell back to local saveAs, the file is already downloaded.
      this.showNotification("File sudah diunduh secara lokal.", "info");
    }

    this.closeSuccessModal();
  }

  // Save form state to localStorage
  saveFormState() {
    const formData = {};
    const formElements = document.querySelectorAll("input, select, textarea");

    formElements.forEach((element) => {
      if (element.type === "checkbox") {
        formData[element.id] = element.checked;
      } else {
        formData[element.id] = element.value;
      }
    });

    localStorage.setItem("letterFormState", JSON.stringify(formData));
  }

  // Load form state from localStorage
  loadFormState() {
    const savedState = localStorage.getItem("letterFormState");
    if (!savedState) return;

    try {
      const formData = JSON.parse(savedState);

      Object.keys(formData).forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (field) {
          if (field.type === "checkbox") {
            field.checked = formData[fieldId];
          } else {
            field.value = formData[fieldId];
          }
        }
      });

      // Trigger change events to update UI
      setTimeout(() => {
        document
          .getElementById("jenisSurat")
          .dispatchEvent(new Event("change"));
        document
          .getElementById("sifatSurat")
          .dispatchEvent(new Event("change"));
        document
          .getElementById("jenisKurikulum")
          .dispatchEvent(new Event("change"));
        document.getElementById("jumlahBTS").dispatchEvent(new Event("change"));
        document
          .getElementById("jumlahFasilitator")
          .dispatchEvent(new Event("change"));
        this.handleVariantChange();
        this.applyVisibilityRules();
        this.updateProgressBar();
      }, 100);
    } catch (error) {
      console.error("Error loading form state:", error);
    }
  }

  // Initialize charts
  initializeCharts() {
    this.initLetterTypeChart();
    this.initMonthlyChart();
  }

  // Initialize letter type usage chart
  initLetterTypeChart() {
    const chartElement = document.getElementById("letterTypeChart");
    if (!chartElement) return;

    const chart = echarts.init(chartElement);
    const option = {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
      },
      series: [
        {
          name: "Jenis Surat",
          type: "pie",
          radius: "50%",
          data: [
            {
              value: templateUsageStats.letterTypes["Kurikulum Silabus"],
              name: "Kurikulum Silabus",
            },
            {
              value: templateUsageStats.letterTypes["Bahan Tayang Standar"],
              name: "Bahan Tayang Standar",
            },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          itemStyle: {
            color: function (params) {
              const colors = ["#1a365d", "#d69e2e"];
              return colors[params.dataIndex];
            },
          },
        },
      ],
    };

    chart.setOption(option);

    // Responsive
    window.addEventListener("resize", () => {
      chart.resize();
    });
  }

  // Initialize monthly usage chart
  initMonthlyChart() {
    const chartElement = document.getElementById("monthlyChart");
    if (!chartElement) return;

    const chart = echarts.init(chartElement);
    const months = Object.keys(templateUsageStats.monthlyUsage);
    const values = Object.values(templateUsageStats.monthlyUsage);

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: months,
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "Jumlah Surat",
          type: "bar",
          barWidth: "60%",
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "#1a365d",
              },
              {
                offset: 1,
                color: "#4a5568",
              },
            ]),
          },
        },
      ],
    };

    chart.setOption(option);

    // Responsive
    window.addEventListener("resize", () => {
      chart.resize();
    });
  }

  // Start particle animation
  startParticleAnimation() {
    const container = document.getElementById("particleContainer");
    if (!container) return;

    // Simple particle animation with CSS
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(214, 158, 46, 0.3);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
      container.appendChild(particle);
    }

    // Add CSS animation
    if (!document.getElementById("particleAnimation")) {
      const style = document.createElement("style");
      style.id = "particleAnimation";
      style.textContent = `
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
                    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
                }
            `;
      document.head.appendChild(style);
    }
  }

  // Show notification
  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : type === "warning"
        ? "bg-yellow-500 text-white"
        : "bg-blue-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    this.safeAnime({
      targets: notification,
      translateX: [300, 0],
      opacity: [0, 1],
      duration: 500,
      easing: "easeOutQuart",
    });

    // Remove after 3 seconds
    setTimeout(() => {
      this.safeAnime({
        targets: notification,
        translateX: [0, 300],
        opacity: [1, 0],
        duration: 500,
        easing: "easeInQuart",
        complete: () => {
          document.body.removeChild(notification);
        },
      });
    }, 3000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.__letterGenerator = new LetterGenerator();
  console.log('[LetterGenerator] Loaded main.js and created instance');
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Page became visible, refresh any needed data
    console.log("Page became visible");
  }
});

// Handle beforeunload to save form state
window.addEventListener("beforeunload", () => {
  // Form state is already saved on each change
  console.log("Saving form state before unload");
});
