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
    // ⚠️ PASTE YOUR CLIENT ID HERE
    // ============================================================
    this.GOOGLE_CLIENT_ID = '15549700374-urha9ddap4kb61q6is6n95kq752p2g12.apps.googleusercontent.com'; 
    
    this.tokenClient = null;
    this.accessToken = null;

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
    this.populateTimeSlots();
    this.initializeUI();
    this.setupEventListeners();
    this.initGoogleAuth(); 

    this.populateFacilitators({ loading: true });
    
    // Attempt to load facilitators
    const loaded = await this.refreshFacilitatorsFromSupabase();
    if (!loaded || this.facilitators.length === 0) {
        console.warn("Using default facilitators");
        this.facilitators = this.defaultFacilitators;
    }
    
    this.populateFacilitators();
    this.populateBTSPrograms();
    this.loadFormState();
    
    try { this.initializeCharts(); } catch(e) {}
    try { this.startParticleAnimation(); } catch(e) {}
    
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

  initGoogleAuth() {
    if (window.google) {
      try {
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.GOOGLE_CLIENT_ID,
            // Scope: Read ALL Drive files (to find templates) + Write NEW files
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
            callback: (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                this.accessToken = tokenResponse.access_token;
                console.log("Google Auth Success");
                if (this.isGenerating) this.handleGenerate(true);
              }
            },
          });
      } catch(e) { console.error("GSI Error:", e); }
    } else {
      console.error("GSI script not loaded");
    }
  }

  setupEventListeners() {
    const addListener = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    };

    // UI Change Listeners
    addListener("jenisSurat", "change", () => this.refreshUI());
    addListener("sifatSurat", "change", () => this.refreshUI());
    addListener("jenisKurikulum", "change", () => this.refreshUI());
    addListener("lingkupInternal", "change", () => this.refreshUI());
    addListener("lingkupEksternal", "change", () => this.refreshUI());
    addListener("varianIndividu", "change", () => this.refreshUI());
    addListener("varianPenugasan", "change", () => this.refreshUI());
    addListener("varianKelompok", "change", () => this.refreshUI());
    addListener("jumlahBTS", "change", () => this.refreshUI());
    [1, 2, 3].forEach(i => addListener(`btsPelatihan${i}`, "change", () => this.refreshUI()));
    addListener("jumlahFasilitator", "change", () => this.refreshUI());
    [1, 2, 3].forEach(i => addListener(`namaFasilitator${i}`, "change", (e) => { this.handleFasilitatorChange(e, i); this.refreshUI(); }));

    // Buttons
    addListener("generateBtn", "click", () => this.handleGenerate(false));
    addListener("resetBtn", "click", () => this.handleReset());
    addListener("formPreviewBtn", "click", () => alert("Klik 'Generate Surat' terlebih dahulu."));

    // Modal
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

  // --- 1. VISIBILITY RULES (FIXED) ---
  applyVisibilityRules() {
    const js = document.getElementById("jenisSurat")?.value;
    const jk = document.getElementById("jenisKurikulum")?.value;
    const ss = document.getElementById("sifatSurat")?.value;
    const varianPenugasan = document.getElementById("varianPenugasan")?.checked;
    const varianKelompok = document.getElementById("varianKelompok")?.checked;
    const varianIndividu = document.getElementById("varianIndividu")?.checked;

    // 1. Show/Hide Major Sections based on 'Jenis Surat'
    const curriculumSec = document.getElementById("curriculumSection");
    const btsSec = document.getElementById("btsSection");
    
    if (js === "Kurikulum Silabus") {
        this.showSection(curriculumSec);
        this.hideSection(btsSec);
    } else if (js === "Bahan Tayang Standar") {
        this.hideSection(curriculumSec);
        this.showSection(btsSec);
    } else {
        this.hideSection(curriculumSec);
        this.hideSection(btsSec);
    }

    // 2. Show/Hide Sub-sections for Curriculum (MISSING LOGIC FIXED HERE)
    const kpkSec = document.getElementById("perihalKPKSection");
    const ecpSec = document.getElementById("tahapECPSection");

    if (js === "Kurikulum Silabus") {
        if (jk === "KPK") {
            this.showSection(kpkSec);
            this.hideSection(ecpSec);
        } else if (jk === "ECP") {
            this.hideSection(kpkSec);
            this.showSection(ecpSec);
        } else {
            this.hideSection(kpkSec);
            this.hideSection(ecpSec);
        }
    } else {
        this.hideSection(kpkSec);
        this.hideSection(ecpSec);
    }

    // 3. Meeting Details Visibility
    const hideMitraTopik = js==="Bahan Tayang Standar" || (js==="Kurikulum Silabus" && jk==="ECP");
    this.setFieldVisible("mitraKerjasama", !hideMitraTopik);
    this.setFieldVisible("topikRapat", !hideMitraTopik);
    this.setFieldVisible("pimpinan", varianPenugasan);
    this.setFieldVisible("instansi", varianPenugasan);

    // 4. Facilitator Section
    const fs = document.getElementById("facilitatorSection");
    if(fs) {
       if (js && js !== "") this.showSection(fs); else this.hideSection(fs);
    }

    // 5. Facilitator Count Logic
    const jumlahSec = document.getElementById("jumlahFasilitatorSection");
    if(varianKelompok) this.showSection(jumlahSec); else this.hideSection(jumlahSec);

    let n = 0;
    if (varianKelompok) n = parseInt(document.getElementById("jumlahFasilitator")?.value) || 0;
    else if (varianIndividu || varianPenugasan) n = 1;

    for(let i=1; i<=3; i++) {
        const sec = document.getElementById(`fasilitator${i}Section`);
        if (i <= n) this.showSection(sec); else this.hideSection(sec);
    }
  }

  // --- GOOGLE DRIVE HELPER: FIND FOLDER ID ---
  async findFolderId(name, parentId = 'root') {
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    const data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0].id : null;
  }

  // --- GOOGLE DRIVE HELPER: CREATE FOLDER ---
  async createFolder(name, parentId) {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] })
    });
    const data = await res.json();
    return data.id;
  }

  // --- 2. FIND TEMPLATE IN DRIVE (Traverse Path) ---
  async findTemplateBlob(folderPathArray) {
    console.log("[Generator] Searching Template Path:", folderPathArray.join('/'));
    
    // Start at Root, look for 'templates_surat'
    let currentId = await this.findFolderId("templates_surat");
    if (!currentId) throw new Error("Folder 'templates_surat' tidak ditemukan di Root Google Drive.");

    // Traverse subfolders
    for (const folderName of folderPathArray) {
        if (!folderName) continue; // Skip empty segments
        
        let nextId = await this.findFolderId(folderName, currentId);
        
        if (!nextId) {
             console.warn(`Folder '${folderName}' not found. Stopping search.`);
             throw new Error(`Template folder tidak ditemukan: ${folderName}`);
        }
        currentId = nextId;
    }

    // Find .docx file
    const q = `mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' and '${currentId}' in parents and trashed=false`;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    const data = await res.json();

    if (!data.files || data.files.length === 0) {
        throw new Error("Tidak ada file .docx di folder template tujuan.");
    }

    const file = data.files[0]; 
    console.log("[Generator] Found Template:", file.name);
    
    return await this.downloadFileBlob(file.id);
  }

  // --- 3. UPLOAD RESULT TO DRIVE ---
  async uploadToGoogleDrive(blob, filename, pathArray) {
    console.log("[Generator] Uploading Output to:", pathArray.join('/'));
    
    let currentId = await this.findFolderId('generated-letters');
    if (!currentId) currentId = await this.createFolder('generated-letters', 'root');

    for (const folderName of pathArray) {
      if(folderName && folderName !== 'general') {
         let nextId = await this.findFolderId(folderName, currentId);
         if (!nextId) nextId = await this.createFolder(folderName, currentId);
         currentId = nextId;
      }
    }

    const metadata = { name: filename, parents: [currentId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form
    });

    if (!res.ok) throw new Error("Gagal upload file.");
    const data = await res.json();
    return data.webViewLink;
  }

  // --- GENERATION HANDLER ---
  async handleGenerate(isRetry = false) {
    if (this.isGenerating && !isRetry) return;
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
      
      // 1. Build Template Path
      const templatePath = [];
      templatePath.push(formData.sifatSurat); // "undangan"
      templatePath.push(formData.jenisSurat); // "Kurikulum Silabus"
      templatePath.push(formData.lingkupEksternal ? "eksternal" : "internal");
      
      if (formData.jenisSurat === "Kurikulum Silabus") {
          if (formData.jenisKurikulum) templatePath.push(formData.jenisKurikulum); // "KPK"
          
          if (formData.jenisKurikulum === "KPK" && formData.perihalKPK) {
              templatePath.push(formData.perihalKPK); // "persiapan pelatihan"
          }
          else if (formData.jenisKurikulum === "ECP" && formData.tahapECP) {
              templatePath.push(formData.tahapECP);
          }
      }
      
      let varian = "";
      if (formData.varianIndividu) varian = "individu";
      else if (formData.varianPenugasan) varian = "penugasan";
      else if (formData.varianKelompok) varian = "kelompok";
      templatePath.push(varian);

      // 2. Fetch Template Blob
      const blob = await this.findTemplateBlob(templatePath);

      // 3. Fill Template
      const payload = this.buildDocxPayload(formData);
      await this.ensureDocxLibsLoaded();
      const renderedBlob = this.renderDocx(await blob.arrayBuffer(), payload);
      
      this.generatedBlob = renderedBlob;
      this.generatedFilename = `surat_${OneDrivePathHelper.normalize(formData.sifatSurat)}_${Date.now()}.docx`;

      // 4. Build Output Path (generated-letters / Username / Sifat / Kurikulum)
      const username = this.currentUser.username || "user";
      const outputPath = [username, formData.sifatSurat];
      if (formData.jenisKurikulum) outputPath.push(formData.jenisKurikulum);

      // 5. Upload
      this.generatedFileUrl = await this.uploadToGoogleDrive(renderedBlob, this.generatedFilename, outputPath);
      
      this.showSuccessModal(); 

    } catch(e) {
      console.error(e);
      this.showNotification("Gagal: " + (e.message||"Error"), "error");
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

  // --- HELPERS ---
  async downloadFileBlob(fileId) {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (!res.ok) throw new Error("Gagal download template file.");
      return await res.blob();
  }

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

  populateFacilitators(opts={}) {
    [1,2,3].forEach(i => {
      const el=document.getElementById(`namaFasilitator${i}`); if(!el) return;
      const cv=el.value;
      el.innerHTML = opts.loading ? "<option>Loading...</option>" : '<option value="">-- Pilih --</option>';
      if(!opts.loading && this.facilitators) {
          this.facilitators.forEach(f => { 
              const o=document.createElement("option"); o.value=f.nama; o.textContent=f.nama; el.appendChild(o); 
          });
          if(cv) el.value=cv;
      }
    });
  }

  refreshUI() { this.applyVisibilityRules(); this.saveFormState(); }
  
  // --- BOILERPLATE ---
  async getSupabaseClient() {
    if(this.supabase) return this.supabase;
    if(window.SUPABASE_URL && window.supabase) this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return this.supabase;
  }
  async refreshFacilitatorsFromSupabase() {
    try {
      const client = await this.getSupabaseClient(); if(!client) return false;
      const { data } = await client.from("facilitators").select("nama, perusahaan").order("nama");
      if(data?.length) { this.facilitators = data; return true; }
    } catch(e) { console.warn(e); }
    return false;
  }

  getFieldWrapper(id) { const el=document.getElementById(id); return el ? (document.getElementById(`${id}Group`)||el.closest(".form-group")||el.parentElement) : null; }
  setFieldVisible(id, vis) { const w=this.getFieldWrapper(id); if(!w) return; w.style.display = vis ? "" : "none"; if(!vis) { const el=document.getElementById(id); if(el) (el.type==="checkbox"?el.checked=false:el.value=""); } }
  isFieldVisible(id) { const w=this.getFieldWrapper(id); return w ? w.style.display!=="none" && !w.closest(".section-hidden") : true; }
  showSection(el) { if(el) { el.classList.remove("section-hidden"); el.classList.add("section-visible"); this.safeAnime({targets:el, opacity:[0,1], translateY:[-20,0], duration:500}); } }
  hideSection(el) { if(el) { el.classList.remove("section-visible"); el.classList.add("section-hidden"); } }
  handleFasilitatorChange(e, i) { const val=e.target.value; const div=document.getElementById(`instansiFasilitator${i}`); if(val&&this.facilitators){ const f=this.facilitators.find(x=>x.nama===val); if(div) div.textContent=f?f.perusahaan:""; } }
  populateBTSPrograms() { [1,2,3].forEach(i=>{ const el=document.getElementById(`btsPelatihan${i}`); if(!el) return; if(typeof btsTrainingPrograms!=="undefined") Object.keys(btsTrainingPrograms).forEach(k=>{ const o=document.createElement("option"); o.value=k; o.textContent=k; el.appendChild(o); }); }); }
  fetchTemplateMetadata(folderKey) { return null; } // Not used anymore
  renderDocx(buf, data) { const zip = new window.PizZip(buf); const doc = new window.docxtemplater(zip, { paragraphLoop:true, linebreaks:true, delimiters:{start:"[", end:"]"} }); doc.render(data); return doc.getZip().generate({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}); }
  async ensureDocxLibsLoaded() { const load = (src) => new Promise(r => { if(document.querySelector(`script[src="${src}"]`)) return r(); const s=document.createElement("script"); s.src=src; s.onload=r; document.head.appendChild(s); }); await load("https://cdn.jsdelivr.net/npm/pizzip@3.1.7/dist/pizzip.min.js"); await load("https://cdn.jsdelivr.net/npm/docxtemplater@3.50.0/build/docxtemplater.js"); await load("https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"); }
  buildDocxPayload(formData) { const safe=(v)=>(v==null?"":String(v)); return { bulan_angka: "01", bulan_huruf: formData.bulanSurat, hari_tanggal: formData.tanggalPelaksanaan, waktu: safe(formData.waktuPelaksanaan), jenis_surat: safe(formData.jenisSurat), sifat_surat: safe(formData.sifatSurat), bulan_surat: formData.bulanSurat, lampiran: safe(formData.lampiran), mitra_kerjasama: safe(formData.mitraKerjasama), topik_rapat: safe(formData.topikRapat), fasilitator1: safe(formData.namaFasilitator1), instansi_fasilitator1: safe(formData.instansiFasilitator1) }; }
  collectFormData() { const d={}; const get=(id)=>this.isFieldVisible(id)?document.getElementById(id).value:""; const chk=(id)=>this.isFieldVisible(id)?document.getElementById(id).checked:false; d.jenisSurat=get("jenisSurat"); d.sifatSurat=get("sifatSurat"); d.jenisKurikulum=get("jenisKurikulum"); d.perihalKPK=get("perihalKPK"); d.bulanSurat=get("bulanSurat"); d.lampiran=get("lampiran"); d.mitraKerjasama=get("mitraKerjasama"); d.topikRapat=get("topikRapat"); d.tanggalPelaksanaan=get("tanggalPelaksanaan"); d.waktuPelaksanaan=get("waktuPelaksanaan"); d.tahapECP=get("tahapECP"); d.lingkupInternal=chk("lingkupInternal"); d.lingkupEksternal=chk("lingkupEksternal"); d.jumlahBTS=get("jumlahBTS"); d.btsPelatihan1=get("btsPelatihan1"); d.btsMateri1=get("btsMateri1"); d.varianIndividu=chk("varianIndividu"); d.varianPenugasan=chk("varianPenugasan"); d.varianKelompok=chk("varianKelompok"); d.jumlahFasilitator=get("jumlahFasilitator"); d.namaFasilitator1=get("namaFasilitator1"); d.pimpinan=get("pimpinan"); d.instansi=get("instansi"); [1,2,3].forEach(n=>{ d[`namaFasilitator${n}`]=get(`namaFasilitator${n}`); if(d[`namaFasilitator${n}`]){ const f=this.facilitators.find(x=>x.nama===d[`namaFasilitator${n}`]); d[`instansiFasilitator${n}`]=f?f.perusahaan:""; }else d[`instansiFasilitator${n}`]=""; }); return d; }
  validateField(field) { if(!field) return true; const val=field.value.trim(); const err=document.getElementById(`${field.id}Error`); if(err) err.classList.remove("show"); if(this.isFieldVisible(field.id) && this.getRequiredFields().includes(field.id) && !val) { this.showFieldError(field.id, "Wajib diisi"); return false; } return true; }
  validateForm() { let valid=true; this.getRequiredFields().forEach(id=>{ if(!this.validateField(document.getElementById(id))) valid=false; }); return valid; }
  getRequiredFields() { const ss=document.getElementById("sifatSurat")?.value; let req=["jenisSurat","sifatSurat","bulanSurat","tanggalPelaksanaan"]; if(ss==="undangan") req.push("waktuPelaksanaan"); return req.filter(id=>this.isFieldVisible(id)); }
  showFieldError(id, msg) { const e=document.getElementById(`${id}Error`); if(e) { e.textContent=msg; e.classList.add("show"); } }
  
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
  showNotification(msg, t="info") { const n=document.createElement("div"); n.className=`fixed top-4 right-4 p-4 rounded z-50 text-white ${t==="error"?"bg-red-500":"bg-blue-500"}`; n.textContent=msg; document.body.appendChild(n); setTimeout(()=>n.remove(),3000); }
  saveFormState() {} loadFormState() {} initializeCharts() {} startParticleAnimation() {} updateProgressBar() {}
}

class OneDrivePathHelper { static normalize(t) { return String(t||"").trim().toLowerCase().replace(/\s+/g," ").replace(/[^\w\s\-]/g,""); } }
document.addEventListener("DOMContentLoaded", () => window.__letterGenerator = new LetterGenerator());