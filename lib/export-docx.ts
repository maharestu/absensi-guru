import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  VerticalAlign,
  HeightRule,
} from "docx";
import { isWeekendWIB } from "./date";

const BULAN_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const HARI_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jum'at",
  "Sabtu",
];

export interface DocxExportGuru {
  id: string;
  nama: string;
  nip: string;
}

export interface DocxExportRecord {
  tanggal: string;
  raw_tanggal?: string;
  waktu_masuk?: string;
  waktu_pulang?: string;
  status: string;
}

export interface ExportDocxOptions {
  guru: DocxExportGuru;
  startDate: string;
  endDate: string;
  records: DocxExportRecord[];
  hariLiburList?: { tanggal: string; keterangan?: string }[];
  liburPanjang?: {
    aktif?: boolean;
    mulai?: string | null;
    selesai?: string | null;
  };
  kepalaSekolah?: {
    nama: string;
    nip: string;
  };
}

async function fetchImageBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    if (typeof window !== "undefined") {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } else {
      // Fallback for Node/server testing
      const fs = await import("fs");
      const path = await import("path");
      const cleanPath = url.startsWith("/") ? url.slice(1) : url;
      const fullPath = path.join(process.cwd(), "public", cleanPath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      }
      return null;
    }
  } catch (err) {
    console.warn("Gagal memuat gambar logo untuk export docx:", url, err);
    return null;
  }
}

export async function generateRekapAbsensiDocx(options: ExportDocxOptions): Promise<Blob> {
  const {
    guru,
    startDate,
    endDate,
    records,
    hariLiburList = [],
    liburPanjang,
    kepalaSekolah,
  } = options;

  // 1. Muat Logo Karawang & Logo Sekolah
  const [logoKarawangBuffer, logoSekolahBuffer] = await Promise.all([
    fetchImageBuffer("/logo_kabupaten_karawang_transparan.png"),
    fetchImageBuffer("/Logo.png"),
  ]);

  // 2. Buat Kop Surat (Tabel 1 Baris, 3 Kolom tanpa border)
  const kopRowCells: TableCell[] = [
    // Kolom Kiri: Logo Karawang
    new TableCell({
      width: { size: 1200, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: logoKarawangBuffer
            ? [
                new ImageRun({
                  data: new Uint8Array(logoKarawangBuffer),
                  transformation: { width: 55, height: 75 },
                  type: "png",
                }),
              ]
            : [],
        }),
      ],
    }),

    // Kolom Tengah: Teks Identitas Sekolah
    new TableCell({
      width: { size: 5500, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: "PEMERINTAH KABUPATEN KARAWANG",
              font: "Arial",
              bold: true,
              size: 22, // 11pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: "DINAS PENDIDIKAN DAN KEBUDAYAAN",
              font: "Arial",
              bold: true,
              size: 22, // 11pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: "SMP NEGERI 8 KARAWANG BARAT",
              font: "Arial",
              bold: true,
              size: 26, // 13pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: "Jl. Pasir Malang Blok Sibak Kel. Karangpawitan–Karawang 41315",
              font: "Arial",
              size: 17, // 8.5pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [
            new TextRun({
              text: "E-mail : smpnegeri8karawangbarat@gmail.com",
              font: "Arial",
              size: 17, // 8.5pt
            }),
          ],
        }),
      ],
    }),

    // Kolom Kanan: Logo SMPN 8
    new TableCell({
      width: { size: 1200, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: logoSekolahBuffer
            ? [
                new ImageRun({
                  data: new Uint8Array(logoSekolahBuffer),
                  transformation: { width: 70, height: 70 },
                  type: "png",
                }),
              ]
            : [],
        }),
      ],
    }),
  ];

  const kopTable = new Table({
    alignment: AlignmentType.CENTER,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: kopRowCells,
      }),
    ],
  });

  // Garis Pembatas Kop Surat (Garis Ganda)
  const kopDivider = new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.DOUBLE,
        size: 16,
        color: "000000",
      },
    },
    spacing: { after: 200 },
  });

  // 3. Tentukan Judul Periode
  const [startY, startM] = startDate.split("-").map(Number);
  const [endY, endM] = endDate.split("-").map(Number);

  let judulPeriode = "";
  if (startY === endY && startM === endM) {
    const bulanStr = BULAN_NAMES[startM - 1]?.toUpperCase() || "";
    judulPeriode = `DAFTAR KEHADIRAN ${bulanStr} TAHUN ${startY}`;
  } else {
    judulPeriode = `DAFTAR KEHADIRAN PERIODE ${startDate} S.D. ${endDate}`;
  }

  const judulParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 200 },
    children: [
      new TextRun({
        text: judulPeriode,
        font: "Arial",
        bold: true,
        size: 22, // 11pt
      }),
    ],
  });

  // 4. Identitas Guru (Indent 610 agar sejajar tepat dengan tabel yang berada di tengah)
  const identitasGuruNama = new Paragraph({
    indent: { left: 610 },
    spacing: { after: 40 },
    children: [
      new TextRun({
        text: "Nama",
        font: "Arial",
        size: 18,
      }),
      new TextRun({
        text: "       :   ",
        font: "Arial",
        size: 18,
      }),
      new TextRun({
        text: guru.nama || "-",
        font: "Arial",
        bold: true,
        size: 18,
      }),
    ],
  });

  const identitasGuruNip = new Paragraph({
    indent: { left: 610 },
    spacing: { after: 180 },
    children: [
      new TextRun({
        text: "NIP",
        font: "Arial",
        size: 18,
      }),
      new TextRun({
        text: "         :   ",
        font: "Arial",
        size: 18,
      }),
      new TextRun({
        text: guru.nip || "-",
        font: "Arial",
        size: 18,
      }),
    ],
  });

  // 5. Susun Tabel Absensi Harian
  const cellBorderSingle = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "000000",
  };

  const tableHeaderRow = new TableRow({
    height: { value: 340, rule: HeightRule.ATLEAST },
    tableHeader: true,
    children: [
      createHeaderCell("TANGGAL", 1030),
      createHeaderCell("HARI", 1561),
      createHeaderCell("JAM MASUK", 1561),
      createHeaderCell("JAM PULANG", 1561),
      createHeaderCell("KETERANGAN", 2092),
    ],
  });

  // Mapping records guru berdasarkan tanggal
  const recordMap = new Map<string, DocxExportRecord>();
  records.forEach((r) => {
    if (r.raw_tanggal) {
      recordMap.set(r.raw_tanggal, r);
    }
    if (r.tanggal) {
      recordMap.set(r.tanggal, r);
    }
  });

  // Set tanggal merah
  const hariLiburSet = new Set<string>();
  hariLiburList.forEach((h) => hariLiburSet.add(h.tanggal));

  // Rentang tanggal
  const sDate = new Date(`${startDate}T00:00:00Z`);
  const eDate = new Date(`${endDate}T00:00:00Z`);
  const todayWIB = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

  const dataRows: TableRow[] = [];
  const curDate = new Date(sDate);

  while (curDate <= eDate) {
    const y = curDate.getUTCFullYear();
    const m = String(curDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(curDate.getUTCDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const dayNumber = curDate.getUTCDate();
    const dayIndex = curDate.getUTCDay();
    const hariName = HARI_NAMES[dayIndex];

    // Evaluasi status
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    let isLibur = isWeekend || hariLiburSet.has(dateStr);

    if (!isLibur && liburPanjang?.aktif) {
      const lm = liburPanjang.mulai;
      const ls = liburPanjang.selesai;
      if (!lm && !ls) isLibur = true;
      else if (lm && ls) isLibur = dateStr >= lm && dateStr <= ls;
      else if (lm && !ls) isLibur = dateStr >= lm;
    }

    let jamMasuk = "-";
    let jamPulang = "-";
    let keterangan = "-";

    if (isLibur) {
      jamMasuk = "-";
      jamPulang = "-";
      keterangan = "Libur";
    } else {
      const rec = recordMap.get(dateStr);
      if (rec) {
        const sLower = rec.status.toLowerCase();
        if (sLower === "hadir") {
          jamMasuk = (rec.waktu_masuk && rec.waktu_masuk !== "—") ? rec.waktu_masuk : "-";
          jamPulang = (rec.waktu_pulang && rec.waktu_pulang !== "—") ? rec.waktu_pulang : "-";
          keterangan = "Hadir";
        } else if (sLower === "izin") {
          keterangan = "Izin";
        } else if (sLower === "sakit") {
          keterangan = "Sakit";
        } else if (sLower.includes("dinas")) {
          keterangan = "Dinas Luar";
        } else if (sLower.includes("tidak") || sLower === "—" || sLower === "-") {
          keterangan = "Tidak Hadir";
        } else {
          keterangan = rec.status;
          jamMasuk = (rec.waktu_masuk && rec.waktu_masuk !== "—") ? rec.waktu_masuk : "-";
        }
      } else {
        if (dateStr > todayWIB) {
          keterangan = "-";
        } else {
          keterangan = "Tidak Hadir";
        }
      }
    }

    dataRows.push(
      new TableRow({
        height: { value: 250, rule: HeightRule.ATLEAST },
        children: [
          createDataCell(String(dayNumber), 1030, AlignmentType.CENTER),
          createDataCell(hariName, 1561, AlignmentType.CENTER),
          createDataCell(jamMasuk, 1561, AlignmentType.CENTER),
          createDataCell(jamPulang, 1561, AlignmentType.CENTER),
          createDataCell(keterangan, 2092, AlignmentType.CENTER),
        ],
      })
    );

    curDate.setUTCDate(curDate.getUTCDate() + 1);
  }

  const attendanceTable = new Table({
    alignment: AlignmentType.CENTER,
    width: { size: 7805, type: WidthType.DXA },
    borders: {
      top: cellBorderSingle,
      bottom: cellBorderSingle,
      left: cellBorderSingle,
      right: cellBorderSingle,
      insideHorizontal: cellBorderSingle,
      insideVertical: cellBorderSingle,
    },
    rows: [tableHeaderRow, ...dataRows],
  });

  // 6. Tanda Tangan Kepala Sekolah (Kanan Bawah sejajar sisi kanan tabel)
  const signMonth = BULAN_NAMES[endM - 1] || "";
  const signYear = endY;

  const ttdTanggal = new Paragraph({
    spacing: { before: 240, after: 30 },
    indent: { left: 5200 },
    children: [
      new TextRun({
        text: `Karawang,    ${signMonth} ${signYear}`,
        font: "Arial",
        size: 18,
      }),
    ],
  });

  const ttdJabatan = new Paragraph({
    spacing: { after: 700 }, // Ruang tanda tangan
    indent: { left: 5200 },
    children: [
      new TextRun({
        text: "Kepala Sekolah SMPN 8 Karawang Barat",
        font: "Arial",
        size: 18,
      }),
    ],
  });

  const ttdNama = new Paragraph({
    spacing: { after: 30 },
    indent: { left: 5200 },
    children: [
      new TextRun({
        text: kepalaSekolah?.nama || "H. Mamay Abdullah, S.Pd., M.Pd.",
        font: "Arial",
        bold: true,
        size: 18,
        underline: {},
      }),
    ],
  });

  const ttdNip = new Paragraph({
    spacing: { after: 0 },
    indent: { left: 5200 },
    children: [
      new TextRun({
        text: `NIP. ${kepalaSekolah?.nip || "197007241998021003"}`,
        font: "Arial",
        size: 18,
      }),
    ],
  });

  // 7. Bangun Dokumen
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,  // A4
              height: 16838, // A4
            },
            margin: {
              top: 1296,    // 0.9 inci (sesuai template resmi)
              bottom: 1296, // 0.9 inci
              left: 1440,   // 1.0 inci (sesuai template resmi)
              right: 1440,  // 1.0 inci
            },
          },
        },
        children: [
          kopTable,
          kopDivider,
          judulParagraph,
          identitasGuruNama,
          identitasGuruNip,
          attendanceTable,
          ttdTanggal,
          ttdJabatan,
          ttdNama,
          ttdNip,
        ],
      },
    ],
  });


  return await Packer.toBlob(doc);
}

function createHeaderCell(text: string, widthDxa: number): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: "FFFFFF" },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            font: "Arial",
            bold: true,
            size: 18, // 9pt
          }),
        ],
      }),
    ],
  });
}

function createDataCell(
  text: string,
  widthDxa: number,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment,
        children: [
          new TextRun({
            text,
            font: "Arial",
            size: 18, // 9pt
          }),
        ],
      }),
    ],
  });
}

export function triggerDownload(blob: Blob, filename: string) {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
