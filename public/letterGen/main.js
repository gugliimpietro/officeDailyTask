// src/public/letterGen/main.js

class LetterGenerator {
  constructor() {
    this.formData = {};
    this.isGenerating = false;
    this.generatedBlob = null;
    this.generatedFilename = null;
    this.currentUser = { username: "guest" };
    this.init().catch((err) => console.error("Init error:", err));
  }

  // --- ANIMATION HELPER ---
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

  // --- INITIALIZATION ---
  async init() {
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

    // Form Change Listeners
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

    // Buttons
    addListener("generateBtn", "click", () => this.handleGenerate());
    addListener("resetBtn", "click", () => this.handleReset());
    addListener("formPreviewBtn", "click", () => alert("Klik 'Generate Surat' terlebih dahulu."));

    // Modal Buttons (Ensure IDs match index.html)
    addListener("modalPreviewBtn", "click", () => this.handlePreview()); 
    addListener("modalSendBtn", "click", () => this.handleSendToTask());
    addListener("modalDownloadBtn", "click", () => this.handleDownload());
    addListener("closeSuccessBtn", "click", () => this.closeSuccessModal());

    // Validation
    document.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("change", () => this.saveFormState());
      input.addEventListener("input", () => this.saveFormState());
      input.addEventListener("blur", (e) => this.validateField(e.target));
    });
  }

  // --- HANDLERS ---
  handleJenisSuratChange(e) {
    const val = e.target.value;
    if (val === "Kurikulum Silabus") { this.showSection(document.getElementById("curriculumSection")); this.hideSection(document.getElementById("btsSection")); }
    else if (val === "Bahan Tayang Standar") { this.hideSection(document.getElementById("curriculumSection")); this.showSection(document.getElementById("btsSection")); }
    this.refreshUI();
  }
  handleSifatSuratChange(e) { this.refreshUI(); }
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
    const varianPenugasan = document.getElementById("varianPenugasan")?.checked;

    const hideMitraTopik = js==="Bahan Tayang Standar" || (js==="Kurikulum Silabus" && jk==="ECP");
    this.setFieldVisible("mitraKerjasama", !hideMitraTopik);
    this.setFieldVisible("topikRapat", !hideMitraTopik);
    this.setFieldVisible("pimpinan", varianPenugasan);
    this.setFieldVisible("instansi", varianPenugasan);

    const fs = document.getElementById("facilitatorSection");
    if(fs) {
       if (js && js !== "") this.showSection(fs); else this.hideSection(fs);
    }
  }

  // --- SUPABASE ---
  async getSupabaseClient() {
    if(this.supabase) return this.supabase;
    if(!window.supabase && !document.querySelector('script[data-supabase-js]')) {
      await new Promise((resolve) => {
        const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
        s.onload=resolve; s.dataset.supabaseJs="true"; document.head.appendChild(s);
      });
    }
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
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

  // --- VALIDATION ---
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
    if (fieldId === "tanggalPelaksanaan" && value) {
      const selected = new Date(value);
      const today = new Date(); today.setHours(0,0,0,0);
      if (selected < today) {
        this.showFieldError(fieldId, "Tanggal tidak boleh kurang dari hari ini");
        return false;
      }
    }
    return true;
  }

  validateForm() {
    let valid = true;
    this.getRequiredFields().forEach(id => {
       if(!this.validateField(document.getElementById(id))) valid=false;
    });
    if(!document.getElementById("lingkupInternal").checked && !document.getElementById("lingkupEksternal").checked) { 
        alert("Pilih lingkup (Internal/Eksternal)!"); 
        valid=false; 
    }
    const varianChecked = ["varianIndividu","varianPenugasan","varianKelompok"].some(id => document.getElementById(id).checked);
    if(!varianChecked) {
        alert("Pilih minimal satu Varian Surat!");
        valid=false;
    }
    return valid;
  }

  getRequiredFields() { 
    const js = document.getElementById("jenisSurat")?.value;
    const jk = document.getElementById("jenisKurikulum")?.value;
    const ss = document.getElementById("sifatSurat")?.value;
    const perihalKPK = document.getElementById("perihalKPK")?.value;

    let required = ["jenisSurat", "sifatSurat", "bulanSurat", "tanggalPelaksanaan"];
    if(ss === "undangan") required.push("waktuPelaksanaan");
    if (this.isFieldVisible("topikRapat")) required.push("topikRapat");

    if (js === "Kurikulum Silabus") {
      required.push("jenisKurikulum");
      if (jk === "KPK") {
        required.push("perihalKPK");
        if (perihalKPK === "persiapan pelatihan" && this.isFieldVisible("mitraKerjasama")) required.push("mitraKerjasama");
      } else if (jk === "ECP") required.push("tahapECP");
    } else if (js === "Bahan Tayang Standar") {
      required.push("jumlahBTS", "btsPelatihan1", "btsMateri1");
    }
    return required.filter(id => this.isFieldVisible(id)); 
  }

  showFieldError(id, msg) { const e=document.getElementById(`${id}Error`); if(e) { e.textContent=msg; e.classList.add("show"); } }

  // --- KEY GENERATION ---
  generateFolderKey(d) {
    const normalize = (text) => String(text || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s\-]/g, "");
    const sifat = normalize(d.sifatSurat);
    const jenis = normalize(d.jenisSurat).replace(/ /g, "_");
    
    let lingkup = "internal";
    if (d.lingkupInternal && d.lingkupEksternal) lingkup = "eksternal"; 
    else if (d.lingkupEksternal) lingkup = "eksternal";

    let varian = "individu";
    if (d.varianPenugasan) varian = "penugasan";
    else if (d.varianKelompok) varian = "kelompok";

    let parts = [sifat, jenis, lingkup];

    if (d.jenisSurat === "Kurikulum Silabus") {
        if (d.jenisKurikulum) parts.push(normalize(d.jenisKurikulum));
        if (d.jenisKurikulum === "KPK" && d.perihalKPK) parts.push(normalize(d.perihalKPK)); 
        else if (d.jenisKurikulum === "ECP" && d.tahapECP) parts.push(normalize(d.tahapECP));
        else if (d.jenisKurikulum === "Jasa Perdagangan" && this.isFieldVisible('perihalKPK')) parts.push(normalize(d.perihalKPK));
    }
    parts.push(varian);
    return parts.join("/");
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

      const templateMetadata = await this.fetchTemplateMetadata(folderKey);
      
      let blob = null;
      if (templateMetadata && templateMetadata.share_url) {
          blob = await this.downloadFileFromUrl(templateMetadata.share_url);
      } else {
          throw new Error(`Template not found for key: ${folderKey}`);
      }

      const payload = this.buildDocxPayload(formData);
      await this.ensureDocxLibsLoaded();
      const renderedBlob = this.renderDocx(await blob.arrayBuffer(), payload);
      
      this.generatedBlob = renderedBlob;
      this.generatedFilename = `surat_generated_${Date.now()}.docx`;
      
      this.showSuccessModal(); 

    } catch(e) {
      console.error(e);
      this.showNotification("Gagal: " + (e.message||"Error"), "error");
    } finally {
      this.hideLoadingModal();
      this.isGenerating = false;
    }
  }

  // --- MULTI-STRATEGY DOWNLOADER ---
  async downloadFileFromUrl(url) {
      if (!url) throw new Error("URL template kosong.");
      console.log("[Generator] Processing Link:", url);

      // Google Drive Logic with Fallbacks
      if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
          const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
              const fileId = match[1];
              const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=docx`;
              
              // Strategy 1: AllOrigins (Often reliable for binary)
              try {
                  const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`;
                  console.log("[Generator] Trying Proxy 1:", proxyUrl1);
                  const resp1 = await fetch(proxyUrl1);
                  if (resp1.ok) return await resp1.blob();
              } catch (e) { console.warn("Proxy 1 failed", e); }

              // Strategy 2: CorsProxy.io (Backup)
              try {
                  const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`;
                  console.log("[Generator] Trying Proxy 2:", proxyUrl2);
                  const resp2 = await fetch(proxyUrl2);
                  if (resp2.ok) return await resp2.blob();
              } catch (e) { console.warn("Proxy 2 failed", e); }

              throw new Error("Gagal download template. Pastikan Google Doc 'Public' (Anyone with link).");
          }
      }
      
      // Fallback for OneDrive/Direct
      if (url.includes("1drv.ms") || url.includes("onedrive.live.com")) {
          const cleanUrl = url.split('?')[0];
          let encodedUrl = btoa(cleanUrl).replace(/\//g, '_').replace(/\+/g, '-').replace(/=+$/, '');
          const apiUrl = `https://api.onedrive.com/v1.0/shares/u!${encodedUrl}/root/content`;
          try {
             const resp = await fetch(apiUrl);
             if (resp.ok) return await resp.blob();
          } catch (e) { console.warn("OneDrive API failed, trying direct..."); }
      }

      // Direct
      try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`Download gagal (Status: ${resp.status})`);
          return await resp.blob();
      } catch (error) { throw error; }
  }

  async fetchTemplateMetadata(folderKey) {
      const client = await this.getSupabaseClient();
      if (!client) return null;
      const { data, error } = await client
        .from('letter_templates')
        .select('*')
        .eq('folder_key', folderKey)
        .maybeSingle();
      if (error) console.warn("[Generator] Metadata error:", error.message);
      return data;
  }

  renderDocx(buf, data) {
    const zip = new window.PizZip(buf);
    const doc = new window.docxtemplater(zip, { paragraphLoop:true, linebreaks:true, delimiters:{start:"[", end:"]"} });
    doc.render(data);
    return doc.getZip().generate({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  }

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

  // --- BUTTON ACTIONS ---
  handleDownload() {
      if (this.generatedBlob && this.generatedFilename) {
          window.saveAs(this.generatedBlob, this.generatedFilename);
          this.showNotification("File diunduh.", "success");
      }
      this.closeSuccessModal();
  }

  handlePreview() {
      if (this.generatedBlob && this.generatedFilename) {
          window.saveAs(this.generatedBlob, "PREVIEW_" + this.generatedFilename);
          this.showNotification("Preview diunduh. Silakan buka di Word.", "info");
      }
  }

  handleSendToTask() {
      if (!this.generatedBlob) return;
      this.showNotification("Memproses pengiriman...", "info");
      const reader = new FileReader();
      reader.readAsDataURL(this.generatedBlob);
      reader.onloadend = () => {
          window.parent.postMessage({
              type: "SEND_GENERATED_LETTER",
              payload: {
                  filename: this.generatedFilename,
                  dataUrl: reader.result,
                  message: "Berikut surat yang telah dibuat."
              }
          }, "*");
          this.closeSuccessModal();
      };
  }

  // --- POPULATE TIME SLOTS (07:00, 07:30...) ---
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
  
  showLoadingModal() { document.getElementById("loadingModal")?.classList.remove("hidden"); }
  hideLoadingModal() { document.getElementById("loadingModal")?.classList.add("hidden"); }
  showSuccessModal() {
    const modal = document.getElementById("successModal");
    const card = document.getElementById("successModalCard");
    if (!modal || !card) return;
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      card.classList.remove("opacity-0", "scale-90");
      card.classList.add("opacity-100", "scale-100");
    });
  }
  closeSuccessModal() {
    const modal = document.getElementById("successModal");
    const card = document.getElementById("successModalCard");
    if (!modal || !card) return;
    card.classList.remove("opacity-100", "scale-100");
    card.classList.add("opacity-0", "scale-90");
    setTimeout(() => modal.classList.add("hidden"), 200);
  }
  showNotification(msg, type="info") { 
    const n=document.createElement("div"); n.className=`fixed top-4 right-4 p-4 rounded z-50 text-white ${type==="error"?"bg-red-500":"bg-blue-500"}`; 
    n.textContent=msg; document.body.appendChild(n); setTimeout(()=>n.remove(),3000); 
  }
  saveFormState() {} loadFormState() {} initializeCharts() {} startParticleAnimation() {} updateProgressBar() {}
}

document.addEventListener("DOMContentLoaded", () => window.__letterGenerator = new LetterGenerator());
