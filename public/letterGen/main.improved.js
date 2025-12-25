// Main JavaScript for Template Letter Generator
// Handles all form interactions, validation, and document generation

class LetterGenerator {
  constructor() {
    this.formData = {};
    this.isGenerating = false;
    this.init().catch((err) => console.error("Init error:", err));
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

    anime({
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
      anime({
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
      // Metadata table that maps options -> template file in Storage
      table: window.SUPABASE_LETTER_TEMPLATES_TABLE || "letter_templates",

      // Where template DOCX lives
      bucketDefault:
        window.SUPABASE_LETTER_TEMPLATES_BUCKET || "letter-templates",

      // Where generated DOCX will be uploaded for web viewing
      generatedBucket:
        window.SUPABASE_GENERATED_LETTERS_BUCKET || "generated-letters",

      maxCandidates: window.SUPABASE_LETTER_TEMPLATES_MAX || 200,
    };
  }

  // Derive a normalized key set from form data for template matching
  deriveTemplateKeys(formData) {
    // Adopted from your Python app concept:
    // base concept: Template/{Sifat}/{Jenis}/{collaboration_type}/...
    // then dynamic path: depends on jenis surat, jenis kurikulum/perihal, and varian (for undangan)
    const internal = !!formData.lingkupInternal;
    const eksternal = !!formData.lingkupEksternal;

    const isInternalOnly = internal && !eksternal;

    // collaboration_type in python: 'internal' or 'eksternal'
    // If both checked, prefer 'eksternal' (same behavior as your legacy logic)
    const collaboration_type = eksternal ? "eksternal" : "internal";

    // Normalize values
    const jenis_surat = (formData.jenisSurat || "").trim();
    const sifat_surat = (formData.sifatSurat || "").trim();

    let varian_surat = null;
    if (formData.varianPenugasan) varian_surat = "penugasan";
    else if (formData.varianKelompok) varian_surat = "kelompok";
    else if (formData.varianIndividu) varian_surat = "individu";

    const jenis_kurikulum =
      jenis_surat === "Kurikulum Silabus"
        ? (formData.jenisKurikulum || "").trim()
        : null;

    const perihal_kpk =
      jenis_surat === "Kurikulum Silabus" && jenis_kurikulum === "KPK"
        ? (formData.perihalKPK || "").trim()
        : null;

    const tahap_ecp =
      jenis_surat === "Kurikulum Silabus" && jenis_kurikulum === "ECP"
        ? (formData.tahapECP || "").trim()
        : null;

    return {
      // DB mapping fields (can be NULL as wildcard)
      sifat_surat: sifat_surat || null,
      jenis_surat: jenis_surat || null,
      collaboration_type, // internal / eksternal
      varian_surat: varian_surat || null,
      jenis_kurikulum: jenis_kurikulum || null,
      perihal_kpk: perihal_kpk || null,
      tahap_ecp: tahap_ecp || null,

      // Extra derived flags
      isInternalOnly,
    };
  }

  // Fetch active template candidates then score in JS (simple + robust)
  async fetchTemplateCandidates(keys) {
    const client = await this.getSupabaseClient();
    if (!client) return [];

    const { table, maxCandidates } = this.getLetterTemplatesConfig();

    // Use select('*') so you can freely add columns in DB without breaking the app
    const { data, error } = await client
      .from(table)
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("version", { ascending: false })
      .limit(maxCandidates);

    if (error) throw error;

    const lower = (v) => (v == null ? null : String(v).trim().toLowerCase());
    const isMatch = (rowValue, keyValue) => {
      // NULL / empty in row means wildcard
      if (rowValue == null || String(rowValue).trim() === "") return true;
      if (keyValue == null || String(keyValue).trim() === "") return false;
      return lower(rowValue) === lower(keyValue);
    };

    return (data || []).filter((t) => {
      // Backward compatibility:
      // - prefer t.collaboration_type; fallback to t.lingkup ("Internal", "Eksternal", etc)
      // - keys.collaboration_type is "internal" / "eksternal"
      const rowCollab =
        t.collaboration_type != null ? t.collaboration_type : t.lingkup;

      return (
        isMatch(t.sifat_surat, keys.sifat_surat) &&
        isMatch(t.jenis_surat, keys.jenis_surat) &&
        isMatch(rowCollab, keys.collaboration_type) &&
        isMatch(t.varian_surat, keys.varian_surat) &&
        isMatch(t.jenis_kurikulum, keys.jenis_kurikulum) &&
        isMatch(t.perihal_kpk, keys.perihal_kpk) &&
        isMatch(t.tahap_ecp, keys.tahap_ecp)
      );
    });
  }
scoreTemplateRow(row, keys) {
    const lower = (v) => (v == null ? "" : String(v).trim().toLowerCase());
    const scoreField = (rowValue, keyValue) => {
      // Wildcard rows still match but are less preferred
      if (rowValue == null || String(rowValue).trim() === "") return 1;
      if (keyValue == null || String(keyValue).trim() === "") return -999;
      if (lower(rowValue) === lower(keyValue)) return 10;
      return -999;
    };

    const rowCollab =
      row.collaboration_type != null ? row.collaboration_type : row.lingkup;

    const s =
      scoreField(row.sifat_surat, keys.sifat_surat) +
      scoreField(row.jenis_surat, keys.jenis_surat) +
      scoreField(rowCollab, keys.collaboration_type) +
      scoreField(row.varian_surat, keys.varian_surat) +
      scoreField(row.jenis_kurikulum, keys.jenis_kurikulum) +
      scoreField(row.perihal_kpk, keys.perihal_kpk) +
      scoreField(row.tahap_ecp, keys.tahap_ecp);

    if (s < 0) return -999;

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
  
  // Compute Storage path for template using the same concept as your Python app
  // Folder concept in bucket:
  //   <sifat>/<jenis>/<collaboration_type>/...
  // Then:
  //   - if sifat = undangan: uses <varian>/temp_letter_<collab>_<varian>.docx
  //   - if jenis = kurikulum silabus: adds <jenis_kurikulum>/ and optionally <perihal_kpk> or <tahap_ecp>
  //   - if sifat = hasil: uses temp_letter_<collab>.docx (no varian)
  computeTemplateStoragePath(keys) {
    const low = (v) => (v == null ? "" : String(v).trim().toLowerCase());
    const slug = (s) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_\-]/g, "");

    const sifat = slug(keys.sifat_surat);
    const jenis = slug(keys.jenis_surat);
    const collab = slug(keys.collaboration_type); // internal / eksternal
    const varian = slug(keys.varian_surat);

    if (!sifat || !jenis || !collab) return null;

    const parts = [sifat, jenis, collab];

    const isKurikulum = low(keys.jenis_surat) === "kurikulum silabus";
    const jenisK = slug(keys.jenis_kurikulum);
    const perihal = slug(keys.perihal_kpk);
    const tahap = slug(keys.tahap_ecp);

    if (isKurikulum && jenisK) {
      parts.push(jenisK);
      if (jenisK === "kpk" && perihal) parts.push(perihal);
      if (jenisK === "ecp" && tahap) parts.push(tahap);
    }

    if (sifat === "undangan") {
      if (!varian) return null;
      parts.push(varian);
      parts.push(`temp_letter_${collab}_${varian}.docx`);
    } else {
      // hasil (or other): no varian folder
      parts.push(`temp_letter_${collab}.docx`);
    }

    return parts.join("/");
  }

  async generateDocxFromComputedPath({ keys, payload, filename }) {
    // Try to find template by computed Storage path (no DB row needed)
    const path = this.computeTemplateStoragePath(keys);
    if (!path) throw new Error("Tidak bisa menentukan path template (computed path)");

    const cfg = this.getLetterTemplatesConfig();
    const bucket = cfg.bucketDefault;

    return await this.generateDocxFromSupabaseTemplate({
      templateRow: { bucket, storage_path: path },
      payload,
      filename,
    });
  }

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

  async getTemplateRowForForm(formData) {
    const keys = this.deriveTemplateKeys(formData);

    const candidates = await this.fetchTemplateCandidates(keys);
    const best = this.selectBestTemplate(candidates, keys);
    return best;
  }

  async generateDocxFromSupabaseTemplate({ templateRow, payload, filename }) {
    // Generates DOCX in-browser, uploads to Supabase Storage for web viewing,
    // and keeps a local blob for optional download.
    await this.ensureDocxLibsLoaded();

    const bucket =
      templateRow.bucket || this.getLetterTemplatesConfig().bucketDefault;
    const path = templateRow.storage_path;

    if (!path) throw new Error("storage_path template kosong / belum diset");

    const tplBlob = await this.downloadTemplateBlob({ bucket, path });
    const ab = await this.blobToArrayBuffer(tplBlob);
    const outBlob = this.renderDocx(ab, payload);

    // Keep blob for download fallback
    this.generatedDocxBlob = outBlob;
    this.generatedFilename = filename;

    // Upload for web-view (preferred)
    const uploadResult = await this.uploadGeneratedLetterToStorage(
      outBlob,
      filename
    );

    if (uploadResult?.signedUrl) {
      this.generatedSignedUrl = uploadResult.signedUrl;
      this.generatedViewerUrl = this.buildOfficeViewerUrl(uploadResult.signedUrl);
    } else {
      this.generatedSignedUrl = null;
      this.generatedViewerUrl = null;
    }

    return { outBlob, ...uploadResult };
  }

  buildOfficeViewerUrl(fileUrl) {
    // Office Online viewer can render DOCX from a publicly reachable URL (signed URL works).
    // Note: viewer needs a URL-encoded src parameter.
    const encoded = encodeURIComponent(fileUrl);
    return `https://view.officeapps.live.com/op/view.aspx?src=${encoded}`;
  }

  async uploadGeneratedLetterToStorage(blob, filename) {
    // Upload generated docx to Supabase Storage and return a signed URL
    const client = await this.getSupabaseClient();
    if (!client) {
      console.warn(
        "[Generated Letter] Supabase client tidak tersedia, skip upload."
      );
      return { uploaded: false };
    }

    const cfg = this.getLetterTemplatesConfig();
    const bucket = cfg.generatedBucket || "generated-letters";

    // Create a reasonably unique path: YYYY/MM/DD/<timestamp>_<rand>_<filename>
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const ts = String(now.getTime());
    const rand = Math.random().toString(36).slice(2, 8);
    const safeName = (filename || "surat.docx").replace(/[^\w.\-]+/g, "_");

    const storagePath = `${yyyy}/${mm}/${dd}/${ts}_${rand}_${safeName}`;

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(storagePath, blob, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });

    if (uploadError) {
      console.warn("[Generated Letter] Upload gagal:", uploadError);
      return { uploaded: false, storagePath };
    }

    // Create signed URL for viewing/downloading
    let signedUrl = null;
    if (typeof client.storage.from(bucket).createSignedUrl === "function") {
      const signed = await client.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60 * 60); // 1 hour
      signedUrl = signed?.data?.signedUrl || null;
    }

    return { uploaded: true, bucket, storagePath, signedUrl };
  }

  ensureSuccessModalActions() {
    // Add "Open in Browser" button dynamically next to Download if not present
    const downloadBtn = document.getElementById("downloadBtn");
    if (!downloadBtn) return;

    const container = downloadBtn.parentElement;
    if (!container) return;

    let openBtn = document.getElementById("openInBrowserBtn");
    if (!openBtn) {
      openBtn = document.createElement("button");
      openBtn.id = "openInBrowserBtn";
      openBtn.className = "btn-secondary flex-1";
      openBtn.innerHTML = `
        <span class="flex items-center justify-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M14 3h7v7m0-7L10 14m-1 7H3a2 2 0 01-2-2V9a2 2 0 012-2h6" />
          </svg>
          Buka di Web
        </span>
      `;
      container.insertBefore(openBtn, downloadBtn);
      openBtn.addEventListener("click", () => this.handleOpenInBrowser());
    }
  }

  handleOpenInBrowser() {
    if (this.generatedViewerUrl) {
      window.open(this.generatedViewerUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Fallback: if we only have signed URL, open that
    if (this.generatedSignedUrl) {
      window.open(this.generatedSignedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Last fallback: create object URL from blob
    if (this.generatedDocxBlob) {
      const url = URL.createObjectURL(this.generatedDocxBlob);
      window.open(url, "_blank", "noopener,noreferrer");
      // revoke later
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    this.showNotification("File belum tersedia untuk dibuka di web.", "warning");
  }

  // Generate document (DOCX)
 (DOCX)
  async generateDocument() {
    const formData = this.collectFormData();

    // 1) Prefer DB mapping + Storage template
    let templateRow = null;
    try {
      templateRow = await this.getTemplateRowForForm(formData);
    } catch (err) {
      console.warn("[Template] Gagal ambil mapping dari DB. Fallback ke templatePaths lokal.", err);
    }

    // 2) Fallback: legacy templatePaths if DB not ready
    const legacyTemplatePath =
      typeof this.resolveTemplatePath === "function" ? this.resolveTemplatePath(formData) : null;

    const filename = this.generateFilename(formData);
    this.generatedFilename = filename;

    // If templateRow found, generate real DOCX now
    if (templateRow) {
      const payload = this.buildDocxPayload(formData);

      await this.generateDocxFromSupabaseTemplate({
        templateRow,
        payload,
        filename,
      });

      // Auto-open the generated letter in a web viewer (preferred),
      // so users don't need to open local storage.
      if (this.generatedViewerUrl) {
        const w = window.open(
          this.generatedViewerUrl,
          "_blank",
          "noopener,noreferrer"
        );
        if (!w) {
          this.showNotification(
            "Pop-up diblokir browser. Klik tombol 'Buka di Web' di modal.",
            "info"
          );
        }
      } else if (this.generatedSignedUrl) {
        const w = window.open(
          this.generatedSignedUrl,
          "_blank",
          "noopener,noreferrer"
        );
        if (!w) {
          this.showNotification(
            "Pop-up diblokir browser. Klik tombol 'Buka di Web' di modal.",
            "info"
          );
        }
      }

      console.log("[Template] Using Supabase template:", templateRow);
      return;
    }

        // If no templateRow in DB, try the Python-style computed Storage path (no DB row needed)
    try {
      const payload = this.buildDocxPayload(formData);
      await this.generateDocxFromComputedPath({ keys, payload, filename });

      // Auto-open web viewer if available
      if (this.generatedViewerUrl) {
        const w = window.open(
          this.generatedViewerUrl,
          "_blank",
          "noopener,noreferrer"
        );
        if (!w) {
          this.showNotification(
            "Pop-up diblokir browser. Klik tombol 'Buka di Web' di modal.",
            "info"
          );
        }
      } else if (this.generatedSignedUrl) {
        const w = window.open(
          this.generatedSignedUrl,
          "_blank",
          "noopener,noreferrer"
        );
        if (!w) {
          this.showNotification(
            "Pop-up diblokir browser. Klik tombol 'Buka di Web' di modal.",
            "info"
          );
        }
      }

      console.log("[Template] Using computed Storage path (no DB row).");
      return;
    } catch (e) {
      console.warn("[Template] Computed path failed, fallback to legacy:", e);
    }

// If no templateRow, keep old behavior (no real docx generation)
    console.log("Form Data:", formData);
    console.log("Template Path (legacy):", legacyTemplatePath);

    // You can surface a warning so you know mapping isn't configured yet
    this.showNotification(
      "Mapping template belum ditemukan di DB. Pastikan tabel letter_templates & file di Storage sudah diset.",
      "warning"
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

    this.ensureSuccessModalActions();

    // Add success animation
    anime({
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
    // Prefer downloading from Supabase signed URL (if uploaded)
    if (this.generatedSignedUrl) {
      const a = document.createElement("a");
      a.href = this.generatedSignedUrl;
      a.download = this.generatedFilename || "surat.docx";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      this.showNotification("Mengunduh surat...", "success");
      this.closeSuccessModal();
      return;
    }

    // Fallback: download local blob
    if (this.generatedDocxBlob && window.saveAs) {
      window.saveAs(
        this.generatedDocxBlob,
        this.generatedFilename || "surat.docx"
      );
      this.showNotification("Mengunduh surat...", "success");
      this.closeSuccessModal();
      return;
    }

    this.showNotification("File belum tersedia untuk diunduh.", "warning");
  }

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
    anime({
      targets: notification,
      translateX: [300, 0],
      opacity: [0, 1],
      duration: 500,
      easing: "easeOutQuart",
    });

    // Remove after 3 seconds
    setTimeout(() => {
      anime({
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
  new LetterGenerator();
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
