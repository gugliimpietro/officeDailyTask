export class DriveService {
    constructor(apiKey, gasUploadUrl) {
        this.apiKey = apiKey;
        this.gasUploadUrl = gasUploadUrl;
    }

    // --- SEARCH (Public Access via API Key) ---
    async findFolderId(name, parentId = 'root') {
        const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${this.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) { console.error("Drive API Error:", data.error); return null; }
        return (data.files && data.files.length > 0) ? data.files[0].id : null;
    }

    async findTemplateBlob(folderPathArray, rootId) {
        console.log("[Drive] Searching Template Path:", folderPathArray.join('/'));
        
        let currentId = rootId;
        if (!currentId || currentId.startsWith("1XX")) {
            throw new Error("ID Folder Template tidak valid.");
        }

        // Traverse subfolders
        for (const folderName of folderPathArray) {
            if (!folderName) continue;
            let nextId = await this.findFolderId(folderName, currentId);
            
            if (!nextId) {
                 console.warn(`Folder '${folderName}' not found inside parent ID ${currentId}.`);
                 throw new Error(`Template folder tidak ditemukan: ${folderName}`);
            }
            currentId = nextId;
        }

        // Find .docx file
        const q = `mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' and '${currentId}' in parents and trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${this.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.files || data.files.length === 0) {
            throw new Error("Tidak ada file .docx di folder template tujuan.");
        }

        const file = data.files[0]; 
        console.log("[Drive] Found Template:", file.name);
        return await this.downloadFileBlob(file.id);
    }

    async downloadFileBlob(fileId) {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Gagal download template file.");
        return await res.blob();
    }

    // --- UPLOAD (GAS Web App) ---
    async uploadToGoogleDrive(blob, filename, pathArray) {
        if (!this.gasUploadUrl) throw new Error("GAS Upload URL not configured!");
        
        console.log("[Drive] Uploading via GAS:", pathArray.join('/'));
        const base64 = await this.blobToBase64(blob);
        
        const payload = {
          filename: filename,
          file: base64,
          path: pathArray
        };
    
        const res = await fetch(this.gasUploadUrl, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if(data.status !== "success") throw new Error(data.message || "GAS Upload Failed");
        
        console.log("[Drive] Upload Success:", data.url);
        return data.url;
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    // --- AUTHENTICATED HELPERS (if needed later) ---
    // Not strictly needed for the current "Zero-Login Upload" proxied by GAS, 
    // but useful if we want to create folders directly with User token.
}
