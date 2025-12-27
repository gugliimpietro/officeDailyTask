// src/public/letterGen/main.js

// --- OneDrive Path Helper (Ported from src/lib/onedrive/paths.js) ---
const PathKind = {
  TEMPLATE: "template",
  GENERATED: "generated",
};

class OneDrivePathHelper {
  static getOnedrivePath({ folderKey, username, pathKind }) {
    if (!folderKey) throw new Error("folderKey is required");
    if (!pathKind) throw new Error("pathKind is required");

    switch (pathKind) {
      case PathKind.TEMPLATE:
        // Physical path in OneDrive
        return `aplikasi progres/templates/${folderKey}`;
      case PathKind.GENERATED:
        if (!username) throw new Error("username is required for generated paths");
        return `aplikasi progres/generated/${username}/${folderKey}`;
      default:
        throw new Error(`Unknown pathKind: ${pathKind}`);
    }
  }

  // Helper to normalize segments (trim, lowercase, remove special chars)
  // Matching the logic from your seed script
  static normalize(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ") // Single spaces
      .replace(/[^\w\s\-]/g, ""); // Remove special chars but keep spaces/dashes
  }
}

class LetterGenerator {
  constructor() {
    this.formData = {};
    this.isGenerating = false;
    this.currentUser = { username: "guest" }; // Default, should be set via init
    this.init().catch((err) => console.error("Init error:", err));
  }

  // Safe wrapper for animation
  safeAnime(config) {
    try {
      if (window.anime) return window.anime(config);
      // Fallback
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
    // Try to get user info if passed from parent window
    this.initializeUI();
    this.fallbackFacilitators = typeof facilitators !== "undefined" && Array.isArray(facilitators) ? facilitators.slice() : [];
    this.facilitators = [];
    this.setupEventListeners();
    this.loadFormState();
    this.initializeCharts();
    this.startParticleAnimation();
    this.populateTimeSlots();

    this.populateFacilitators({ loading: true });
    const loaded = await this.refreshFacilitatorsFromSupabase();
    if (!loaded) this.facilitators = this.fallbackFacilitators.slice();
    this.populateFacilitators();
    this.populateBTSPrograms();
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

  setupEventListeners() {
    const addListener = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    };

    addListener("jenisSurat", "change", (e) => this.handleJenisSuratChange(e));
    addListener("sifatSurat", "change", (e) => this.handleSifatSuratChange(e));
    addListener("jenisKurikulum", "change", (e) => this.handleJenisKurikulumChange(e));
    
    addListener("lingkupInternal", "change", () => { this.applyVisibilityRules(); this.updateProgressBar(); });
    addListener("lingkupEksternal", "change", () => { this.applyVisibilityRules(); this.updateProgressBar(); });

    addListener("varianIndividu", "change", () => this.handleVariantChange());
    addListener("varianPenugasan", "change", () => this.handleVariantChange());
    addListener("varianKelompok", "change", () => this.handleVariantChange());

    addListener("jumlahBTS", "change", (e) => this.handleJumlahBTSChange(e));
    [1, 2, 3].forEach(i => addListener(`btsPelatihan${i}`, "change", (e) => this.handleBTSPelatihanChange(e, i)));

    addListener("jumlahFasilitator", "change", (e) => this.handleJumlahFasilitatorChange(e));
    [1, 2, 3].forEach(i => addListener(`namaFasilitator${i}`, "change", (e) => this.handleFasilitatorChange(e, i)));

    addListener("generateBtn", "click", () => this.handleGenerate());
    addListener("resetBtn", "click", () => this.handleReset());
    addListener("previewBtn", "click", () => this.handlePreview());
    addListener("closeSuccessBtn", "click", () => this.closeSuccessModal());
    addListener("downloadBtn", "click", () => this.handleDownload());
    
    // NEW: Send to Task Button
    addListener("sendToTaskBtn", "click", () => this.handleSendToTask());

    document.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("change", () => this.saveFormState());
      input.addEventListener("input", () => this.saveFormState());
      input.addEventListener("blur", (e) => this.validateField(e.target));
    });
  }

  // --- Handlers ---
  handleJenisSuratChange(e) {
    const val = e.target.value;
    if (val === "Kurikulum Silabus") { this.showSection(document.getElementById("curriculumSection")); this.hideSection(document.getElementById("btsSection")); }
    else if (val === "Bahan Tayang Standar") { this.hideSection(document.getElementById("curriculumSection")); this.showSection(document.getElementById("btsSection")); }
    this.refreshUI();
  }
  handleSifatSuratChange(e) {
    const val = e.target.value;
    const sec = document.getElementById("facilitatorSection");
    if (val === "undangan") this.showSection(sec); else this.hideSection(sec);
    this.refreshUI();
  }
  handleJenisKurikulumChange(e) {
    const val = e.target.value;
    if (val === "KPK") { this.showSection(document.getElementById("perihalKPKSection")); this.hideSection(document.getElementById("tahapECPSection")); }
    else if (val === "ECP") { this.hideSection(document.getElementById("perihalKPKSection")); this.showSection(document.getElementById("tahapECPSection")); }
    else { this.hideSection(document.getElementById("perihalKPKSection")); this.hideSection(document.getElementById("tahapECPSection")); }
    this.refreshUI();
  }
  handleVariantChange() {
    const grp = document.getElementById("varianKelompok").checked;
    const tgs = document.getElementById("varianPenugasan").checked;
    const numSec = document.getElementById("jumlahFasilitatorSection");
    const instSec = document.getElementById("institutionSection");
    
    if(grp) this.showSection(numSec); else this.hideSection(numSec);
    if(tgs || grp) this.showSection(instSec); else this.hideSection(instSec);
    
    this.updateFacilitatorFields();
    this.refreshUI();
  }
  handleJumlahBTSChange(e) {
    const n = parseInt(e.target.value)||0;
    for(let i=1;i<=3;i++) i<=n ? this.showSection(document.getElementById(`bts${i}Section`)) : this.hideSection(document.getElementById(`bts${i}Section`));
    this.refreshUI();
  }
  handleBTSPelatihanChange(e, i) {
    const val = e.target.value;
    const el = document.getElementById(`btsMateri${i}`);
    el.innerHTML = '<option value="">-- Pilih Materi --</option>';
    if(val && btsTrainingPrograms[val]) {
      btsTrainingPrograms[val].forEach(t => { const o=document.createElement("option"); o.value=t; o.textContent=t; el.appendChild(o); });
      if(btsTrainingPrograms[val].length) el.value = btsTrainingPrograms[val][0];
    }
    this.refreshUI();
  }
  handleJumlahFasilitatorChange(e) { this.updateFacilitatorFields(parseInt(e.target.value)||0); this.refreshUI(); }
  updateFacilitatorFields(n=null) {
    if(n===null) n = document.getElementById("varianKelompok").checked ? (parseInt(document.getElementById("jumlahFasilitator").value)||0) : 1;
    for(let i=1;i<=3;i++) i<=n ? this.showSection(document.getElementById(`fasilitator${i}Section`)) : this.hideSection(document.getElementById(`fasilitator${i}Section`));
  }
  handleFasilitatorChange(e, i) {
    const val = e.target.value;
    const div = document.getElementById(`instansiFasilitator${i}`);
    if(val) { const f=this.facilitators.find(x=>x.nama===val); div.textContent = f ? `Instansi: ${f.perusahaan}` : ""; }
    else div.textContent = "";
    this.refreshUI();
  }
  refreshUI() { this.applyVisibilityRules(); this.updateProgressBar(); this.saveFormState(); }

  // Visibility & Animation
  showSection(el) { if(el) { el.classList.remove("section-hidden"); el.classList.add("section-visible"); this.safeAnime({targets:el, opacity:[0,1], translateY:[-20,0], duration:500}); } }
  hideSection(el, clear=true) { if(el) { el.classList.remove("section-visible"); el.classList.add("section-hidden"); if(clear) this.clearInputsInElement(el); } }
  clearInputsInElement(el) {
    if(!el) return;
    el.querySelectorAll("input, select, textarea").forEach(i => {
      if(i.type==="checkbox"||i.type==="radio") i.checked=false; else i.value="";
      const err = document.getElementById(`${i.id}Error`); if(err) err.classList.remove("show");
    });
    [1,2,3].forEach(n => { const d=document.getElementById(`instansiFasilitator${n}`); if(d) d.textContent=""; });
  }

  getFieldWrapper(id) { const el=document.getElementById(id); return el ? (document.getElementById(`${id}Group`)||el.closest(".form-group")||el.parentElement) : null; }
  setFieldVisible(id, vis) {
    const w=this.getFieldWrapper(id); if(!w) return;
    w.style.display = vis ? "" : "none";
    if(!vis) {
      const el=document.getElementById(id); if(el) (el.type==="checkbox"?el.checked=false:el.value="");
      const err=document.getElementById(`${id}Error`); if(err) err.classList.remove("show");
    }
  }
  isFieldVisible(id) {
    const w=this.getFieldWrapper(id); if(!w) return true;
    if(w.style.display==="none" || w.closest(".section-hidden")) return false;
    return true;
  }
  applyVisibilityRules() {
    const js = document.getElementById("jenisSurat")?.value;
    const jk = document.getElementById("jenisKurikulum")?.value;
    const ss = document.getElementById("sifatSurat")?.value;
    const internalOnly = document.getElementById("lingkupInternal")?.checked && !document.getElementById("lingkupEksternal")?.checked;
    const varianPenugasan = document.getElementById("varianPenugasan")?.checked;

    const hideMitraTopik = js==="Bahan Tayang Standar" || (js==="Kurikulum Silabus" && jk==="ECP");
    this.setFieldVisible("mitraKerjasama", !hideMitraTopik);
    this.setFieldVisible("topikRapat", !hideMitraTopik);
    
    this.setFieldVisible("pimpinan", varianPenugasan);
    this.setFieldVisible("instansi", varianPenugasan);

    const fs = document.getElementById("facilitatorSection");
    if(fs) {
      if(internalOnly && (js==="Kurikulum Silabus"||js==="Bahan Tayang Standar")) this.hideSection(fs);
      else ss==="undangan" ? this.showSection(fs) : this.hideSection(fs);
    }
  }

  // --- SUPABASE & DATA ---
  async getSupabaseClient() {
    if(this.supabase) return this.supabase;
    if(!window.supabase && !document.querySelector('script[data-supabase-js]')) {
      await new Promise((resolve) => {
        const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
        s.onload=resolve; s.dataset.supabaseJs="true"; document.head.appendChild(s);
      });
    }
    const url = window.SUPABASE_URL || window.__ENV__?.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY || window.__ENV__?.SUPABASE_ANON_KEY;
    if(url && key && window.supabase) this.supabase = window.supabase.createClient(url, key);
    return this.supabase;
  }
  
  async refreshFacilitatorsFromSupabase() {
    try {
      const client = await this.getSupabaseClient(); if(!client) return false;
      const { data } = await client.from(window.SUPABASE_FACILITATORS_TABLE||"facilitators").select("nama, perusahaan").order("nama");
      if(data?.length) { this.facilitators = data; return true; }
    } catch(e) { console.warn("Supabase fetch failed", e); }
    return false;
  }
/**
   * Downloads a file from OneDrive sharing link
   * Converts the sharing URL to use OneDrive API which supports CORS
   */
  async downloadFileFromUrl(url) {
    // Validate URL exists
    if (!url) {
      throw new Error("URL template kosong.");
    }

    // Check for truncated links (common copy-paste error)
    if (url.endsWith("...") || url.includes("…")) {
      throw new Error("URL terpotong. Pastikan Anda menyalin link lengkap dari OneDrive.");
    }

    console.log("[OneDrive] Memproses link:", url);

    try {
      // Step 1: Clean the URL (remove query parameters like ?e=xyz)
      const cleanUrl = url.split('?')[0];
      console.log("[OneDrive] Clean URL:", cleanUrl);

      // Step 2: Encode URL to Base64 (URL-safe format for OneDrive API)
      let encodedUrl = btoa(cleanUrl)
        .replace(/\//g, '_')  // Replace / with _
        .replace(/\+/g, '-')  // Replace + with -
        .replace(/=+$/, '');  // Remove trailing =

      // Step 3: Build OneDrive API endpoint (supports CORS)
      const apiUrl = `https://api.onedrive.com/v1.0/shares/u!${encodedUrl}/root/content`;
      console.log("[OneDrive] Mengunduh via API:", apiUrl);

      // Step 4: Fetch file from API
      const response = await fetch(apiUrl);

      // Handle errors with friendly messages
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Akses ditolak. Pastikan link OneDrive diset ke 'Anyone with the link can view'.");
        }
        if (response.status === 404) {
          throw new Error("File tidak ditemukan. Periksa kembali link OneDrive Anda.");
        }
        throw new Error(`Gagal mengunduh file (HTTP ${response.status})`);
      }

      // Success! Return file as blob
      const blob = await response.blob();
      console.log("[OneDrive] File berhasil diunduh:", blob.size, "bytes");
      return blob;

    } catch (error) {
      console.error("[OneDrive] Error:", error);
      throw new Error(`Gagal mengunduh template: ${error.message}`);
    }
  }
  // --- LOGICAL KEY GENERATION (Matches seed-storage-folders.mjs) ---
  
  /**
   * Generates the 'folder_key' that corresponds to the logical path in OneDrive.
   * Matches logic: undangan/kurikulum_silabus/eksternal/kpk/persiapan pelatihan/individu
   */
  generateFolderKey(d) {
    const normalize = OneDrivePathHelper.normalize;

    const sifat = normalize(d.sifatSurat); // 'undangan' or 'hasil'
    const jenis = normalize(d.jenisSurat).replace(/ /g, "_"); // 'kurikulum_silabus'
    
    // Lingkup
    let lingkup = "internal";
    if (d.lingkupInternal && d.lingkupEksternal) lingkup = "eksternal"; // or gabungan based on your seed? Seed says "eksternal" usually covers mixes, or explicit. 
    // Seed paths uses: 'eksternal', 'internal'
    else if (d.lingkupEksternal) lingkup = "eksternal";

    // Varian
    let varian = "individu";
    if (d.varianPenugasan) varian = "penugasan";
    else if (d.varianKelompok) varian = "kelompok";

    // Build parts array
    let parts = [sifat, jenis, lingkup];

    if (d.jenisSurat === "Kurikulum Silabus") {
        if (d.jenisKurikulum) parts.push(normalize(d.jenisKurikulum)); // 'kpk', 'ecp', 'jasa perdagangan'
        
        // Sub-variant (Program/Tahap)
        // Your seed paths have 'persiapan pelatihan' or 'review'
        // We map form fields to these keys.
        // Assuming 'perihalKPK' or 'tahapECP' maps to this level.
        if (d.jenisKurikulum === "KPK" && d.perihalKPK) {
            parts.push(normalize(d.perihalKPK)); 
        } else if (d.jenisKurikulum === "ECP" && d.tahapECP) {
            parts.push(normalize(d.tahapECP));
        } else if (d.jenisKurikulum === "Jasa Perdagangan") {
            // Logic for Jasa Perdagangan sub-path if needed, or default
            // Seed has: 'persiapan pelatihan', 'review'
            // We use 'perihalKPK' field as a generic 'Subject' field if visible
            if (this.isFieldVisible('perihalKPK')) parts.push(normalize(d.perihalKPK));
        }
    }

    parts.push(varian);

    // Join with slash
    return parts.join("/");
  }


  // --- DOCX PAYLOAD BUILDER ---
  buildDocxPayload(formData) {
    const safe = (v) => (v == null ? "" : String(v));
    const monthMap = {
      "Januari": "01", "Februari": "02", "Maret": "03", "April": "04", "Mei": "05", "Juni": "06",
      "Juli": "07", "Agustus": "08", "September": "09", "Oktober": "10", "November": "11", "Desember": "12"
    };
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
      tanggal_pelaksanaan: safe(formData.tanggalPelaksanaan),
      waktu_pelaksanaan: safe(formData.waktuPelaksanaan),
      tahap_ecp: safe(formData.tahapECP),
      perihal_kpk: safe(formData.perihalKPK),
      fasilitator1: safe(formData.namaFasilitator1),
      fasilitator2: safe(formData.namaFasilitator2),
      fasilitator3: safe(formData.namaFasilitator3),
      instansi_fasilitator1: safe(formData.instansiFasilitator1),
      instansi_fasilitator2: safe(formData.instansiFasilitator2),
      instansi_fasilitator3: safe(formData.instansiFasilitator3),
      pimpinan: safe(formData.pimpinan),
      instansi: safe(formData.instansi),
      bts_pelatihan1: safe(formData.btsPelatihan1), bts_materi1: safe(formData.btsMateri1),
      bts_pelatihan2: safe(formData.btsPelatihan2), bts_materi2: safe(formData.btsMateri2),
      bts_pelatihan3: safe(formData.btsPelatihan3), bts_materi3: safe(formData.btsMateri3),
    };
  }

  // --- GENERATION LOGIC ---
  async handleGenerate() {
    if(this.isGenerating) return;
    if(!this.validateForm()) { this.showNotification("Lengkapi form!", "error"); return; }
    
    this.isGenerating = true;
    this.showLoadingModal();
    try {
      const formData = this.collectFormData();
      const folderKey = this.generateFolderKey(formData);
      console.log("[Generator] Derived Folder Key:", folderKey);

      // 1. Get Template Link from Supabase DB (Metadata)
      // New Logic: We query the DB for the folderKey to get the 'share_url' or 'download_url'
      const templateMetadata = await this.fetchTemplateMetadata(folderKey);
      
      let blob = null;
      if (templateMetadata && templateMetadata.share_url) {
          console.log("[Generator] Downloading from OneDrive link:", templateMetadata.share_url);
          blob = await this.downloadFileFromUrl(templateMetadata.share_url);
      } else {
          throw new Error(`Template not found for key: ${folderKey}. Check Supabase Metadata.`);
      }

      // 2. Render DOCX
      const payload = this.buildDocxPayload(formData);
      await this.ensureDocxLibsLoaded();
      const renderedBlob = this.renderDocx(await blob.arrayBuffer(), payload);

      // 3. Handle Generated File (OneDrive Path Concept)
      // Since we can't upload to OneDrive without Graph Auth in this iframe,
      // we generate the correct OneDrive PATH and download the file locally.
      // The user manually uploads it, or we integrate Graph API later.
      
      const username = this.currentUser.username || "user";
      const targetPath = OneDrivePathHelper.getOnedrivePath({ 
          folderKey, 
          username, 
          pathKind: PathKind.GENERATED 
      });
      
      const filename = `surat_generated_${Date.now()}.docx`;
      console.log(`[Generator] Target OneDrive Path: ${targetPath}/${filename}`);
      
      // Trigger download
      window.saveAs(renderedBlob, filename);
      
      this.generatedFileUrl = null; // No cloud URL available yet
      this.generatedFilename = filename;
      
      this.showSuccessModal();

    } catch(e) {
      console.error(e);
      this.showNotification("Gagal: " + (e.message||"Error"), "error");
    } finally {
      this.hideLoadingModal();
      this.isGenerating = false;
    }
  }

  // --- NEW: Fetch Metadata from DB ---
  async fetchTemplateMetadata(folderKey) {
      const client = await this.getSupabaseClient();
      if (!client) return null;
      
      // We assume a table 'letter_templates' with columns: folder_key, share_url
      const { data, error } = await client
        .from('letter_templates')
        .select('*')
        .eq('folder_key', folderKey)
        .limit(1)
        .single();
      
      if (error) {
          console.warn("[Generator] Metadata fetch error:", error.message);
          return null;
      }
      return data;
  }

  async downloadFileFromUrl(url) {
      // Note: If OneDrive link is not direct download, this fetch might fail or return HTML.
      // Ensure the link in Supabase is a direct download link (e.g., ends in ?download=1)
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Failed to download template file");
      return await resp.blob();
  }

  // --- HELPERS ---
  renderDocx(buf, data) {
    const zip = new window.PizZip(buf);
    const doc = new window.docxtemplater(zip, { paragraphLoop:true, linebreaks:true, delimiters:{start:"[", end:"]"} });
    doc.render(data);
    return doc.getZip().generate({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  }

  // --- UTILS ---
  async ensureDocxLibsLoaded() {
    const load = (src) => new Promise(r => { 
        if(document.querySelector(`script[src="${src}"]`)) return r();
        const s=document.createElement("script"); s.src=src; s.onload=r; document.head.appendChild(s); 
    });
    await load("https://cdn.jsdelivr.net/npm/pizzip@3.1.7/dist/pizzip.min.js");
    await load("https://cdn.jsdelivr.net/npm/docxtemplater@3.50.0/build/docxtemplater.js");
    await load("https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js");
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
    
    [1,2,3].forEach(n => {
       d[`namaFasilitator${n}`] = get(`namaFasilitator${n}`);
       if(d[`namaFasilitator${n}`]) {
          const f = this.facilitators.find(x=>x.nama===d[`namaFasilitator${n}`]);
          d[`instansiFasilitator${n}`] = f ? f.perusahaan : "";
       } else d[`instansiFasilitator${n}`] = "";
    });
    return d;
  }
  validateForm() {
    let valid = true;
    this.getRequiredFields().forEach(id => {
       if(!document.getElementById(id)?.value) { this.showFieldError(id, "Wajib diisi"); valid=false; }
    });
    if(!document.getElementById("lingkupInternal").checked && !document.getElementById("lingkupEksternal").checked) { alert("Pilih lingkup!"); valid=false; }
    return valid;
  }
  getRequiredFields() { return ["jenisSurat","sifatSurat","bulanSurat","tanggalPelaksanaan"].filter(id => this.isFieldVisible(id)); }
  showFieldError(id, msg) { const e=document.getElementById(`${id}Error`); if(e) { e.textContent=msg; e.classList.add("show"); } }
  
  populateTimeSlots() { 
    const el=document.getElementById("waktuPelaksanaan"); if(!el) return;
    for(let h=7; h<=20; h++) for(let m=0; m<60; m+=30) {
      const t = `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
      const o=document.createElement("option"); o.value=t; o.textContent=t; el.appendChild(o);
    }
  }
  populateFacilitators(opts={}) {
    [1,2,3].forEach(i => {
      const el=document.getElementById(`namaFasilitator${i}`); if(!el) return;
      el.innerHTML = opts.loading ? "<option>Loading...</option>" : '<option value="">-- Pilih --</option>';
      if(!opts.loading) this.facilitators.forEach(f => { const o=document.createElement("option"); o.value=f.nama; o.textContent=f.nama; el.appendChild(o); });
    });
  }
  populateBTSPrograms() {
    [1,2,3].forEach(i => {
       const el=document.getElementById(`btsPelatihan${i}`); if(!el) return;
       if(typeof btsTrainingPrograms!=="undefined") Object.keys(btsTrainingPrograms).forEach(k=>{ const o=document.createElement("option"); o.value=k; o.textContent=k; el.appendChild(o); });
    });
  }
  
  handleSendToTask() {
      // NOTE: With OneDrive storage via local download, we don't have a URL to send immediately unless uploaded.
      // For now, prompt user.
      this.showNotification("File diunduh. Silakan upload manual ke tugas.", "info");
      this.closeSuccessModal();
  }
  handleDownload() { this.closeSuccessModal(); }

  showLoadingModal() { document.getElementById("loadingModal")?.classList.remove("hidden"); }
  hideLoadingModal() { document.getElementById("loadingModal")?.classList.add("hidden"); }
  showSuccessModal() { document.getElementById("successModal")?.classList.remove("hidden"); }
  closeSuccessModal() { document.getElementById("successModal")?.classList.add("hidden"); }
  showNotification(msg, type="info") { 
    const n=document.createElement("div"); n.className=`fixed top-4 right-4 p-4 rounded z-50 text-white ${type==="error"?"bg-red-500":"bg-blue-500"}`; 
    n.textContent=msg; document.body.appendChild(n); setTimeout(()=>n.remove(),3000); 
  }
  saveFormState() {} loadFormState() {} initializeCharts() {} startParticleAnimation() {} updateProgressBar() {}
}

document.addEventListener("DOMContentLoaded", () => window.__letterGenerator = new LetterGenerator());