// src/public/letterGen/main.js

class LetterGenerator {
  constructor() {
    this.formData = {};
    this.isGenerating = false;
    this.generatedBlob = null;
    this.generatedFilename = null;
    this.generatedFileUrl = null; 
    this.templateUrl = null;      
    this.currentUser = { username: "sadiro" }; 
    
    // ============================================================
    // ⚠️ IMPORTANT: PASTE YOUR REAL GOOGLE CLIENT ID BELOW
    // Go to https://console.cloud.google.com/apis/credentials
    // ============================================================
    this.GOOGLE_CLIENT_ID = '15549700374-urha9ddap4kb61q6is6n95kq752p2g12.apps.googleusercontent.com'; 
    
    this.tokenClient = null;
    this.accessToken = null;

    // Default data if database is empty
    this.defaultFacilitators = [
        { nama: "Fasilitator 1", perusahaan: "Instansi A" },
        { nama: "Fasilitator 2", perusahaan: "Instansi B" }
    ];
    this.facilitators = [];

    this.init().catch((err) => console.error("Init error:", err));
  }

  safeAnime(config) {
    try {
      if (window.anime) return window.anime(config);
      const targets = config?.targets;
      const applyWidth = config?.width;
      if (targets && applyWidth != null) {
        const els = typeof targets === "string" ? Array.from(document.querySelectorAll(targets)) : 
                    targets instanceof Element ? [targets] : 
                    Array.isArray(targets) ? targets : [];
        els.forEach((el) => { try { el.style.width = applyWidth; } catch (_) {} });
      }
    } catch (e) { console.warn("Animation error:", e); }
    return null;
  }

  async init() {
    // 1. Validate Config
    if (this.GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
        alert("SETUP REQUIRED: Buka main.js dan masukkan Google Client ID Anda di baris 17!");
    }

    // 2. Setup UI
    this.populateTimeSlots();
    this.initializeUI();
    this.initGoogleAuth(); 
    this.setupEventListeners();
    this.loadFormState();
    
    try { this.initializeCharts(); } catch(e) {}
    try { this.startParticleAnimation(); } catch(e) {}

    // 3. Load Data (With Fallback)
    this.populateFacilitators({ loading: true });
    
    // Try Supabase, if fail use defaults
    const loaded = await this.refreshFacilitatorsFromSupabase();
    if (!loaded || this.facilitators.length === 0) {
        console.warn("Using default facilitators");
        this.facilitators = this.defaultFacilitators;
    }
    
    this.populateFacilitators();
    this.populateBTSPrograms();
    
    // 4. Force Update UI Rules
    this.applyVisibilityRules();
  }

  initializeUI() {
    if (document.getElementById("typewriter")) {
      new Typed("#typewriter", {
        strings: ["Generator Surat Template", "Pembuat Dokumen Otomatis", "Surat Formal Profesional"],
        typeSpeed: 60, backSpeed: 40, backDelay: 2000, loop: true, cursorChar: "|", autoInsertCss: true,
      });
    }
    if (typeof Splitting !== "undefined") Splitting();
    this.updateProgressBar();
  }

  // --- GOOGLE AUTH ---
  initGoogleAuth() {
    if (window.google) {
      try {
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                this.accessToken = tokenResponse.access_token;
                console.log("Google Auth Success");
                if (this.isGenerating) this.handleGenerate();
              }
            },
          });
      } catch(e) {
          console.error("GSI Error:", e);
      }
    } else {
      console.error("GSI script not loaded");
    }
  }

  // --- LISTENERS ---
  // --- DATA LOADING ---
  async refreshFacilitatorsFromSupabase() {
    try {
      const client = await this.getSupabaseClient(); 
      if(!client) return false;
      
      const table = window.SUPABASE_FACILITATORS_TABLE || "facilitators";
      const { data, error } = await client.from(table).select("nama, perusahaan").order("nama");
      
      if(error) throw error;
      
      if(data?.length) { 
          this.facilitators = data; 
          console.log("[Generator] Loaded facilitators:", data.length);
          return true; 
      }
    } catch(e) { 
        console.warn("Supabase fetch failed:", e); 
    }
    return false;
  }

  populateFacilitators(opts={}) {
    [1,2,3].forEach(i => {
      const el=document.getElementById(`namaFasilitator${i}`); if(!el) return;
      
      // Keep selected value if any
      const currentVal = el.value;
      
      el.innerHTML = opts.loading ? "<option>Loading...</option>" : '<option value="">-- Pilih --</option>';
      if(!opts.loading) {
          this.facilitators.forEach(f => { 
              const o=document.createElement("option"); 
              o.value=f.nama; 
              o.textContent=f.nama; 
              el.appendChild(o); 
          });
          // Restore value if still valid
          if(currentVal) el.value = currentVal;
      }
    });
  }

  setupEventListeners() {
    const addListener = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    };

    addListener("jenisSurat", "change", (e) => this.handleJenisSuratChange(e));
    addListener("sifatSurat", "change", (e) => this.handleSifatSuratChange(e));
    addListener("jenisKurikulum", "change", (e) => this.handleJenisKurikulumChange(e));
    addListener("lingkupInternal", "change", () => { this.applyVisibilityRules(); this.updateProgressBar(); this.saveFormState(); });
    addListener("lingkupEksternal", "change", () => { this.applyVisibilityRules(); this.updateProgressBar(); this.saveFormState(); });
    addListener("varianIndividu", "change", () => this.handleVariantChange());
    addListener("varianPenugasan", "change", () => this.handleVariantChange());
    addListener("varianKelompok", "change", () => this.handleVariantChange());
    addListener("jumlahBTS", "change", (e) => this.handleJumlahBTSChange(e));
    [1, 2, 3].forEach(i => addListener(`btsPelatihan${i}`, "change", (e) => this.handleBTSPelatihanChange(e, i)));
    addListener("jumlahFasilitator", "change", (e) => this.handleJumlahFasilitatorChange(e));
    [1, 2, 3].forEach(i => addListener(`namaFasilitator${i}`, "change", (e) => this.handleFasilitatorChange(e, i)));

    addListener("generateBtn", "click", () => this.handleGenerate());
    addListener("resetBtn", "click", () => this.handleReset());
    addListener("formPreviewBtn", "click", () => alert("Klik 'Generate Surat' terlebih dahulu."));

    addListener("modalPreviewBtn", "click", () => this.handlePreview()); 
    addListener("modalSendBtn", "click", () => this.handleSendToTask());
    addListener("modalDownloadBtn", "click", () => this.handleDownload());
    addListener("closeSuccessBtn", "click", () => this.closeSuccessModal());

    document.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("change", () => this.saveFormState());
      input.addEventListener("input", () => this.saveFormState());
      input.addEventListener("blur", (e) => this.validateField(e.target));
    });
  }

  // --- GOOGLE DRIVE LOGIC ---
  async findOrCreateFolder(name, parentId = 'root') {
    const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`;
    
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${this.accessToken}` } });
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) return searchData.files[0].id; 

    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const metadata = { name: name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };

    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    });
    const createData = await createRes.json();
    return createData.id;
  }

  async uploadToGoogleDrive(blob, filename, pathArray) {
    if (!this.accessToken) {
      this.tokenClient.requestAccessToken();
      throw new Error("Authentikasi Google dibutuhkan.");
    }

    console.log("[Generator] Uploading to GDrive:", pathArray.join('/'));
    let currentParentId = await this.findOrCreateFolder('generated-letters', 'root');

    for (const folderName of pathArray) {
      if(folderName && folderName.trim() !== "") {
         currentParentId = await this.findOrCreateFolder(folderName, currentParentId);
      }
    }

    const metadata = { name: filename, parents: [currentParentId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form
    });

    if (!res.ok) throw new Error("Gagal upload ke Google Drive.");
    const data = await res.json();
    return data.webViewLink;
  }

  // --- DRIVE HELPERS ---
  async fetchTemplateFromDrive(folderKey) {
    console.log("[Generator] Searching template for key:", folderKey);
    // 1. Find Root Template Folder
    const rootTemplateId = await this.findFolderId("templates_surat");
    if (!rootTemplateId) throw new Error("Folder 'templates_surat' tidak ditemukan di Google Drive.");

    // 2. Construct Path
    const pathParts = folderKey.split("/");
    const filename = `${pathParts.pop()}.docx`; // Last part is filename
    const folderPath = pathParts;

    // 3. Traverse
    let currentParentId = rootTemplateId;
    for (const folderName of folderPath) {
        const navId = await this.findFolderId(folderName, currentParentId);
        if (!navId) throw new Error(`Folder template tidak ditemukan: ${folderName}`);
        currentParentId = navId;
    }

    // 4. Find File
    const fileId = await this.findFileId(filename, currentParentId);
    if (!fileId) throw new Error(`File template tidak ditemukan: ${filename}`);

    return this.downloadFileBlob(fileId);
  }

  async findFolderId(name, parentId = 'root') {
      const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      const data = await res.json();
      return (data.files && data.files.length > 0) ? data.files[0].id : null;
  }

  async findFileId(name, parentId) {
      const q = `mimeType!='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      const data = await res.json();
      return (data.files && data.files.length > 0) ? data.files[0].id : null;
  }

  async downloadFileBlob(fileId) {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (!res.ok) throw new Error("Gagal mengunduh file template.");
      return await res.blob();
  }

  // --- GENERATION FLOW ---
  async handleGenerate() {
    if(this.isGenerating && this.accessToken) return;
    if(!this.validateForm()) { this.showNotification("Lengkapi form!", "error"); return; }
    
    this.isGenerating = true;
    this.showLoadingModal();
    
    try {
      if (!this.accessToken) {
         this.hideLoadingModal();
         this.tokenClient.requestAccessToken(); 
         return; 
      }

      const formData = this.collectFormData();
      const folderKey = this.generateFolderKey(formData);
      
      const username = this.currentUser.username || "user";
      const sifatFolder = OneDrivePathHelper.normalize(formData.sifatSurat); 
      const kurikulumFolder = formData.jenisKurikulum ? OneDrivePathHelper.normalize(formData.jenisKurikulum) : 'general';
      const pathArray = [username, sifatFolder, kurikulumFolder];

      const templateMetadata = await this.fetchTemplateMetadata(folderKey);
      let blob = null;
      if (templateMetadata && templateMetadata.share_url) {
          this.templateUrl = templateMetadata.share_url;
          blob = await this.downloadFileFromUrl(templateMetadata.share_url);
      } else {
          throw new Error(`Template not found: ${folderKey}`);
      }

      const payload = this.buildDocxPayload(formData);
      await this.ensureDocxLibsLoaded();
      const renderedBlob = this.renderDocx(await blob.arrayBuffer(), payload);
      
      this.generatedBlob = renderedBlob;
      this.generatedFilename = `surat_${OneDrivePathHelper.normalize(formData.sifatSurat)}_${Date.now()}.docx`;

      this.generatedFileUrl = await this.uploadToGoogleDrive(renderedBlob, this.generatedFilename, pathArray);
      
      this.showSuccessModal(); 

    } catch(e) {
      console.error(e);
      if (e.message.includes("Authentikasi")) {
          this.showNotification("Silakan Login Google", "info");
      } else {
          this.showNotification("Gagal: " + (e.message||"Error"), "error");
      }
    } finally {
      if (this.accessToken) { 
          this.hideLoadingModal();
          this.isGenerating = false;
      }
    }
  }

  // --- ACTIONS ---
  handleDownload() {
      if (this.generatedBlob && this.generatedFilename) {
          window.saveAs(this.generatedBlob, this.generatedFilename);
          this.showNotification("File diunduh.", "success");
      }
      this.closeSuccessModal();
  }

  handlePreview() {
      if (this.generatedFileUrl) {
          window.open(this.generatedFileUrl, "_blank");
          this.showNotification("Membuka file di GDrive...", "info");
      } else {
          alert("Link file belum tersedia.");
      }
  }

  handleSendToTask() {
      if (!this.generatedFileUrl) {
          alert("Link file belum tersedia.");
          return;
      }
      window.parent.postMessage({
          type: "SEND_GENERATED_LETTER",
          payload: {
              filename: this.generatedFilename,
              fileUrl: this.generatedFileUrl, 
              message: `Surat telah dibuat. Link GDrive: ${this.generatedFileUrl}`
          }
      }, "*");
      
      this.showNotification("Link terkirim!", "success");
      this.closeSuccessModal();
  }

  // --- DATA LOADING & POPULATION ---
  populateTimeSlots() {
    const el = document.getElementById("waktuPelaksanaan");
    if (el && el.tagName === 'SELECT') {
        el.innerHTML = '<option value="">-- Pilih Waktu --</option>';
        for(let h=7; h<=20; h++) {
            ['00', '30'].forEach(m => {
                const time = `${h.toString().padStart(2, '0')}:${m}`;
                const option = document.createElement("option");
                option.value = time;
                option.textContent = time;
                el.appendChild(option);
            });
        }
    }
  }



  // --- UI Helpers ---
  handleJenisSuratChange(e) { this.refreshUI(); }
  handleSifatSuratChange(e) { this.refreshUI(); }
  handleJenisKurikulumChange(e) { this.refreshUI(); }
  handleVariantChange() { this.refreshUI(); }
  handleJumlahBTSChange(e) { this.refreshUI(); }
  handleBTSPelatihanChange(e, i) { this.refreshUI(); }
  handleJumlahFasilitatorChange(e) { this.refreshUI(); }
  handleFasilitatorChange(e, i) { this.refreshUI(); }
  
  refreshUI() { this.applyVisibilityRules(); this.saveFormState(); }

  applyVisibilityRules() {
    const js = document.getElementById("jenisSurat")?.value;
    const jk = document.getElementById("jenisKurikulum")?.value;
    const ss = document.getElementById("sifatSurat")?.value;
    const varianPenugasan = document.getElementById("varianPenugasan")?.checked;
    const varianKelompok = document.getElementById("varianKelompok")?.checked;
    const varianIndividu = document.getElementById("varianIndividu")?.checked;

    const hideMitraTopik = js==="Bahan Tayang Standar" || (js==="Kurikulum Silabus" && jk==="ECP");
    this.setFieldVisible("mitraKerjasama", !hideMitraTopik);
    this.setFieldVisible("topikRapat", !hideMitraTopik);
    this.setFieldVisible("pimpinan", varianPenugasan);
    this.setFieldVisible("instansi", varianPenugasan);

    const fs = document.getElementById("facilitatorSection");
    if(fs) {
       // Only show facilitator section if 'jenisSurat' is selected
       if (js && js !== "") {
           this.showSection(fs);
       } else {
           this.hideSection(fs);
       }
    }

    // --- FACILITATOR LOGIC ---
    // 1. Show 'Jumlah Fasilitator' dropdown ONLY if Kelompok
    const jumlahSec = document.getElementById("jumlahFasilitatorSection");
    if(varianKelompok) this.showSection(jumlahSec); else this.hideSection(jumlahSec);

    // 2. Determine how many facilitators are active
    let n = 0;
    if (varianKelompok) {
        n = parseInt(document.getElementById("jumlahFasilitator")?.value) || 0;
    } else if (varianIndividu || varianPenugasan) {
        n = 1;
    }

    // 3. Show/Hide sections 1, 2, 3
    for(let i=1; i<=3; i++) {
        const sec = document.getElementById(`fasilitator${i}Section`);
        if (i <= n) this.showSection(sec); else this.hideSection(sec);
    }
  }

  async downloadFileFromUrl(url) {
      if (!url) throw new Error("URL kosong");
      if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
          const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
              try {
                  const exportUrl = `https://www.googleapis.com/drive/v3/files/${match[1]}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
                  const resp = await fetch(exportUrl, { headers: { Authorization: `Bearer ${this.accessToken}` } });
                  if (resp.ok) return await resp.blob();
              } catch(e) {}
              try {
                  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/document/d/${match[1]}/export?format=docx`)}`;
                  const resp = await fetch(proxyUrl);
                  if (resp.ok) return await resp.blob();
              } catch(e) {}
          }
      }
      return await (await fetch(url)).blob();
  }

  async fetchTemplateMetadata(folderKey) {
      const client = await this.getSupabaseClient();
      if(!client) return null;
      const { data } = await client.from('letter_templates').select('*').eq('folder_key', folderKey).maybeSingle();
      return data;
  }

  renderDocx(buf, data) {
    const zip = new window.PizZip(buf);
    const doc = new window.docxtemplater(zip, { paragraphLoop:true, linebreaks:true, delimiters:{start:"[", end:"]"} });
    doc.render(data);
    return doc.getZip().generate({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  }

  async ensureDocxLibsLoaded() {
    const load = (src) => new Promise(r => { if(document.querySelector(`script[src="${src}"]`)) return r(); const s=document.createElement("script"); s.src=src; s.onload=r; document.head.appendChild(s); });
    await load("https://cdn.jsdelivr.net/npm/pizzip@3.1.7/dist/pizzip.min.js");
    await load("https://cdn.jsdelivr.net/npm/docxtemplater@3.50.0/build/docxtemplater.js");
    await load("https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js");
  }

  buildDocxPayload(formData) {
    const safe = (v) => (v == null ? "" : String(v));
    const monthMap = { "Januari": "01", "Februari": "02", "Maret": "03", "April": "04", "Mei": "05", "Juni": "06", "Juli": "07", "Agustus": "08", "September": "09", "Oktober": "10", "November": "11", "Desember": "12" };
    const bulan = safe(formData.bulanSurat);
    const bulanAngka = monthMap[bulan] || "";
    let hariTanggal = "";
    if (formData.tanggalPelaksanaan) {
      try {
        const d = new Date(formData.tanggalPelaksanaan);
        hariTanggal = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
      } catch (e) { hariTanggal = formData.tanggalPelaksanaan; }
    }

    return {
      bulan_angka: bulanAngka,
      bulan_huruf: bulan,
      hari_tanggal: hariTanggal,
      waktu: safe(formData.waktuPelaksanaan),
      jenis_surat: safe(formData.jenisSurat),
      sifat_surat: safe(formData.sifatSurat),
      bulan_surat: bulan,
      lampiran: safe(formData.lampiran),
      mitra_kerjasama: safe(formData.mitraKerjasama),
      topik_rapat: safe(formData.topikRapat),
      fasilitator1: safe(formData.namaFasilitator1),
      instansi_fasilitator1: safe(formData.instansiFasilitator1),
      // Add other fields as needed
    };
  }

  collectFormData() {
    const d = {};
    const get = (id) => this.isFieldVisible(id) ? document.getElementById(id).value : "";
    const chk = (id) => this.isFieldVisible(id) ? document.getElementById(id).checked : false;
    d.jenisSurat=get("jenisSurat"); d.sifatSurat=get("sifatSurat"); d.jenisKurikulum=get("jenisKurikulum"); d.perihalKPK=get("perihalKPK");
    d.bulanSurat=get("bulanSurat"); d.lampiran=get("lampiran"); d.mitraKerjasama=get("mitraKerjasama"); d.topikRapat=get("topikRapat");
    d.tanggalPelaksanaan=get("tanggalPelaksanaan"); d.waktuPelaksanaan=get("waktuPelaksanaan"); d.tahapECP=get("tahapECP");
    d.lingkupInternal=chk("lingkupInternal"); d.lingkupEksternal=chk("lingkupEksternal");
    d.jumlahBTS=get("jumlahBTS"); d.btsPelatihan1=get("btsPelatihan1"); d.btsMateri1=get("btsMateri1");
    d.varianIndividu=chk("varianIndividu"); d.varianPenugasan=chk("varianPenugasan"); d.varianKelompok=chk("varianKelompok");
    d.jumlahFasilitator=get("jumlahFasilitator"); d.namaFasilitator1=get("namaFasilitator1"); d.pimpinan=get("pimpinan"); d.instansi=get("instansi");
    [1,2,3].forEach(n => { d[`namaFasilitator${n}`] = get(`namaFasilitator${n}`); if(d[`namaFasilitator${n}`]) { const f = this.facilitators.find(x=>x.nama===d[`namaFasilitator${n}`]); d[`instansiFasilitator${n}`] = f ? f.perusahaan : ""; } else d[`instansiFasilitator${n}`] = ""; });
    return d;
  }

  validateField(field) {
    if (!field) return true;
    const fieldId = field.id;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) errorElement.classList.remove("show");
    if (this.isFieldVisible(fieldId) && this.getRequiredFields().includes(fieldId) && !value) {
      this.showFieldError(fieldId, `Wajib diisi`);
      return false;
    }
    return true;
  }

  validateForm() {
    let valid = true;
    this.getRequiredFields().forEach(id => { if(!this.validateField(document.getElementById(id))) valid=false; });
    return valid;
  }

  getRequiredFields() { 
    const ss = document.getElementById("sifatSurat")?.value;
    let required = ["jenisSurat", "sifatSurat", "bulanSurat", "tanggalPelaksanaan"];
    if(ss === "undangan") required.push("waktuPelaksanaan");
    return required.filter(id => this.isFieldVisible(id)); 
  }

  showFieldError(id, msg) { const e=document.getElementById(`${id}Error`); if(e) { e.textContent=msg; e.classList.add("show"); } }

  generateFolderKey(d) {
    const normalize = (text) => String(text || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s\-]/g, "");
    const sifat = normalize(d.sifatSurat);
    const jenis = normalize(d.jenisSurat).replace(/ /g, "_");
    let lingkup = d.lingkupEksternal ? "eksternal" : "internal";
    let varian = d.varianPenugasan ? "penugasan" : (d.varianKelompok ? "kelompok" : "individu");
    let parts = [sifat, jenis, lingkup];
    if (d.jenisSurat === "Kurikulum Silabus") {
        if (d.jenisKurikulum) parts.push(normalize(d.jenisKurikulum));
        if (d.jenisKurikulum === "KPK" && d.perihalKPK) parts.push(normalize(d.perihalKPK)); 
        else if (d.jenisKurikulum === "ECP" && d.tahapECP) parts.push(normalize(d.tahapECP));
    }
    parts.push(varian);
    return parts.join("/");
  }

  async getSupabaseClient() {
    if(this.supabase) return this.supabase;
    if(!window.supabase && !document.querySelector('script[data-supabase-js]')) {
      await new Promise(r => { const s=document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"; s.onload=r; s.dataset.supabaseJs="true"; document.head.appendChild(s); });
    }
    if(window.SUPABASE_URL && window.supabase) this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return this.supabase;
  }

  // --- UI Helpers ---
  getFieldWrapper(id) { const el=document.getElementById(id); return el ? (document.getElementById(`${id}Group`)||el.closest(".form-group")||el.parentElement) : null; }
  setFieldVisible(id, vis) {
    const w=this.getFieldWrapper(id); if(!w) return;
    w.style.display = vis ? "" : "none";
    if(!vis) { const el=document.getElementById(id); if(el) (el.type==="checkbox"?el.checked=false:el.value=""); }
  }
  isFieldVisible(id) { const w=this.getFieldWrapper(id); return w ? w.style.display!=="none" && !w.closest(".section-hidden") : true; }
  
  showSection(el) { if(el) { el.classList.remove("section-hidden"); el.classList.add("section-visible"); this.safeAnime({targets:el, opacity:[0,1], translateY:[-20,0], duration:500}); } }
  hideSection(el) { if(el) { el.classList.remove("section-visible"); el.classList.add("section-hidden"); } }

  populateBTSPrograms() { /* ... */ }

  showSuccessModal() { 
    const modal = document.getElementById("successModal");
    if(modal) {
        modal.classList.remove("hidden");
        const card = document.getElementById("successModalCard"); 
        if(card) {
            requestAnimationFrame(() => {
                card.classList.remove("opacity-0", "scale-90");
                card.classList.add("opacity-100", "scale-100");
            });
        }
    }
  }
  closeSuccessModal() {
    const modal = document.getElementById("successModal");
    const card = document.getElementById("successModalCard");
    if(card) {
        card.classList.remove("opacity-100", "scale-100");
        card.classList.add("opacity-0", "scale-90");
    }
    setTimeout(() => { if(modal) modal.classList.add("hidden"); }, 300);
  }
  showLoadingModal() { document.getElementById("loadingModal")?.classList.remove("hidden"); }
  hideLoadingModal() { document.getElementById("loadingModal")?.classList.add("hidden"); }
  showNotification(msg, type="info") { 
    const n=document.createElement("div"); n.className=`fixed top-4 right-4 p-4 rounded z-50 text-white ${type==="error"?"bg-red-500":"bg-blue-500"}`; 
    n.textContent=msg; document.body.appendChild(n); setTimeout(()=>n.remove(),3000); 
  }
  saveFormState() {} loadFormState() {} initializeCharts() {} startParticleAnimation() {} updateProgressBar() {}
}

class OneDrivePathHelper { static normalize(text) { return String(text || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s\-]/g, ""); } }

document.addEventListener("DOMContentLoaded", () => window.__letterGenerator = new LetterGenerator());