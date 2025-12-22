// Main JavaScript for Template Letter Generator
// Handles all form interactions, validation, and document generation

class LetterGenerator {
    constructor() {
        this.formData = {};
        this.isGenerating = false;
        this.init();
    }

    init() {
        this.initializeUI();
        this.setupEventListeners();
        this.loadFormState();
        this.initializeCharts();
        this.startParticleAnimation();
        this.populateTimeSlots();
        this.populateFacilitators();
        this.populateBTSPrograms();
        this.applyVisibilityRules();
    }

    // Initialize UI components
    initializeUI() {
        // Initialize typewriter effect
        if (document.getElementById('typewriter')) {
            new Typed('#typewriter', {
                strings: ['Generator Surat Template', 'Pembuat Dokumen Otomatis', 'Surat Formal Profesional'],
                typeSpeed: 60,
                backSpeed: 40,
                backDelay: 2000,
                loop: true,
                cursorChar: '|',
                autoInsertCss: true
            });
        }

        // Initialize splitting.js for text animations
        if (typeof Splitting !== 'undefined') {
            Splitting();
        }

        // Initialize progress bar
        this.updateProgressBar();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Main form change listeners
        document.getElementById('jenisSurat').addEventListener('change', (e) => this.handleJenisSuratChange(e));
        document.getElementById('sifatSurat').addEventListener('change', (e) => this.handleSifatSuratChange(e));
        document.getElementById('jenisKurikulum').addEventListener('change', (e) => this.handleJenisKurikulumChange(e));

        // Checkbox listeners
        document.getElementById('lingkupInternal').addEventListener('change', () => {
    this.updateProgressBar();
    this.applyVisibilityRules();
    this.saveFormState();
});
document.getElementById('lingkupEksternal').addEventListener('change', () => {
    this.updateProgressBar();
    this.applyVisibilityRules();
    this.saveFormState();
});

        // Variant listeners
        document.getElementById('varianIndividu').addEventListener('change', () => this.handleVariantChange());
        document.getElementById('varianPenugasan').addEventListener('change', () => this.handleVariantChange());
        document.getElementById('varianKelompok').addEventListener('change', () => this.handleVariantChange());

        // BTS listeners
        document.getElementById('jumlahBTS').addEventListener('change', (e) => this.handleJumlahBTSChange(e));
        document.getElementById('btsPelatihan1').addEventListener('change', (e) => this.handleBTSPelatihanChange(e, 1));
        document.getElementById('btsPelatihan2').addEventListener('change', (e) => this.handleBTSPelatihanChange(e, 2));
        document.getElementById('btsPelatihan3').addEventListener('change', (e) => this.handleBTSPelatihanChange(e, 3));

        // Facilitator listeners
        document.getElementById('jumlahFasilitator').addEventListener('change', (e) => this.handleJumlahFasilitatorChange(e));
        document.getElementById('namaFasilitator1').addEventListener('change', (e) => this.handleFasilitatorChange(e, 1));
        document.getElementById('namaFasilitator2').addEventListener('change', (e) => this.handleFasilitatorChange(e, 2));
        document.getElementById('namaFasilitator3').addEventListener('change', (e) => this.handleFasilitatorChange(e, 3));

        // Button listeners
        document.getElementById('generateBtn').addEventListener('click', () => this.handleGenerate());
        document.getElementById('resetBtn').addEventListener('click', () => this.handleReset());
        document.getElementById('previewBtn').addEventListener('click', () => this.handlePreview());

        // Modal listeners
        document.getElementById('closeSuccessBtn').addEventListener('click', () => this.closeSuccessModal());
        document.getElementById('downloadBtn').addEventListener('click', () => this.handleDownload());

        // Form field listeners for auto-save
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', () => this.saveFormState());
            input.addEventListener('input', () => this.saveFormState());
        });

        // Real-time validation
        formInputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
        });
    }

    // Handle jenis surat change
    handleJenisSuratChange(event) {
        const value = event.target.value;
        const curriculumSection = document.getElementById('curriculumSection');
        const btsSection = document.getElementById('btsSection');

        if (value === 'Kurikulum Silabus') {
            this.showSection(curriculumSection);
            this.hideSection(btsSection);
        } else if (value === 'Bahan Tayang Standar') {
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
        const facilitatorSection = document.getElementById('facilitatorSection');

        if (value === 'undangan') {
            this.showSection(facilitatorSection);
        } else if (value === 'hasil') {
            this.hideSection(facilitatorSection);
        }

        this.updateProgressBar();
        this.saveFormState();
    }

    // Handle jenis kurikulum change
    handleJenisKurikulumChange(event) {
        const value = event.target.value;
        const perihalKPKSection = document.getElementById('perihalKPKSection');
        const tahapECPSection = document.getElementById('tahapECPSection');

        if (value === 'KPK') {
            this.showSection(perihalKPKSection);
            this.hideSection(tahapECPSection);
        } else if (value === 'ECP') {
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
        const individu = document.getElementById('varianIndividu').checked;
        const penugasan = document.getElementById('varianPenugasan').checked;
        const kelompok = document.getElementById('varianKelompok').checked;

        const jumlahFasilitatorSection = document.getElementById('jumlahFasilitatorSection');
        const institutionSection = document.getElementById('institutionSection');

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
            btsTrainingPrograms[selectedProgram].forEach(topic => {
                const option = document.createElement('option');
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
            const kelompok = document.getElementById('varianKelompok').checked;
            if (kelompok) {
                count = parseInt(document.getElementById('jumlahFasilitator').value) || 0;
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
        const institutionDiv = document.getElementById(`instansiFasilitator${index}`);

        if (selectedName) {
            const facilitator = facilitators.find(f => f.nama === selectedName);
            if (facilitator) {
                institutionDiv.textContent = `Instansi: ${facilitator.perusahaan}`;
            }
        } else {
            institutionDiv.textContent = '';
        }

        this.updateProgressBar();
        this.saveFormState();
    }

    // Show section with animation
    showSection(element) {
        element.classList.remove('section-hidden');
        element.classList.add('section-visible');

        anime({
            targets: element,
            opacity: [0, 1],
            translateY: [-20, 0],
            duration: 500,
            easing: 'easeOutQuart'
        });
    }

    // Hide section with animation
    hideSection(element) {
        element.classList.remove('section-visible');
        element.classList.add('section-hidden');
    }

    // ===== VISIBILITY RULE HELPERS (HIDE instead of DISABLE) =====

    // Find wrapper for a field (prefer `${fieldId}Group`)
    getFieldWrapper(fieldId) {
        const input = document.getElementById(fieldId);
        if (!input) return null;

        return (
            document.getElementById(`${fieldId}Group`) ||
            input.closest('.form-group') ||
            input.closest('.field-group') ||
            input.parentElement
        );
    }

    // Hide/show a field wrapper, and clear when hidden
    setFieldVisible(fieldId, visible, clearWhenHidden = true) {
        const input = document.getElementById(fieldId);
        const wrapper = this.getFieldWrapper(fieldId);
        if (!input || !wrapper) return;

        wrapper.style.display = visible ? '' : 'none';

        if (!visible && clearWhenHidden) {
            if (input.type === 'checkbox' || input.type === 'radio') input.checked = false;
            else input.value = '';

            const err = document.getElementById(`${fieldId}Error`);
            if (err) err.classList.remove('show');
        }
    }

    // Return true if a field is visible (wrapper not hidden)
    isFieldVisible(fieldId) {
        const wrapper = this.getFieldWrapper(fieldId);
        if (!wrapper) return true; // if wrapper missing, assume visible
        return wrapper.style.display !== 'none';
    }

    // Apply your business rules by hiding fields
applyVisibilityRules() {
    const jenisSurat = document.getElementById('jenisSurat')?.value || '';
    const jenisKurikulum = document.getElementById('jenisKurikulum')?.value || '';

    const varianPenugasan = document.getElementById('varianPenugasan')?.checked || false;

    // Rule 1 & 2: hide mitraKerjasama + topikRapat
    const hideMitraAndTopik =
        (jenisSurat === 'Bahan Tayang Standar') ||
        (jenisSurat === 'Kurikulum Silabus' && jenisKurikulum === 'ECP');

    this.setFieldVisible('mitraKerjasama', !hideMitraAndTopik, true);
    this.setFieldVisible('topikRapat', !hideMitraAndTopik, true);

    // Rule 3: if varian != penugasan then hide pimpinan + instansi
    const hidePimpinanInstansi = !varianPenugasan;
    this.setFieldVisible('pimpinan', !hidePimpinanInstansi, true);
    this.setFieldVisible('instansi', !hidePimpinanInstansi, true);

    // ===== NEW RULE: hide facilitator management when scope is ONLY internal =====
    const lingkupInternal = document.getElementById('lingkupInternal')?.checked || false;
    const lingkupEksternal = document.getElementById('lingkupEksternal')?.checked || false;

    const onlyInternal = lingkupInternal && !lingkupEksternal;
    const jenisNeedsHideFacilitator = (jenisSurat === 'Kurikulum Silabus' || jenisSurat === 'Bahan Tayang Standar');

    const shouldHideFacilitatorMgmt = onlyInternal && jenisNeedsHideFacilitator;

    const facilitatorSection = document.getElementById('facilitatorSection');
    const jumlahFasilitatorSection = document.getElementById('jumlahFasilitatorSection');
    const institutionSection = document.getElementById('institutionSection');

    if (shouldHideFacilitatorMgmt) {
        // Hide main facilitator area + related subsections
        if (facilitatorSection) this.hideSection(facilitatorSection);
        if (jumlahFasilitatorSection) this.hideSection(jumlahFasilitatorSection);
        if (institutionSection) this.hideSection(institutionSection);

        // Hide facilitator 1-3 blocks
        for (let i = 1; i <= 3; i++) {
            const sec = document.getElementById(`fasilitator${i}Section`);
            if (sec) this.hideSection(sec);
        }

        // Clear values so they don't linger in localStorage / formData
        const idsToClear = [
            'jumlahFasilitator',
            'namaFasilitator1', 'namaFasilitator2', 'namaFasilitator3',
            'varianIndividu', 'varianPenugasan', 'varianKelompok',
            'pimpinan', 'instansi'
        ];

        idsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
            else el.value = '';
        });
    } else {
        // Not forced hidden by internal-only rule.
        // Let existing logic decide visibility (sifatSurat / variant handlers).
        // If it's undangan, restore facilitator section; if hasil, keep hidden.
        const sifatSurat = document.getElementById('sifatSurat')?.value || '';
        if (facilitatorSection) {
            if (sifatSurat === 'undangan') this.showSection(facilitatorSection);
            else this.hideSection(facilitatorSection);
        }

        // Re-run variant UI logic to show/hide related sections correctly
        this.handleVariantChange();
    }
}



    // Populate time slots dropdown
    populateTimeSlots() {
        const timeDropdown = document.getElementById('waktuPelaksanaan');
        timeSlots.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeDropdown.appendChild(option);
        });
    }

    // Populate facilitators dropdown
    populateFacilitators() {
        const facilitatorDropdowns = [
            document.getElementById('namaFasilitator1'),
            document.getElementById('namaFasilitator2'),
            document.getElementById('namaFasilitator3')
        ];

        facilitatorDropdowns.forEach(dropdown => {
            if (dropdown) {
                facilitators.forEach(facilitator => {
                    const option = document.createElement('option');
                    option.value = facilitator.nama;
                    option.textContent = facilitator.nama;
                    dropdown.appendChild(option);
                });
            }
        });
    }

    // Populate BTS programs dropdown
    populateBTSPrograms() {
        const btsDropdowns = [
            document.getElementById('btsPelatihan1'),
            document.getElementById('btsPelatihan2'),
            document.getElementById('btsPelatihan3')
        ];

        btsDropdowns.forEach(dropdown => {
            if (dropdown) {
                Object.keys(btsTrainingPrograms).forEach(program => {
                    const option = document.createElement('option');
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
        const progress = requiredFields.length > 0 ? (completedFields / requiredFields.length) * 100 : 0;

        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            anime({
                targets: progressBar,
                width: `${progress}%`,
                duration: 500,
                easing: 'easeOutQuart'
            });
        }
    }

    // Get required fields based on current selections
    getRequiredFields() {
        const jenisSurat = document.getElementById('jenisSurat').value;
        const sifatSurat = document.getElementById('sifatSurat').value;
        const jenisKurikulum = document.getElementById('jenisKurikulum').value;
        const perihalKPK = document.getElementById('perihalKPK').value;

        // Base required fields (topikRapat is conditional now)
        let requiredFields = ['jenisSurat', 'sifatSurat', 'bulanSurat', 'tanggalPelaksanaan'];

        // Only require topikRapat if visible
        if (this.isFieldVisible('topikRapat')) {
            requiredFields.push('topikRapat');
        }

        if (jenisSurat === 'Kurikulum Silabus') {
            requiredFields.push('jenisKurikulum');

            if (jenisKurikulum === 'KPK') {
                requiredFields.push('perihalKPK');

                // Only require mitraKerjasama if visible AND perihal demands it
                if (perihalKPK === 'persiapan pelatihan' && this.isFieldVisible('mitraKerjasama')) {
                    requiredFields.push('mitraKerjasama');
                }
            } else if (jenisKurikulum === 'ECP') {
                requiredFields.push('tahapECP');
            }
        } else if (jenisSurat === 'Bahan Tayang Standar') {
            requiredFields.push('jumlahBTS', 'btsPelatihan1', 'btsMateri1');
        }

        if (sifatSurat === 'undangan') {
            requiredFields.push('waktuPelaksanaan');

            const lingkupEksternal = document.getElementById('lingkupEksternal').checked;
            if (lingkupEksternal) {
                const varianKelompok = document.getElementById('varianKelompok').checked;
                if (varianKelompok) {
                    requiredFields.push('jumlahFasilitator');
                }
            }
        }

        // If pimpinan/instansi are hidden, do not require them (future proof)
        // (You didn't require them before, but this keeps it consistent.)
        requiredFields = requiredFields.filter(fid => this.isFieldVisible(fid));

        return requiredFields;
    }


    // Get count of completed required fields
    getCompletedFields(requiredFields) {
        let count = 0;
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value && field.value.trim() !== '') {
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
            errorElement.classList.remove('show');
        }

        // Check if field is required
        const requiredFields = this.getRequiredFields();
        if (requiredFields.includes(fieldId) && !value) {
            this.showFieldError(fieldId, `${fieldLabels[fieldId] || fieldId} harus diisi`);
            return false;
        }

        // Field-specific validations
        switch (fieldId) {
            case 'tanggalPelaksanaan':
                if (value) {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                        this.showFieldError(fieldId, 'Tanggal tidak boleh kurang dari hari ini');
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
            errorElement.classList.add('show');
        }
    }

    // Validate entire form
    validateForm() {
        const requiredFields = this.getRequiredFields();
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        // Check scope selection
        const lingkupInternal = document.getElementById('lingkupInternal').checked;
        const lingkupEksternal = document.getElementById('lingkupEksternal').checked;
        if (!lingkupInternal && !lingkupEksternal) {
            alert('Silakan pilih minimal satu lingkup surat (Internal atau Eksternal)');
            isValid = false;
        }

        return isValid;
    }

    // Handle generate button click
    handleGenerate() {
        if (this.isGenerating) return;

        if (!this.validateForm()) {
            this.showNotification('Mohon lengkapi semua field yang diperlukan', 'error');
            return;
        }

        this.isGenerating = true;
        this.showLoadingModal();

        // Simulate document generation
        setTimeout(() => {
            this.generateDocument();
            this.hideLoadingModal();
            this.showSuccessModal();
            this.isGenerating = false;
        }, 2000);
    }

    // Generate document
    generateDocument() {
        const formData = this.collectFormData();
        const templatePath = this.resolveTemplatePath(formData);

        console.log('Form Data:', formData);
        console.log('Template Path:', templatePath);

        // In a real implementation, this would:
        // 1. Send form data to server
        // 2. Server would load template
        // 3. Replace placeholders with form data
        // 4. Generate DOCX file
        // 5. Return file for download

        this.generatedFilename = this.generateFilename(formData);
    }

    // Collect all form data
    collectFormData() {
        const data = {};

        // Basic fields
        data.jenisSurat = document.getElementById('jenisSurat').value;
        data.sifatSurat = document.getElementById('sifatSurat').value;
        data.jenisKurikulum = document.getElementById('jenisKurikulum').value;
        data.perihalKPK = document.getElementById('perihalKPK').value;
        data.bulanSurat = document.getElementById('bulanSurat').value;
        data.lampiran = document.getElementById('lampiran').value;
        data.mitraKerjasama = document.getElementById('mitraKerjasama').value;
        data.topikRapat = document.getElementById('topikRapat').value;
        data.tanggalPelaksanaan = document.getElementById('tanggalPelaksanaan').value;
        data.waktuPelaksanaan = document.getElementById('waktuPelaksanaan').value;
        data.tahapECP = document.getElementById('tahapECP').value;

        // Scope
        data.lingkupInternal = document.getElementById('lingkupInternal').checked;
        data.lingkupEksternal = document.getElementById('lingkupEksternal').checked;

        // BTS
        data.jumlahBTS = document.getElementById('jumlahBTS').value;
        data.btsPelatihan1 = document.getElementById('btsPelatihan1').value;
        data.btsMateri1 = document.getElementById('btsMateri1').value;
        data.btsPelatihan2 = document.getElementById('btsPelatihan2').value;
        data.btsMateri2 = document.getElementById('btsMateri2').value;
        data.btsPelatihan3 = document.getElementById('btsPelatihan3').value;
        data.btsMateri3 = document.getElementById('btsMateri3').value;

        // Facilitators
        data.varianIndividu = document.getElementById('varianIndividu').checked;
        data.varianPenugasan = document.getElementById('varianPenugasan').checked;
        data.varianKelompok = document.getElementById('varianKelompok').checked;
        data.jumlahFasilitator = document.getElementById('jumlahFasilitator').value;
        data.namaFasilitator1 = document.getElementById('namaFasilitator1').value;
        data.namaFasilitator2 = document.getElementById('namaFasilitator2').value;
        data.namaFasilitator3 = document.getElementById('namaFasilitator3').value;
        data.pimpinan = document.getElementById('pimpinan').value;
        data.instansi = document.getElementById('instansi').value;

        // Get institution names for facilitators
        if (data.namaFasilitator1) {
            const f1 = facilitators.find(f => f.nama === data.namaFasilitator1);
            data.instansiFasilitator1 = f1 ? f1.perusahaan : '';
        }
        if (data.namaFasilitator2) {
            const f2 = facilitators.find(f => f.nama === data.namaFasilitator2);
            data.instansiFasilitator2 = f2 ? f2.perusahaan : '';
        }
        if (data.namaFasilitator3) {
            const f3 = facilitators.find(f => f.nama === data.namaFasilitator3);
            data.instansiFasilitator3 = f3 ? f3.perusahaan : '';
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
            let scope = 'internal';
            if (data.lingkupEksternal && !data.lingkupInternal) {
                scope = 'eksternal';
            } else if (data.lingkupInternal && data.lingkupEksternal) {
                scope = 'eksternal'; // Default to external if both selected
            }

            path = path[scope];
            if (!path) return null;

            // Handle specific curriculum types
            if (data.jenisSurat === 'Kurikulum Silabus') {
                if (data.jenisKurikulum === 'KPK') {
                    path = path[data.jenisKurikulum];
                    if (path && data.perihalKPK) {
                        path = path[data.perihalKPK];
                    }
                } else if (data.jenisKurikulum === 'ECP') {
                    path = path[data.jenisKurikulum] || path['default'];
                }
            }

            // Handle variant for undangan external
            if (data.sifatSurat === 'undangan' && scope === 'eksternal') {
                if (data.varianIndividu) {
                    path = path['individu'];
                } else if (data.varianPenugasan) {
                    path = path['penugasan'];
                } else if (data.varianKelompok) {
                    path = path['kelompok'];
                }
            }

            // Default path if specific path not found
            if (typeof path === 'object' && path['default']) {
                path = path['default'];
            }

            return typeof path === 'string' ? path : null;
        } catch (error) {
            console.error('Error resolving template path:', error);
            return null;
        }
    }

    // Generate filename
    generateFilename(data) {
        let filename = 'surat_';

        // Add scope
        if (data.lingkupEksternal) {
            filename += 'eksternal_';
        } else {
            filename += 'internal_';
        }

        // Add letter type
        filename += data.jenisSurat.toLowerCase().replace(/\s+/g, '_') + '_';

        // Add specific identifier
        if (data.jenisSurat === 'Kurikulum Silabus') {
            if (data.jenisKurikulum === 'KPK' && data.perihalKPK) {
                filename += data.perihalKPK.replace(/\s+/g, '_') + '_';
            } else if (data.jenisKurikulum === 'ECP' && data.tahapECP) {
                filename += data.tahapECP.replace(/\s+/g, '_') + '_';
            }
        } else if (data.jenisSurat === 'Bahan Tayang Standar' && data.btsMateri1) {
            filename += data.btsMateri1.replace(/\s+/g, '_') + '_';
        }

        // Add topic
        if (data.topikRapat) {
            filename += data.topikRapat.replace(/\s+/g, '_').substring(0, 30) + '_';
        }

        // Add variant for undangan external
        if (data.sifatSurat === 'undangan' && data.lingkupEksternal) {
            if (data.varianIndividu) {
                filename += 'individu_';
            } else if (data.varianPenugasan) {
                filename += 'penugasan_';
            } else if (data.varianKelompok) {
                filename += 'kelompok_';
            }
        }

        // Add date and extension
        const today = new Date();
        filename += today.getFullYear() + '_' +
            (today.getMonth() + 1).toString().padStart(2, '0') + '_' +
            today.getDate().toString().padStart(2, '0') + '.docx';

        return filename;
    }

    // Handle reset button click
    handleReset() {
        if (confirm('Apakah Anda yakin ingin mereset semua field?')) {
            document.getElementById('letterForm').reset();
            this.clearAllErrors();
            this.hideAllConditionalSections();
            this.updateProgressBar();
            localStorage.removeItem('letterFormState');
            this.showNotification('Form berhasil direset', 'success');
        }
    }

    // Clear all error messages
    clearAllErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.classList.remove('show');
        });
    }

    // Hide all conditional sections
    hideAllConditionalSections() {
        const conditionalSections = [
            'curriculumSection',
            'btsSection',
            'facilitatorSection',
            'perihalKPKSection',
            'tahapECPSection',
            'jumlahFasilitatorSection',
            'institutionSection'
        ];

        conditionalSections.forEach(sectionId => {
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
        this.showNotification('Fitur preview akan segera tersedia', 'info');
    }

    // Show loading modal
    showLoadingModal() {
        document.getElementById('loadingModal').classList.remove('hidden');
    }

    // Hide loading modal
    hideLoadingModal() {
        document.getElementById('loadingModal').classList.add('hidden');
    }

    // Show success modal
    showSuccessModal() {
        document.getElementById('successModal').classList.remove('hidden');

        // Add success animation
        anime({
            targets: '#successModal .bg-white',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutBack'
        });
    }

    // Close success modal
    closeSuccessModal() {
        document.getElementById('successModal').classList.add('hidden');
    }

    // Handle download button click
    handleDownload() {
        // In a real implementation, this would trigger the actual file download
        this.showNotification('File siap diunduh', 'success');
        this.closeSuccessModal();

        // Simulate download
        const link = document.createElement('a');
        link.href = '#';
        link.download = this.generatedFilename || 'surat_template.docx';
        link.click();
    }

    // Save form state to localStorage
    saveFormState() {
        const formData = {};
        const formElements = document.querySelectorAll('input, select, textarea');

        formElements.forEach(element => {
            if (element.type === 'checkbox') {
                formData[element.id] = element.checked;
            } else {
                formData[element.id] = element.value;
            }
        });

        localStorage.setItem('letterFormState', JSON.stringify(formData));
    }

    // Load form state from localStorage
    loadFormState() {
        const savedState = localStorage.getItem('letterFormState');
        if (!savedState) return;

        try {
            const formData = JSON.parse(savedState);

            Object.keys(formData).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = formData[fieldId];
                    } else {
                        field.value = formData[fieldId];
                    }
                }
            });

            // Trigger change events to update UI
            setTimeout(() => {
                document.getElementById('jenisSurat').dispatchEvent(new Event('change'));
                document.getElementById('sifatSurat').dispatchEvent(new Event('change'));
                document.getElementById('jenisKurikulum').dispatchEvent(new Event('change'));
                document.getElementById('jumlahBTS').dispatchEvent(new Event('change'));
                document.getElementById('jumlahFasilitator').dispatchEvent(new Event('change'));
                this.handleVariantChange();
                this.applyVisibilityRules();
                this.updateProgressBar();
            }, 100);

        } catch (error) {
            console.error('Error loading form state:', error);
        }
    }

    // Initialize charts
    initializeCharts() {
        this.initLetterTypeChart();
        this.initMonthlyChart();
    }

    // Initialize letter type usage chart
    initLetterTypeChart() {
        const chartElement = document.getElementById('letterTypeChart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left'
            },
            series: [{
                name: 'Jenis Surat',
                type: 'pie',
                radius: '50%',
                data: [{
                        value: templateUsageStats.letterTypes['Kurikulum Silabus'],
                        name: 'Kurikulum Silabus'
                    },
                    {
                        value: templateUsageStats.letterTypes['Bahan Tayang Standar'],
                        name: 'Bahan Tayang Standar'
                    }
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                itemStyle: {
                    color: function(params) {
                        const colors = ['#1a365d', '#d69e2e'];
                        return colors[params.dataIndex];
                    }
                }
            }]
        };

        chart.setOption(option);

        // Responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    // Initialize monthly usage chart
    initMonthlyChart() {
        const chartElement = document.getElementById('monthlyChart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        const months = Object.keys(templateUsageStats.monthlyUsage);
        const values = Object.values(templateUsageStats.monthlyUsage);

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: months,
                axisTick: {
                    alignWithLabel: true
                }
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                name: 'Jumlah Surat',
                type: 'bar',
                barWidth: '60%',
                data: values,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#1a365d'
                        },
                        {
                            offset: 1,
                            color: '#4a5568'
                        }
                    ])
                }
            }]
        };

        chart.setOption(option);

        // Responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    // Start particle animation
    startParticleAnimation() {
        const container = document.getElementById('particleContainer');
        if (!container) return;

        // Simple particle animation with CSS
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
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
        if (!document.getElementById('particleAnimation')) {
            const style = document.createElement('style');
            style.id = 'particleAnimation';
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
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        anime({
            targets: notification,
            translateX: [300, 0],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutQuart'
        });

        // Remove after 3 seconds
        setTimeout(() => {
            anime({
                targets: notification,
                translateX: [0, 300],
                opacity: [1, 0],
                duration: 500,
                easing: 'easeInQuart',
                complete: () => {
                    document.body.removeChild(notification);
                }
            });
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LetterGenerator();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible, refresh any needed data
        console.log('Page became visible');
    }
});

// Handle beforeunload to save form state
window.addEventListener('beforeunload', () => {
    // Form state is already saved on each change
    console.log('Saving form state before unload');
});