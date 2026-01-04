import { monthTranslations, timeSlots } from './Data.js';

export class GeneratorService {
    constructor(driveService, templateRootId) {
        this.driveService = driveService;
        this.templateRootId = templateRootId;
    }

    async generateLetter(formData, scope, currentUser) {
        if (!this.driveService) throw new Error("DriveService required.");

        // 1. Build Path for Template (Logic matching Drive Folder Structure)
        const templatePath = [];
        templatePath.push(formData.sifatSurat);
        templatePath.push(formData.jenisSurat);
        templatePath.push(scope); // internal or eksternal
        
        if (formData.jenisSurat === "Kurikulum Silabus") {
            if (formData.jenisKurikulum) templatePath.push(formData.jenisKurikulum);
            if (formData.jenisKurikulum === "KPK" && formData.perihalKPK) templatePath.push(formData.perihalKPK);
        }
        
        let varian = "";
        // Internal letters do not use Varian in path usually, unless specified
        if (scope !== "internal") {
            if (formData.varianIndividu) varian = "individu";
            else if (formData.varianPenugasan) varian = "penugasan";
            else if (formData.varianKelompok) varian = "kelompok";
        }
        if(varian) templatePath.push(varian);

        // 2. Find Template Blob
        const blob = await this.driveService.findTemplateBlob(templatePath, this.templateRootId);

        // 3. Prepare Payload
        const payload = this.buildDocxPayload(formData);

        // 4. Render Docx
        const renderedBlob = await this.renderDocx(blob, payload);
        
        // 5. Build Output Filename and Path
        const normalize = (str) => (str ? str.replace(/[^a-zA-Z0-9]/g, "_") : "doc");
        const filename = `surat_${normalize(formData.sifatSurat)}_${scope}_${Date.now()}.docx`;

        const username = currentUser.username || "user";
        const outputPath = [username];
        if (formData.sifatSurat) outputPath.push(normalize(formData.sifatSurat));
        
        // Slightly different logic for output folder organization if desired
        if (formData.jenisKurikulum) outputPath.push(normalize(formData.jenisKurikulum));
        else if (formData.jenisSurat) outputPath.push(normalize(formData.jenisSurat));

        // 6. Upload
        const url = await this.driveService.uploadToGoogleDrive(renderedBlob, filename, outputPath);
        
        // Force Edit Mode
        let editUrl = url;
        if (url && url.includes("/view")) {
            editUrl = url.replace("/view", "/edit");
        }

        return { url: editUrl, filename, blob: renderedBlob };
    }

    buildDocxPayload(formData) {
        // Helper to format date
        const formatDate = (dateStr) => {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            const day = d.getDate();
            const month = Object.values(monthTranslations)[d.getMonth()];
            const year = d.getFullYear();
            return `${day} ${month} ${year}`;
        };

        return {
            ...formData,
            tanggalPelaksanaanFormatted: formatDate(formData.tanggalPelaksanaan),
            waktuPelaksanaan: formData.waktuPelaksanaan || "",
            // Add other derived fields if needed
            currentDate: formatDate(new Date().toISOString()),
        };
    }

    async renderDocx(templateBlob, data) {
        if (!window.PizZip || !window.docxtemplater) {
            throw new Error("Library PizZip atau docxtemplater belum dimuat.");
        }

        const content = await templateBlob.arrayBuffer();
        const zip = new PizZip(content);
        
        const doc = new window.docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

        const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        
        return out;
    }
}
