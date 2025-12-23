// Mock Data for Template Letter Generator
// Simulating the Excel data sources from the original Python application

// Facilitator data (simulating list_facilitator.xlsx)
const facilitators = [];

// BTS Training Programs and Curriculum Topics
// Simulating list_bts.xlsx with multiple sheets
const btsTrainingPrograms = {
  "Manajemen Ekspor Impor dengan Simulasi": [
    "Pengantar Ekspor Impor",
    "Dokumen Ekspor Impor",
    "Pembayaran Internasional",
    "Asuransi dan Pengiriman",
    "Simulasi Transaksi Ekspor",
    "Simulasi Transaksi Impor",
    "Manajemen Risiko",
    "Strategi Pemasaran Global",
  ],
  "Prosedur Ekspor": [
    "Perencanaan Ekspor",
    "Penelitian Pasar",
    "Negosiasi dan Kontrak",
    "Persiapan Dokumen",
    "Pengiriman Barang",
    "Pembayaran dan Penagihan",
    "Laporan Ekspor",
    "Evaluasi dan Tindak Lanjut",
  ],
  "Prosedur Impor": [
    "Perencanaan Impor",
    "Pemilihan Supplier",
    "Negosiasi Harga",
    "Dokumen Impor",
    "Bea dan Cukai",
    "Pengiriman dan Penerimaan",
    "Kualitas Barang",
    "Pembayaran Supplier",
  ],
  "Bagaimana Memulai Ekspor": [
    "Analisis Pasar Global",
    "Persiapan Produk",
    "Regulasi dan Legalitas",
    "Modal dan Pendanaan",
    "Jaringan dan Koneksi",
    "Pemasaran Internasional",
    "Pengiriman Internasional",
    "Pengembangan Bisnis",
  ],
};

// Template path configuration
// Maps user selections to template file paths
const templatePaths = {
  "Kurikulum Silabus": {
    undangan: {
      internal: {
        KPK: {
          "persiapan pelatihan":
            "templates/kurikulum_silabus/undangan/internal/kpk/persiapan_pelatihan.docx",
          review:
            "templates/kurikulum_silabus/undangan/internal/kpk/review.docx",
        },
        ECP: {
          default:
            "templates/kurikulum_silabus/undangan/internal/ecp/default.docx",
        },
        "Jasa Perdagangan": {
          default:
            "templates/kurikulum_silabus/undangan/internal/jasa_perdagangan/default.docx",
        },
      },
      eksternal: {
        KPK: {
          "persiapan pelatihan": {
            individu:
              "templates/kurikulum_silabus/undangan/eksternal/kpk/persiapan_pelatihan/individu.docx",
            penugasan:
              "templates/kurikulum_silabus/undangan/eksternal/kpk/persiapan_pelatihan/penugasan.docx",
            kelompok:
              "templates/kurikulum_silabus/undangan/eksternal/kpk/persiapan_pelatihan/kelompok.docx",
          },
          review: {
            individu:
              "templates/kurikulum_silabus/undangan/eksternal/kpk/review/individu.docx",
            penugasan:
              "templates/kurikulum_silabus/undangan/eksternal/kpk/review/penugasan.docx",
            kelompok:
              "templates/kurikulum_silabus/undangan/eksternal/kpk/review/kelompok.docx",
          },
        },
        ECP: {
          default: {
            individu:
              "templates/kurikulum_silabus/undangan/eksternal/ecp/individu.docx",
            penugasan:
              "templates/kurikulum_silabus/undangan/eksternal/ecp/penugasan.docx",
            kelompok:
              "templates/kurikulum_silabus/undangan/eksternal/ecp/kelompok.docx",
          },
        },
      },
    },
    hasil: {
      internal: {
        KPK: {
          default:
            "templates/kurikulum_silabus/hasil/internal/kpk/default.docx",
        },
        ECP: {
          default:
            "templates/kurikulum_silabus/hasil/internal/ecp/default.docx",
        },
      },
      eksternal: {
        KPK: {
          default:
            "templates/kurikulum_silabus/hasil/eksternal/kpk/default.docx",
        },
        ECP: {
          default:
            "templates/kurikulum_silabus/hasil/eksternal/ecp/default.docx",
        },
      },
    },
  },
  "Bahan Tayang Standar": {
    undangan: {
      internal: {
        default:
          "templates/bahan_tayang_standar/undangan/internal/default.docx",
      },
      eksternal: {
        individu:
          "templates/bahan_tayang_standar/undangan/eksternal/individu.docx",
        penugasan:
          "templates/bahan_tayang_standar/undangan/eksternal/penugasan.docx",
        kelompok:
          "templates/bahan_tayang_standar/undangan/eksternal/kelompok.docx",
      },
    },
    hasil: {
      internal: {
        default: "templates/bahan_tayang_standar/hasil/internal/default.docx",
      },
      eksternal: {
        default: "templates/bahan_tayang_standar/hasil/eksternal/default.docx",
      },
    },
  },
};

// Validation rules for different form combinations
const validationRules = {
  "Kurikulum Silabus": {
    undangan: {
      KPK: {
        "persiapan pelatihan": [
          "jenisSurat",
          "sifatSurat",
          "jenisKurikulum",
          "perihalKPK",
          "bulanSurat",
          "lampiran",
          "mitraKerjasama",
          "topikRapat",
          "tanggalPelaksanaan",
          "waktuPelaksanaan",
        ],
        review: [
          "jenisSurat",
          "sifatSurat",
          "jenisKurikulum",
          "perihalKPK",
          "bulanSurat",
          "lampiran",
          "topikRapat",
          "tanggalPelaksanaan",
          "waktuPelaksanaan",
        ],
      },
      ECP: {
        default: [
          "jenisSurat",
          "sifatSurat",
          "jenisKurikulum",
          "bulanSurat",
          "lampiran",
          "tahapECP",
          "tanggalPelaksanaan",
          "waktuPelaksanaan",
        ],
      },
    },
    hasil: {
      KPK: {
        default: [
          "jenisSurat",
          "sifatSurat",
          "jenisKurikulum",
          "bulanSurat",
          "lampiran",
          "topikRapat",
          "tanggalPelaksanaan",
        ],
      },
      ECP: {
        default: [
          "jenisSurat",
          "sifatSurat",
          "jenisKurikulum",
          "bulanSurat",
          "lampiran",
          "tahapECP",
          "tanggalPelaksanaan",
        ],
      },
    },
  },
  "Bahan Tayang Standar": {
    undangan: {
      default: [
        "jenisSurat",
        "sifatSurat",
        "bulanSurat",
        "lampiran",
        "jumlahBTS",
        "btsPelatihan1",
        "btsMateri1",
        "tanggalPelaksanaan",
        "waktuPelaksanaan",
      ],
    },
    hasil: {
      default: [
        "jenisSurat",
        "sifatSurat",
        "bulanSurat",
        "lampiran",
        "jumlahBTS",
        "btsPelatihan1",
        "btsMateri1",
        "tanggalPelaksanaan",
      ],
    },
  },
};

// Month translations (English to Indonesian)
const monthTranslations = {
  January: "Januari",
  February: "Februari",
  March: "Maret",
  April: "April",
  May: "Mei",
  June: "Juni",
  July: "Juli",
  August: "Agustus",
  September: "September",
  October: "Oktober",
  November: "November",
  December: "Desember",
};

// Time slots for dropdown (07:00 - 20:30)
const timeSlots = [];
for (let hour = 7; hour <= 20; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    timeSlots.push(timeString);
  }
}

// Field labels for error messages
const fieldLabels = {
  jenisSurat: "Jenis Surat",
  sifatSurat: "Sifat Surat",
  jenisKurikulum: "Jenis Kurikulum",
  perihalKPK: "Perihal Surat",
  bulanSurat: "Bulan Pembuatan Surat",
  lampiran: "Lampiran",
  mitraKerjasama: "Mitra Kerja Sama",
  topikRapat: "Judul Pelatihan/Topik Rapat",
  tanggalPelaksanaan: "Tanggal Pelaksanaan",
  waktuPelaksanaan: "Waktu Pelaksanaan",
  jumlahBTS: "Jumlah BTS",
  btsPelatihan1: "BTS Pelatihan 1",
  btsMateri1: "Materi BTS 1",
  btsPelatihan2: "BTS Pelatihan 2",
  btsMateri2: "Materi BTS 2",
  btsPelatihan3: "BTS Pelatihan 3",
  btsMateri3: "Materi BTS 3",
  tahapECP: "Tahap ECP",
};

// Template usage statistics (for charts)
const templateUsageStats = {
  letterTypes: {
    "Kurikulum Silabus": 65,
    "Bahan Tayang Standar": 35,
  },
  monthlyUsage: {
    Januari: 45,
    Februari: 38,
    Maret: 52,
    April: 41,
    Mei: 35,
    Juni: 48,
    Juli: 55,
    Agustus: 62,
    September: 58,
    Oktober: 44,
    November: 39,
    Desember: 28,
  },
};

// Export data for use in main.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    facilitators,
    btsTrainingPrograms,
    templatePaths,
    validationRules,
    monthTranslations,
    timeSlots,
    fieldLabels,
    templateUsageStats,
  };
}
