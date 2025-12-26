import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET;

if (!url || !key || !bucket) {
  console.error("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET");
  process.exit(1);
}

const supabase = createClient(url, key);

function normalizePath(p) {
  return p
    .split("/")
    .map(seg => seg.trim())
    .filter(Boolean)
    .join("/");
}
// --- Paths you asked for ---
const RAW_PATHS = [
  // kurikulum_silabus - kpk
  "undangan/kurikulum_silabus/eksternal/kpk/persiapan pelatihan/individu",
  "undangan/kurikulum_silabus/eksternal/kpk/persiapan pelatihan/kelompok",
  "undangan/kurikulum_silabus/eksternal/kpk/persiapan pelatihan/penugasan",
  "undangan/kurikulum_silabus/eksternal/kpk/review/individu",
  "undangan/kurikulum_silabus/eksternal/kpk/review/kelompok",
  "undangan/kurikulum_silabus/eksternal/kpk/review/penugasan",
  "undangan/kurikulum_silabus/internal/kpk/persiapan pelatihan/individu",
  "undangan/kurikulum_silabus/internal/kpk/persiapan pelatihan/kelompok",
  "undangan/kurikulum_silabus/internal/kpk/persiapan pelatihan/penugasan",
  "undangan/kurikulum_silabus/internal/kpk/review/individu",
  "undangan/kurikulum_silabus/internal/kpk/review/kelompok",
  "undangan/kurikulum_silabus/internal/kpk/review/penugasan",

  // kurikulum_silabus - ecp
  "undangan/kurikulum_silabus/eksternal/ecp/persiapan pelatihan/individu",
  "undangan/kurikulum_silabus/eksternal/ecp/persiapan pelatihan/kelompok",
  "undangan/kurikulum_silabus/eksternal/ecp/persiapan pelatihan/penugasan",
  "undangan/kurikulum_silabus/eksternal/ecp/review/individu",
  "undangan/kurikulum_silabus/eksternal/ecp/review/kelompok",
  "undangan/kurikulum_silabus/eksternal/ecp/review/penugasan",
  "undangan/kurikulum_silabus/internal/ecp/persiapan pelatihan/individu",
  "undangan/kurikulum_silabus/internal/ecp/persiapan pelatihan/kelompok",
  "undangan/kurikulum_silabus/internal/ecp/persiapan pelatihan/penugasan",
  "undangan/kurikulum_silabus/internal/ecp/review/individu",
  "undangan/kurikulum_silabus/internal/ecp/review/kelompok",
  "undangan/kurikulum_silabus/internal/ecp/review/penugasan",

  // kurikulum_silabus - jasa perdagangan
  "undangan/kurikulum_silabus/eksternal/jasa perdagangan/persiapan pelatihan/individu",
  "undangan/kurikulum_silabus/eksternal/jasa perdagangan/persiapan pelatihan/kelompok",
  "undangan/kurikulum_silabus/eksternal/jasa perdagangan/persiapan pelatihan/penugasan",
  "undangan/kurikulum_silabus/eksternal/jasa perdagangan/review/individu",
  "undangan/kurikulum_silabus/eksternal/jasa perdagangan/review/kelompok",
  "undangan/kurikulum_silabus/eksternal/jasa perdagangan/review/penugasan",
  "undangan/kurikulum_silabus/internal/jasa perdagangan/persiapan pelatihan/individu",
  "undangan/kurikulum_silabus/internal/jasa perdagangan/persiapan pelatihan/kelompok",
  "undangan/kurikulum_silabus/internal/jasa perdagangan/persiapan pelatihan/penugasan",
  "undangan/kurikulum_silabus/internal/jasa perdagangan/review/individu",
  "undangan/kurikulum_silabus/internal/jasa perdagangan/review/kelompok",
  "undangan/kurikulum_silabus/internal/jasa perdagangan/review/penugasan",

  // bahan_tayang_standar
  "undangan/bahan_tayang_standar/eksternal/individu",
  "undangan/bahan_tayang_standar/eksternal/kelompok",
  "undangan/bahan_tayang_standar/eksternal/penugasan",
  "undangan/bahan_tayang_standar/internal/individu",
  "undangan/bahan_tayang_standar/internal/kelompok",
  "undangan/bahan_tayang_standar/internal/penugasan",
];

const PATHS = Array.from(new Set(RAW_PATHS.map(normalizePath)));

async function main() {
  console.log(`Seeding ${PATHS.length} visible placeholders into bucket "${bucket}"...`);

  for (const prefix of PATHS) {
    const objectKey = `${prefix}/__keep.txt`; // ✅ NOT hidden
    const content = Buffer.from("keep");

    const { error } = await supabase.storage.from(bucket).upload(objectKey, content, {
      upsert: true,
      contentType: "text/plain",
    });

    if (error) console.error("FAILED:", objectKey, error.message);
    else console.log("OK:", objectKey);
  }

  console.log("Done.");
}

main().catch(console.error);
