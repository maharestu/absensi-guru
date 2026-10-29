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
  PageOrientation,
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

export function formatJudulPeriode(
  startDate: string,
  endDate: string,
  prefix: string = "DAFTAR REKAPITULASI KEHADIRAN GURU"
): string {
  if (!startDate || !endDate) return prefix;
  try {
    const [startY, startM, startD] = startDate.split("-").map(Number);
    const [endY, endM, endD] = endDate.split("-").map(Number);

    const startBulan = BULAN_NAMES[startM - 1]?.toUpperCase() || "";
    const endBulan = BULAN_NAMES[endM - 1]?.toUpperCase() || "";

    const lastDayOfMonth = new Date(startY, startM, 0).getDate();
    const isFullMonth = startY === endY && startM === endM && startD === 1 && endD === lastDayOfMonth;

    if (isFullMonth) {
      return `${prefix} BULAN ${endBulan} TAHUN ${endY}`;
    }
    if (startDate === endDate) {
      return `${prefix} TANGGAL ${startD} ${startBulan} ${startY}`;
    }
    if (startY === endY && startM === endM) {
      return `${prefix} PERIODE ${startD} S.D. ${endD} ${endBulan} ${endY}`;
    }
    if (startY === endY) {
      return `${prefix} PERIODE ${startD} ${startBulan} S.D. ${endD} ${endBulan} ${endY}`;
    }
    return `${prefix} PERIODE ${startD} ${startBulan} ${startY} S.D. ${endD} ${endBulan} ${endY}`;
  } catch {
    return `${prefix} PERIODE ${startDate} S.D. ${endDate}`;
  }
}

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
                  transformation: { width: 50, height: 68 },
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
          spacing: { after: 15 },
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
          spacing: { after: 15 },
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
          spacing: { after: 25 },
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
          spacing: { after: 15 },
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
                  transformation: { width: 62, height: 62 },
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
    spacing: { after: 150 },
  });

  // 3. Tentukan Judul Periode Dinamis
  const judulPeriode = formatJudulPeriode(startDate, endDate, "DAFTAR KEHADIRAN");

  const judulParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 150 },
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
    spacing: { after: 30 },
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
    spacing: { after: 140 },
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
    height: { value: 300, rule: HeightRule.ATLEAST },
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
        height: { value: 235, rule: HeightRule.ATLEAST },
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
  const [endY, endM] = endDate.split("-").map(Number);
  const signMonth = BULAN_NAMES[endM - 1] || "";
  const signYear = endY;

  const ttdTanggal = new Paragraph({
    spacing: { before: 140, after: 30 },
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
    spacing: { after: 560 }, // Ruang tanda tangan proporsional & nyaman
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
    spacing: { after: 25 },
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
              top: 800,    // ~1.4 cm (proporsional & muat 1 halaman)
              bottom: 800, // ~1.4 cm
              left: 1100,  // ~1.9 cm
              right: 1100, // ~1.9 cm
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
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240 },
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
    margins: { top: 25, bottom: 25, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment,
        spacing: { before: 0, after: 0, line: 230 },
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

export interface RekapGuruKehadiranRow {
  nama: string;
  nip: string;
  totalHariKerja: number;
  persentaseHadir: number;
  jumlahHadir: number;
  izin: number;
  sakit: number;
  dinasLuar: number;
  tidakHadir: number;
}

export interface ExportSemuaGuruDocxOptions {
  startDate: string;
  endDate: string;
  rows: RekapGuruKehadiranRow[];
  statistik?: {
    avgKehadiran?: string;
    totalGuru?: number;
  };
  kepalaSekolah?: {
    nama: string;
    nip: string;
  };
}

function createCompactHeaderCell(text: string, widthDxa: number): TableCell {
  const lines = text.split("\n");
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: "F8FAFC" },
    margins: { top: 25, bottom: 25, left: 30, right: 30 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 190 },
        children: lines.map((line, idx) =>
          new TextRun({
            text: line,
            font: "Arial",
            bold: true,
            size: 14, // 7pt
            break: idx > 0 ? 1 : 0,
          })
        ),
      }),
    ],
  });
}

function createCompactDataCell(
  text: string,
  widthDxa: number,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 20, bottom: 20, left: 30, right: 30 },
    children: [
      new Paragraph({
        alignment,
        spacing: { before: 0, after: 0, line: 195 },
        children: [
          new TextRun({
            text,
            font: "Arial",
            size: 14, // 7pt
          }),
        ],
      }),
    ],
  });
}

export async function generateRekapSemuaGuruDocx(options: ExportSemuaGuruDocxOptions): Promise<Blob> {
  const {
    startDate,
    endDate,
    rows,
    statistik,
    kepalaSekolah,
  } = options;

  // 1. Muat Logo Karawang & Logo Sekolah
  const [logoKarawangBuffer, logoSekolahBuffer] = await Promise.all([
    fetchImageBuffer("/logo_kabupaten_karawang_transparan.png"),
    fetchImageBuffer("/Logo.png"),
  ]);

  // 2. Buat Kop Surat A4 Portrait (Lebar total 10500 DXA)
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
                  transformation: { width: 44, height: 60 },
                  type: "png",
                }),
              ]
            : [],
        }),
      ],
    }),

    // Kolom Tengah: Teks Identitas Sekolah
    new TableCell({
      width: { size: 8100, type: WidthType.DXA },
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
          spacing: { after: 10 },
          children: [
            new TextRun({
              text: "PEMERINTAH KABUPATEN KARAWANG",
              font: "Arial",
              bold: true,
              size: 20, // 10pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 10 },
          children: [
            new TextRun({
              text: "DINAS PENDIDIKAN DAN KEBUDAYAAN",
              font: "Arial",
              bold: true,
              size: 20, // 10pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 16 },
          children: [
            new TextRun({
              text: "SMP NEGERI 8 KARAWANG BARAT",
              font: "Arial",
              bold: true,
              size: 24, // 12pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 10 },
          children: [
            new TextRun({
              text: "Jl. Pasir Malang Blok Sibak Kel. Karangpawitan–Karawang 41315",
              font: "Arial",
              size: 15, // 7.5pt
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
              size: 15, // 7.5pt
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
                  transformation: { width: 54, height: 54 },
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
    columnWidths: [1200, 8100, 1200],
    width: { size: 10500, type: WidthType.DXA },
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

  const kopDivider = new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.DOUBLE,
        size: 16,
        color: "000000",
      },
    },
    spacing: { after: 100 },
  });

  // 3. Judul Rekapitulasi Dinamis Sesuai Periode
  const judulPeriode = formatJudulPeriode(startDate, endDate, "DAFTAR REKAPITULASI KEHADIRAN GURU");

  const judulParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 100 },
    children: [
      new TextRun({
        text: judulPeriode,
        font: "Arial",
        bold: true,
        size: 20, // 10pt
      }),
    ],
  });

  // 4. Susun Tabel Rekapitulasi Kehadiran Seluruh Guru (A4 Portrait - Total 10500 DXA)
  const cellBorderSingle = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "000000",
  };

  const colWidths = [450, 2650, 1900, 950, 750, 750, 700, 700, 850, 800]; // Total: 10500 DXA

  const tableHeaderRow = new TableRow({
    height: { value: 300, rule: HeightRule.ATLEAST },
    tableHeader: true,
    cantSplit: true,
    children: [
      createCompactHeaderCell("NO", colWidths[0]),
      createCompactHeaderCell("NAMA GURU", colWidths[1]),
      createCompactHeaderCell("NIP / NUPTK", colWidths[2]),
      createCompactHeaderCell("TOTAL\nHARI", colWidths[3]),
      createCompactHeaderCell("%\nHADIR", colWidths[4]),
      createCompactHeaderCell("HADIR", colWidths[5]),
      createCompactHeaderCell("IZIN", colWidths[6]),
      createCompactHeaderCell("SAKIT", colWidths[7]),
      createCompactHeaderCell("DINAS\nLUAR", colWidths[8]),
      createCompactHeaderCell("TIDAK\nHADIR", colWidths[9]),
    ],
  });

  const dataRows = rows.map((row, index) => {
    return new TableRow({
      cantSplit: true,
      children: [
        createCompactDataCell(String(index + 1), colWidths[0], AlignmentType.CENTER),
        createCompactDataCell(row.nama || "-", colWidths[1], AlignmentType.LEFT),
        createCompactDataCell(row.nip ? row.nip : "—", colWidths[2], AlignmentType.CENTER),
        createCompactDataCell(String(row.totalHariKerja ?? 0), colWidths[3], AlignmentType.CENTER),
        createCompactDataCell(`${row.persentaseHadir ?? 0}%`, colWidths[4], AlignmentType.CENTER),
        createCompactDataCell(String(row.jumlahHadir ?? 0), colWidths[5], AlignmentType.CENTER),
        createCompactDataCell(String(row.izin ?? 0), colWidths[6], AlignmentType.CENTER),
        createCompactDataCell(String(row.sakit ?? 0), colWidths[7], AlignmentType.CENTER),
        createCompactDataCell(String(row.dinasLuar ?? 0), colWidths[8], AlignmentType.CENTER),
        createCompactDataCell(String(row.tidakHadir ?? 0), colWidths[9], AlignmentType.CENTER),
      ],
    });
  });

  const attendanceTable = new Table({
    alignment: AlignmentType.CENTER,
    columnWidths: colWidths,
    width: { size: 10500, type: WidthType.DXA },
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

  // 5. Bagian Bawah: Ringkasan Info Kehadiran + Tanda Tangan Kepala Sekolah (Total 10500 DXA)
  const [endY, endM] = endDate.split("-").map(Number);
  const signMonth = BULAN_NAMES[endM - 1] || "";
  const signYear = endY;
  const totalGuruTercatat = statistik?.totalGuru ?? rows.length;
  const avgKehadiranText = statistik?.avgKehadiran ?? "0%";

  const footerTable = new Table({
    alignment: AlignmentType.CENTER,
    columnWidths: [5500, 5000],
    width: { size: 10500, type: WidthType.DXA },
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
        cantSplit: true,
        children: [
          // Kolom Kiri: Keterangan / Ringkasan Persentase Kehadiran
          new TableCell({
            width: { size: 5500, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { before: 100, after: 20 },
                children: [
                  new TextRun({
                    text: "Ringkasan Eksekutif Kehadiran:",
                    font: "Arial",
                    bold: true,
                    size: 15, // 7.5pt
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({
                    text: "• Total Guru Terdaftar      : ",
                    font: "Arial",
                    size: 15,
                  }),
                  new TextRun({
                    text: `${totalGuruTercatat} Orang Guru`,
                    font: "Arial",
                    bold: true,
                    size: 15,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: "• Rata-rata Kehadiran Guru : ",
                    font: "Arial",
                    size: 15,
                  }),
                  new TextRun({
                    text: `${avgKehadiranText}`,
                    font: "Arial",
                    bold: true,
                    size: 15,
                  }),
                ],
              }),
            ],
          }),

          // Kolom Kanan: Tanda Tangan Kepala Sekolah
          new TableCell({
            width: { size: 5000, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 20 },
                children: [
                  new TextRun({
                    text: `Karawang,    ${signMonth} ${signYear}`,
                    font: "Arial",
                    size: 15, // 7.5pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 420 },
                children: [
                  new TextRun({
                    text: "Kepala Sekolah SMPN 8 Karawang Barat",
                    font: "Arial",
                    size: 15, // 7.5pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20 },
                children: [
                  new TextRun({
                    text: kepalaSekolah?.nama || "H. Mamay Abdullah, S.Pd., M.Pd.",
                    font: "Arial",
                    bold: true,
                    size: 15, // 7.5pt
                    underline: {},
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `NIP. ${kepalaSekolah?.nip || "197007241998021003"}`,
                    font: "Arial",
                    size: 15, // 7.5pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Paragraf pemisah (Enter) antara tabel utama dan tabel ringkasan/tanda tangan
  const tableSpacer = new Paragraph({
    spacing: { before: 140, after: 80 },
    children: [
      new TextRun({
        text: "",
      }),
    ],
  });

  // 6. Bangun Dokumen A4 Portrait Standar (Lebar: 11906 DXA / 21cm, Tinggi: 16838 DXA / 29.7cm)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,  // A4 Portrait width
              height: 16838, // A4 Portrait height
            },
            margin: {
              top: 600,    // ~1.05 cm
              bottom: 600, // ~1.05 cm
              left: 700,   // ~1.23 cm
              right: 700,  // ~1.23 cm
            },
          },
        },
        children: [
          kopTable,
          kopDivider,
          judulParagraph,
          attendanceTable,
          tableSpacer,
          footerTable,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
