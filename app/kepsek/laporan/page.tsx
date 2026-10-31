"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Clock, Calendar, Camera, Search, FileText, TrendingUp, Users, Award, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { getLaporanKehadiran, getLaporanMengajar, LaporanKehadiran, LaporanMengajar } from "@/actions/laporan";
import { getGuruList } from "@/actions/guru";
import { getKelasList } from "@/actions/kelas";
import { getJadwalList } from "@/actions/jadwal";
import { getHariLibur, getPengaturanSistem, HariLibur, PengaturanSistem } from "@/actions/pengaturan";
import { generateRekapAbsensiDocx, generateRekapSemuaGuruDocx, triggerDownload } from "@/lib/export-docx";
import { Guru, Kelas, JadwalWithDetail } from "@/types/schema";
import Pagination from "@/components/ui/pagination";
import { getStatusColorText } from "@/lib/status";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { LaporanDetailModal } from "@/components/kepsek/LaporanDetailModal";
import { PhotoOverlay } from "@/components/kepsek/PhotoOverlay";
import { ScrollingStatCards, StatCardItem } from "@/components/ui/ScrollingStatCards";
import FullScreenLoader from "@/components/ui/full-screen-loader";

export default function LaporanAbsensiPage() {

  const { timeString, dateString } = useRealtimeClock();
  const [activeTab, setActiveTab] = useState<"kehadiran" | "mengajar">("kehadiran");
  const [laporanKehadiran, setLaporanKehadiran] = useState<LaporanKehadiran[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [laporanMengajar, setLaporanMengajar] = useState<LaporanMengajar[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalWithDetail[]>([]);
  const [hariLiburList, setHariLiburList] = useState<HariLibur[]>([]);
  const [pengaturanSistem, setPengaturanSistem] = useState<PengaturanSistem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [exportingGuruId, setExportingGuruId] = useState<string | null>(null);
  const [isExportingAllDocx, setIsExportingAllDocx] = useState(false);

  const [detailModalGuruId, setDetailModalGuruId] = useState<string | null>(null);
  const [photoOverlayUrl, setPhotoOverlayUrl] = useState<string | null>(null);

  const [selectedGuru, setSelectedGuru] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeKehadiranCardId, setActiveKehadiranCardId] = useState<string>("avg-kehadiran");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");

  const [periodeType, setPeriodeType] = useState<string>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sync date based on periodType
  useEffect(() => {
    const today = new Date();
    if (periodeType === "today") {
      const d = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      setStartDate(d);
      setEndDate(d);
    } else if (periodeType === "last_7_days") {
      const dEnd = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dStart = start.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      setStartDate(dStart);
      setEndDate(dEnd);
    } else if (periodeType === "this_month") {
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
      const parts = formatter.formatToParts(today);
      const y = parts.find(p => p.type === 'year')?.value || String(today.getFullYear());
      const m = parts.find(p => p.type === 'month')?.value || String(today.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (periodeType === "last_month") {
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
      const parts = formatter.formatToParts(today);
      const currY = Number(parts.find(p => p.type === 'year')?.value || today.getFullYear());
      const currM = Number(parts.find(p => p.type === 'month')?.value || (today.getMonth() + 1));
      const lastMonthDate = new Date(currY, currM - 2, 1);
      const y = lastMonthDate.getFullYear();
      const m = String(lastMonthDate.getMonth() + 1).padStart(2, "0");
      setStartDate(`${y}-${m}-01`);
      const lastDay = new Date(y, Number(m), 0).getDate();
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    }
  }, [periodeType]);

  const [searchQuery, setSearchQuery] = useState("");

  // Helper rentang tanggal singkat untuk kolom periode
  const getPeriodeLabel = () => {
    if (!startDate || !endDate) return "-";
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${startDate} – ${endDate}`;
      const startDay = String(s.getDate()).padStart(2, "0");
      const endDay = String(e.getDate()).padStart(2, "0");
      const startMonth = s.toLocaleDateString("id-ID", { month: "short" });
      const endMonth = e.toLocaleDateString("id-ID", { month: "short" });
      const startYear = s.getFullYear();
      const endYear = e.getFullYear();

      if (startYear === endYear && startMonth === endMonth) {
        return `${startDay}–${endDay} ${endMonth} ${endYear}`;
      } else if (startYear === endYear) {
        return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
      } else {
        return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
      }
    } catch {
      return `${startDate} – ${endDate}`;
    }
  };

  const periodeLabel = getPeriodeLabel();

  // Filter hanya guru dengan status aktif (sesuai status aktif di Admin Kelola Guru & Dashboard Admin)
  const activeGuruList = useMemo(() => {
    return guruList.filter((g) => (g.status ?? "aktif").toLowerCase() === "aktif");
  }, [guruList]);

  // Rekapitulasi Kehadiran per Guru (1 baris mewakili 1 guru dalam periode aktif)
  const rekapKehadiranList = useMemo(() => {
    const mapGuru = new Map<string, { id: string; nama: string; nip: string }>();
    activeGuruList.forEach((g) => {
      mapGuru.set(g.id, { id: g.id, nama: g.nama, nip: g.nip });
    });
    laporanKehadiran.forEach((r) => {
      if (r.guru_id && !mapGuru.has(r.guru_id)) {
        const found = activeGuruList.find((ag) => ag.id === r.guru_id);
        if (found) {
          mapGuru.set(r.guru_id, { id: r.guru_id, nama: r.nama, nip: found.nip || "" });
        }
      }
    });

    const holidaySet = new Set<string>(
      hariLiburList.map((h) =>
        typeof h.tanggal === "string" ? h.tanggal.slice(0, 10) : ""
      )
    );
    const lp = pengaturanSistem;
    const isDateInLiburPanjang = (dateStr: string) => {
      if (!lp?.libur_panjang_aktif || !lp?.libur_panjang_mulai || !lp?.libur_panjang_selesai) return false;
      return dateStr >= lp.libur_panjang_mulai && dateStr <= lp.libur_panjang_selesai;
    };

    let totalHariKerjaPeriode = 0;
    if (startDate && endDate) {
      try {
        const todayWIB = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
        // Batasi hari kerja efektif sampai dengan hari ini untuk periode berjalan (Poin 3)
        const effectiveEndStr = endDate > todayWIB ? todayWIB : endDate;

        // Smart Auto-Detect: Cari tanggal presensi aktif perdana di sekolah pada periode ini
        const activeDates = laporanKehadiran
          .filter((r) => {
            const st = (r.status || "").toLowerCase();
            return st === "hadir" || st.includes("dinas") || st === "izin" || st === "sakit";
          })
          .map((r) => r.raw_tanggal)
          .filter((d): d is string => Boolean(d && /^\d{4}-\d{2}-\d{2}$/.test(d)))
          .sort();

        const earliestActiveDate = activeDates.length > 0 ? activeDates[0] : null;
        // Jika sistem baru mulai dipakai pertengahan bulan, tanggal awal hari kerja bergeser ke hari perdana sekolah aktif
        const effectiveStartStr = (earliestActiveDate && earliestActiveDate > startDate)
          ? earliestActiveDate
          : startDate;

        if (effectiveStartStr <= effectiveEndStr) {
          const [sY, sM, sD] = effectiveStartStr.split("-").map(Number);
          const [eY, eM, eD] = effectiveEndStr.split("-").map(Number);
          const cur = new Date(Date.UTC(sY, sM - 1, sD, 12, 0, 0));
          const end = new Date(Date.UTC(eY, eM - 1, eD, 12, 0, 0));

          while (cur <= end) {
            const y = cur.getUTCFullYear();
            const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
            const d = String(cur.getUTCDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`;
            const dayOfWeek = cur.getUTCDay();

            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              if (!holidaySet.has(dateStr) && !isDateInLiburPanjang(dateStr)) {
                totalHariKerjaPeriode++;
              }
            }
            cur.setUTCDate(cur.getUTCDate() + 1);
          }
        }
      } catch {
        // Abaikan jika parsing gagal
      }
    }

    return Array.from(mapGuru.values()).map((g) => {
      const records = laporanKehadiran.filter((r) => r.guru_id === g.id);
      const jumlahHadir = records.filter((r) => r.status.toLowerCase() === "hadir").length;
      const izin = records.filter((r) => r.status.toLowerCase() === "izin").length;
      const sakit = records.filter((r) => r.status.toLowerCase() === "sakit").length;
      const dinasLuar = records.filter((r) => r.status.toLowerCase().includes("dinas")).length;
      const tidakHadir = records.filter((r) => r.status.toLowerCase().includes("tidak")).length;
      const totalHariKerja = totalHariKerjaPeriode > 0 ? totalHariKerjaPeriode : records.length;
      // Dinas luar diakui sebagai kehadiran tugas resmi kedinasan (Poin 1)
      const totalHadirDanDinas = jumlahHadir + dinasLuar;
      const persentaseHadir = totalHariKerja > 0 ? Math.round((totalHadirDanDinas / totalHariKerja) * 100) : 0;

      return {
        guruId: g.id,
        nama: g.nama,
        nip: g.nip,
        periodeLabel,
        totalHariKerja,
        jumlahHadir,
        persentaseHadir,
        izin,
        sakit,
        dinasLuar,
        tidakHadir,
        totalHari: totalHariKerja,
      };
    });
  }, [activeGuruList, laporanKehadiran, periodeLabel, startDate, endDate, hariLiburList, pengaturanSistem]);

  // Filter Data Kehadiran per Guru untuk Tabel Utama
  const filteredGuruKehadiran = useMemo(() => {
    return rekapKehadiranList.filter((g) => {
      const matchGuru = selectedGuru === "all" || g.guruId === selectedGuru;
      let matchStatus = true;
      if (selectedStatus === "sempurna") {
        matchStatus = g.persentaseHadir === 100;
      } else if (selectedStatus === "rendah") {
        matchStatus = g.persentaseHadir < 80;
      } else if (selectedStatus === "alpha") {
        matchStatus = g.tidakHadir > 0;
      } else if (selectedStatus === "binaan") {
        matchStatus = g.persentaseHadir < 80 || g.tidakHadir > 0;
      } else if (selectedStatus !== "all") {
        matchStatus =
          (selectedStatus === "hadir" && g.jumlahHadir > 0) ||
          (selectedStatus === "izin" && g.izin > 0) ||
          (selectedStatus === "sakit" && g.sakit > 0) ||
          (selectedStatus === "dinas" && g.dinasLuar > 0) ||
          (selectedStatus.includes("tidak") && g.tidakHadir > 0);
      }
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        query === "" ||
        g.nama.toLowerCase().includes(query) ||
        g.nip.toLowerCase().includes(query);

      return matchGuru && matchStatus && matchSearch;
    });
  }, [rekapKehadiranList, selectedGuru, selectedStatus, searchQuery]);

  // Filter Data Mengajar (TETAP — TIDAK DIUBAH)
  const filteredMengajar = laporanMengajar.filter(r => {
    const matchGuru = selectedGuru === "all" || r.guru_id === selectedGuru;
    const matchKelas = selectedKelas === "all" || r.kelas_id === selectedKelas;
    const matchStatus = selectedStatus === "all" ||
      (selectedStatus === "tidak_mengajar"
        ? r.status.toLowerCase().includes("tidak")
        : r.status.toLowerCase() === selectedStatus.toLowerCase());
    const matchSearch = searchQuery === "" ||
      r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mata_pelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGuru && matchKelas && matchStatus && matchSearch;
  });

  // Rekapitulasi Mengajar per Guru (1 baris mewakili 1 guru dalam periode aktif)
  const rekapMengajarList = useMemo(() => {
    const mapGuru = new Map<string, { id: string; nama: string; nip: string }>();
    activeGuruList.forEach((g) => {
      mapGuru.set(g.id, { id: g.id, nama: g.nama, nip: g.nip });
    });
    laporanMengajar.forEach((r) => {
      if (r.guru_id && !mapGuru.has(r.guru_id)) {
        const found = activeGuruList.find((ag) => ag.id === r.guru_id);
        if (found) {
          mapGuru.set(r.guru_id, { id: r.guru_id, nama: r.nama, nip: found.nip || "" });
        }
      }
    });

    const holidaySet = new Set<string>(
      hariLiburList.map((h) =>
        typeof h.tanggal === "string" ? h.tanggal.slice(0, 10) : ""
      )
    );
    const lp = pengaturanSistem;
    const isDateInLiburPanjang = (dateStr: string) => {
      if (!lp?.libur_panjang_aktif || !lp?.libur_panjang_mulai || !lp?.libur_panjang_selesai) return false;
      return dateStr >= lp.libur_panjang_mulai && dateStr <= lp.libur_panjang_selesai;
    };
    const dayNames = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

    // Kumpulkan tanggal-tanggal hari sekolah aktif dalam periode
    const schoolDays: { dateStr: string; dayName: string }[] = [];
    if (startDate && endDate) {
      try {
        const todayWIB = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
        const effectiveEndStr = endDate > todayWIB ? todayWIB : endDate;

        const activeMengajarDates = laporanMengajar
          .filter((r) => r.status.toLowerCase() === "mengajar" || r.status.toLowerCase().includes("tidak"))
          .map((r) => r.raw_tanggal)
          .filter((d): d is string => Boolean(d && /^\d{4}-\d{2}-\d{2}$/.test(d)))
          .sort();
        const earliestMengajar = activeMengajarDates.length > 0 ? activeMengajarDates[0] : null;
        const effectiveStartStr = (earliestMengajar && earliestMengajar > startDate)
          ? earliestMengajar
          : startDate;

        if (effectiveStartStr <= effectiveEndStr) {
          const [sY, sM, sD] = effectiveStartStr.split("-").map(Number);
          const [eY, eM, eD] = effectiveEndStr.split("-").map(Number);
          const cur = new Date(Date.UTC(sY, sM - 1, sD, 12, 0, 0));
          const end = new Date(Date.UTC(eY, eM - 1, eD, 12, 0, 0));

          while (cur <= end) {
            const y = cur.getUTCFullYear();
            const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
            const d = String(cur.getUTCDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`;
            const dayName = dayNames[cur.getUTCDay()];

            if (dayName !== "sabtu" && dayName !== "minggu") {
              if (!holidaySet.has(dateStr) && !isDateInLiburPanjang(dateStr)) {
                schoolDays.push({ dateStr, dayName });
              }
            }
            cur.setUTCDate(cur.getUTCDate() + 1);
          }
        }
      } catch {
        // Abaikan jika parsing gagal
      }
    }

    return Array.from(mapGuru.values()).map((g) => {
      const records = laporanMengajar.filter((r) => r.guru_id === g.id);
      const jumlahMengajar = records.filter((r) => r.status.toLowerCase() === "mengajar").length;
      const tidakMengajar = records.filter(
        (r) => r.status.toLowerCase().includes("tidak") || r.status === "—" || r.status === "-"
      ).length;

      // Hitung total jadwal riil guru ini di periode yang ditentukan
      const teacherJadwal = jadwalList.filter(
        (j) => j.guru_id === g.id && (j.status === "aktif" || !j.status)
      );

      let totalJadwal = 0;
      if (teacherJadwal.length > 0 && schoolDays.length > 0) {
        const todayWIB = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
        const nowJamWIB = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());

        schoolDays.forEach(({ dateStr, dayName }) => {
          const schedulesOnDay = teacherJadwal.filter(
            (j) => (j.hari || "").toLowerCase().trim() === dayName
          );

          if (dateStr < todayWIB) {
            // Hari yang sudah lewat: seluruh jadwal pada hari tersebut telah jatuh tempo
            totalJadwal += schedulesOnDay.length;
          } else if (dateStr === todayWIB) {
            // Hari ini: hanya hitung jadwal yang jam selesainya sudah berlalu atau sudah diabsen
            schedulesOnDay.forEach((j) => {
              const jamSelesai = String(j.jam_selesai || "16:00:00").slice(0, 8);
              const sudahDiabsen = records.some((r) => r.raw_tanggal === todayWIB && r.waktu?.includes(j.jam_mulai?.slice(0, 5)));
              if (nowJamWIB >= jamSelesai || sudahDiabsen) {
                totalJadwal += 1;
              }
            });
          }
        });
      } else {
        totalJadwal = records.length;
      }

      // Pastikan totalJadwal minimal sama dengan total sesi yang tercatat
      totalJadwal = Math.max(totalJadwal, records.length);
      const basisTotal = totalJadwal > 0 ? totalJadwal : (records.length > 0 ? records.length : 0);
      const persentaseMengajar = basisTotal > 0 ? Math.round((jumlahMengajar / basisTotal) * 100) : 0;

      const kelasIds = Array.from(
        new Set([
          ...records.map((r) => r.kelas_id),
          ...teacherJadwal.map((j) => j.kelas_id),
        ].filter(Boolean))
      );

      return {
        guruId: g.id,
        nama: g.nama,
        nip: g.nip,
        periodeLabel,
        kelasIds,
        totalJadwal,
        jumlahMengajar,
        tidakMengajar,
        totalSesi: totalJadwal,
        persentaseMengajar,
      };
    });
  }, [activeGuruList, laporanMengajar, jadwalList, hariLiburList, pengaturanSistem, startDate, endDate, periodeLabel]);

  // Filter Data Mengajar per Guru untuk Tabel Utama
  const filteredGuruMengajar = useMemo(() => {
    return rekapMengajarList.filter((g) => {
      const matchGuru = selectedGuru === "all" || g.guruId === selectedGuru;
      const matchKelas = selectedKelas === "all" || g.kelasIds.includes(selectedKelas);
      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "mengajar" && g.jumlahMengajar > 0) ||
        (selectedStatus === "tidak_mengajar" && g.tidakMengajar > 0);
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        query === "" ||
        g.nama.toLowerCase().includes(query) ||
        g.nip.toLowerCase().includes(query);

      return matchGuru && matchKelas && matchStatus && matchSearch;
    });
  }, [rekapMengajarList, selectedGuru, selectedKelas, selectedStatus, searchQuery]);

  const [currentPageKehadiran, setCurrentPageKehadiran] = useState(1);
  const [currentPageMengajar, setCurrentPageMengajar] = useState(1);
  const itemsPerPage = 11;

  const paginatedGuruKehadiran = filteredGuruKehadiran.slice(
    (currentPageKehadiran - 1) * itemsPerPage,
    currentPageKehadiran * itemsPerPage
  );

  const paginatedGuruMengajar = filteredGuruMengajar.slice(
    (currentPageMengajar - 1) * itemsPerPage,
    currentPageMengajar * itemsPerPage
  );

  // Reset pagination if search changes
  useEffect(() => {
    setCurrentPageKehadiran(1);
    setCurrentPageMengajar(1);
  }, [searchQuery]);

  // Hitung statistik Kehadiran berbasis ringkasan guru (Executive Metrics)
  const baseGuruKehadiran = useMemo(() => {
    return rekapKehadiranList.filter((g) => selectedGuru === "all" || g.guruId === selectedGuru);
  }, [rekapKehadiranList, selectedGuru]);

  const totalGuruAktif = selectedGuru === "all" ? activeGuruList.length : baseGuruKehadiran.length;
  const avgNum = totalGuruAktif > 0
    ? baseGuruKehadiran.reduce((sum, g) => sum + g.persentaseHadir, 0) / totalGuruAktif
    : 0;
  const avgKehadiran = totalGuruAktif > 0
    ? (avgNum % 1 === 0 ? `${avgNum}%` : `${avgNum.toFixed(1)}%`)
    : "0%";
  const countSempurna = baseGuruKehadiran.filter((g) => g.persentaseHadir === 100).length;
  const countPerluBinaan = baseGuruKehadiran.filter((g) => g.persentaseHadir < 80 || g.tidakHadir > 0).length;

  const statCardsKehadiran: StatCardItem[] = [
    {
      id: "avg-kehadiran",
      label: "Rata-rata Kehadiran",
      value: avgKehadiran,
      bgIcon: "bg-indigo-600",
      shadowIcon: "shadow-indigo-500/20",
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />,
      onClick: () => {
        setActiveKehadiranCardId("avg-kehadiran");
        handleStatusChange("all");
      },
      active: activeKehadiranCardId === "avg-kehadiran" && selectedStatus === "all",
    },
    {
      id: "total-guru",
      label: "Total Guru Aktif",
      value: `${totalGuruAktif} Guru`,
      bgIcon: "bg-slate-700",
      shadowIcon: "shadow-slate-500/20",
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />,
      onClick: () => {
        setActiveKehadiranCardId("total-guru");
        handleStatusChange("all");
      },
      active: activeKehadiranCardId === "total-guru" && selectedStatus === "all",
    },
    {
      id: "kehadiran-sempurna",
      label: "Kehadiran Sempurna (100%)",
      value: `${countSempurna} Guru`,
      bgIcon: "bg-emerald-500",
      shadowIcon: "shadow-emerald-500/20",
      icon: <Award className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />,
      onClick: () => {
        if (selectedStatus === "sempurna") {
          setActiveKehadiranCardId("avg-kehadiran");
          handleStatusChange("all");
        } else {
          setActiveKehadiranCardId("kehadiran-sempurna");
          handleStatusChange("sempurna");
        }
      },
      active: selectedStatus === "sempurna",
    },
    {
      id: "perlu-pembinaan",
      label: "Kehadiran < 80%",
      value: `${countPerluBinaan} Guru`,
      bgIcon: "bg-rose-500",
      shadowIcon: "shadow-rose-500/20",
      icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />,
      onClick: () => {
        if (selectedStatus === "binaan") {
          setActiveKehadiranCardId("avg-kehadiran");
          handleStatusChange("all");
        } else {
          setActiveKehadiranCardId("perlu-pembinaan");
          handleStatusChange("binaan");
        }
      },
      active: selectedStatus === "binaan",
    },
  ];

  // Hitung jumlah statistik Mengajar secara dinamis
  const countMengajar = filteredMengajar.filter((r) => r.status.toLowerCase() === "mengajar").length;
  const countTidakMengajar = filteredMengajar.filter((r) => r.status.toLowerCase().includes("tidak")).length;
  const countJadwal = filteredGuruMengajar.reduce((acc, curr) => acc + curr.totalJadwal, 0);

  // Hitung rata-rata persentase mengajar eksekutif
  const gurusWithJadwal = filteredGuruMengajar.filter((g) => g.totalJadwal > 0);
  const avgMengajarNum = gurusWithJadwal.length > 0
    ? gurusWithJadwal.reduce((sum, g) => sum + g.persentaseMengajar, 0) / gurusWithJadwal.length
    : (countJadwal > 0 ? Math.round((countMengajar / countJadwal) * 100) : 0);
  const avgMengajar = countJadwal === 0 && countMengajar === 0
    ? "0%"
    : (avgMengajarNum % 1 === 0 ? `${avgMengajarNum}%` : `${avgMengajarNum.toFixed(1)}%`);

  useEffect(() => {
    async function loadData() {
      if (!startDate || !endDate) return;
      setLoading(true);
      try {
        const [kehadiran, mengajar, gurus, kelasArr, liburArr, config, jadwals] = await Promise.all([
          getLaporanKehadiran(startDate, endDate),
          getLaporanMengajar(startDate, endDate),
          getGuruList(),
          getKelasList(),
          getHariLibur(),
          getPengaturanSistem(),
          getJadwalList(),
        ]);
        setLaporanKehadiran(kehadiran);
        setLaporanMengajar(mengajar);
        setGuruList(gurus);
        setKelasList(kelasArr);
        setHariLiburList(liburArr);
        setPengaturanSistem(config);
        setJadwalList(jadwals);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [startDate, endDate]);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formatted = d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "long", year: "numeric" });
      return formatted.replace(/ /g, "-");
    } catch {
      return dateStr;
    }
  };

  const handleTampilkan = async () => {
    // Tombol dipertahankan untuk manual refresh
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const [kehadiran, mengajar, liburArr, config] = await Promise.all([
        getLaporanKehadiran(startDate, endDate),
        getLaporanMengajar(startDate, endDate),
        getHariLibur(),
        getPengaturanSistem(),
      ]);
      setLaporanKehadiran(kehadiran);
      setLaporanMengajar(mengajar);
      setHariLiburList(liburArr);
      setPengaturanSistem(config);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "kehadiran" | "mengajar") => {
    setFilterLoading(true);
    setActiveTab(tab);
    setSearchQuery(""); // Reset search when switching tabs
    setSelectedStatus("all"); // Reset status when switching tabs
    setActiveKehadiranCardId("avg-kehadiran");
    setTimeout(() => setFilterLoading(false), 200);
  };

  const handleStatusChange = (val: string) => {
    setFilterLoading(true);
    setSelectedStatus(val);
    if (val === "sempurna") {
      setActiveKehadiranCardId("kehadiran-sempurna");
    } else if (val === "binaan") {
      setActiveKehadiranCardId("perlu-pembinaan");
    } else if (val === "all") {
      setActiveKehadiranCardId((prev) => (prev === "total-guru" ? "total-guru" : "avg-kehadiran"));
    } else {
      setActiveKehadiranCardId("");
    }
    setTimeout(() => setFilterLoading(false), 200);
  };

  const handleGuruChange = (val: string) => {
    setFilterLoading(true);
    setSelectedGuru(val);
    setTimeout(() => setFilterLoading(false), 200);
  };

  const handleKelasChange = (val: string) => {
    setFilterLoading(true);
    setSelectedKelas(val);
    setTimeout(() => setFilterLoading(false), 200);
  };

  const handlePeriodeTypeChange = (val: string) => {
    setFilterLoading(true);
    setPeriodeType(val);
    setTimeout(() => setFilterLoading(false), 200);
  };

  const handleExportDocxPerGuru = async (rekap: {
    guruId: string;
    nama: string;
    nip: string;
  }) => {
    try {
      setExportingGuruId(rekap.guruId);
      const teacherRecords = laporanKehadiran
        .filter((r) => r.guru_id === rekap.guruId)
        .map((r) => ({
          tanggal: r.raw_tanggal || r.tanggal,
          raw_tanggal: r.raw_tanggal,
          waktu_masuk: r.waktu_masuk,
          waktu_pulang: r.waktu_pulang,
          status: r.status,
        }));
      const kepsekGuru = guruList.find(
        (g) => g.linked_role === "kepala_sekolah" || (g.jabatan && g.jabatan.toLowerCase().includes("kepala sekolah"))
      );

      const blob = await generateRekapAbsensiDocx({
        guru: {
          id: rekap.guruId,
          nama: rekap.nama,
          nip: rekap.nip,
        },
        startDate,
        endDate,
        records: teacherRecords,
        hariLiburList,
        liburPanjang: {
          aktif: pengaturanSistem?.libur_panjang_aktif,
          mulai: pengaturanSistem?.libur_panjang_mulai,
          selesai: pengaturanSistem?.libur_panjang_selesai,
        },
        kepalaSekolah: kepsekGuru
          ? { nama: kepsekGuru.nama, nip: kepsekGuru.nip }
          : undefined,
      });

      const cleanName = rekap.nama.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Rekap_Kehadiran_${cleanName}_${startDate}_sd_${endDate}.docx`;
      triggerDownload(blob, filename);
    } catch (err) {
      console.error("Gagal export docx guru:", err);
      alert("Terjadi kesalahan saat mengekspor dokumen Word.");
    } finally {
      setExportingGuruId(null);
    }
  };

  const handleExport = async () => {
    const isKehadiran = activeTab === "kehadiran";

    if (isKehadiran) {
      if (filteredGuruKehadiran.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
      }
      try {
        setIsExportingAllDocx(true);
        const kepsekGuru = guruList.find(
          (g) => g.linked_role === "kepala_sekolah" || (g.jabatan && g.jabatan.toLowerCase().includes("kepala sekolah"))
        );
        const blob = await generateRekapSemuaGuruDocx({
          startDate,
          endDate,
          rows: filteredGuruKehadiran.map((row) => ({
            nama: row.nama,
            nip: row.nip || "-",
            totalHariKerja: row.totalHariKerja,
            persentaseHadir: row.persentaseHadir,
            jumlahHadir: row.jumlahHadir,
            izin: row.izin,
            sakit: row.sakit,
            dinasLuar: row.dinasLuar,
            tidakHadir: row.tidakHadir,
          })),
          statistik: {
            avgKehadiran,
            totalGuru: totalGuruAktif,
          },
          kepalaSekolah: kepsekGuru ? { nama: kepsekGuru.nama, nip: kepsekGuru.nip } : undefined,
        });

        const fileName = `Laporan_Kehadiran_Guru_${startDate}_sampai_${endDate}.docx`;
        triggerDownload(blob, fileName);
      } catch (err) {
        console.error("Gagal export docx keseluruhan guru:", err);
        alert("Terjadi kesalahan saat mengekspor dokumen Word.");
      } finally {
        setIsExportingAllDocx(false);
      }
      return;
    }

    if (filteredMengajar.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const exportData = filteredMengajar.map((row) => ({
      "Tanggal": row.tanggal,
      "Nama Guru": row.nama,
      "Kelas": row.kelas,
      "Mata Pelajaran": row.mata_pelajaran,
      "Waktu": row.waktu,
      "Status": row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // -- STYLING EXCEL (TAB MENGAJAR) --
    const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:A1");

    // Header styling (Baris 0)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: "FDE047" } // Warna kuning (Tailwind yellow-300)
        },
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        }
      };
    }

    // Body styling (Baris 1 ke bawah)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
          }
        };
      }
    }

    // Set Column Widths (Wch = Width in Characters)
    worksheet['!cols'] = [{ wch: 18 }, { wch: 35 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

    const fileName = `Laporan_Mengajar_${startDate}_sampai_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading && guruList.length === 0) {
    return <FullScreenLoader message="Memuat data laporan absensi..." bgClass="bg-[#f8fafc]" />;
  }

  const pageTitle =
    activeTab === "kehadiran"
      ? "Laporan Absensi Kehadiran"
      : "Laporan Absensi Mengajar";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-normal">
            Rekap periode {formatDateLabel(startDate)} hingga {formatDateLabel(endDate)}
          </p>
        </div>

        {/* Top Badges */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Clock className="w-[18px] h-[18px] text-slate-800" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-800">{timeString}</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Calendar className="w-[18px] h-[18px] text-slate-800" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-800">{dateString}</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="inline-flex bg-white rounded-xl border border-slate-200/70 p-1">
        <button
          onClick={() => handleTabChange("kehadiran")}
          className={`px-8 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "kehadiran"
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Kehadiran
        </button>
        <button
          onClick={() => handleTabChange("mengajar")}
          className={`px-8 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "mengajar"
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Mengajar
        </button>
      </div>

      {/* ── FILTER SECTION ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-2 md:flex md:flex-row md:items-end gap-3 sm:gap-4">

          <div className="col-span-1 md:col-span-1 flex-1 space-y-2">
            <label className="text-[11px] font-bold text-slate-900 tracking-wider">Periode</label>
            <div className="relative">
              <select
                value={periodeType}
                onChange={(e) => handlePeriodeTypeChange(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="this_month">Bulan Ini</option>
                <option value="last_month">Bulan Lalu</option>
                <option value="today">Hari Ini</option>
                <option value="last_7_days">7 Hari Terakhir</option>
                <option value="custom">Kustom</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            {periodeType === "custom" && (
              <div className="flex flex-col xl:flex-row xl:items-center gap-2 mt-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="hidden xl:inline text-slate-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-1 flex-1 space-y-2">
            <label className="text-[11px] font-bold text-slate-900 tracking-wider">Guru</label>
            <SearchableSelect
              placeholder="Semua Guru"
              value={selectedGuru}
              onChange={handleGuruChange}
              options={[
                { value: "all", label: "Semua Guru" },
                ...activeGuruList.map(g => ({ value: g.id, label: g.nama }))
              ]}
            />
          </div>

          {activeTab === "kehadiran" ? (
            // Filter untuk Kehadiran
            <div className="col-span-2 md:col-span-1 flex-1 space-y-2">
              <label className="text-[11px] font-bold text-slate-900 tracking-wider">Kedisiplinan</label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">Semua Guru</option>
                  <option value="sempurna">Kehadiran Sempurna (100%)</option>
                  <option value="binaan">Kehadiran &lt; 80%</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            // Filter untuk Mengajar (Kelas & Mata Pelajaran)
            <>
              <div className="col-span-1 flex-1 space-y-2">
                <label className="text-[11px] font-bold text-slate-900 tracking-wider">Kelas</label>
                <SearchableSelect
                  placeholder="Semua Kelas"
                  value={selectedKelas}
                  onChange={handleKelasChange}
                  options={[
                    { value: "all", label: "Semua Kelas" },
                    ...kelasList.map(k => ({ value: k.id, label: k.nama_kelas }))
                  ]}
                />
              </div>
              <div className="col-span-1 flex-1 space-y-2">
                <label className="text-[11px] font-bold text-slate-900 tracking-wider">Status</label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="mengajar">Mengajar</option>
                    <option value="tidak_mengajar">Tidak Mengajar</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                      <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="col-span-2 mt-2 md:mt-0 flex-shrink-0">
            <button
              type="button"
              onClick={handleTampilkan}
              className="w-full md:w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              Tampilkan
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {activeTab === "mengajar" ? (
        // Result State (Mengajar)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/20">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Rata-rata Mengajar</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                  {loading || filterLoading ? "..." : avgMengajar}
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="4" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Jadwal</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                  {loading || filterLoading ? "..." : countJadwal}
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Mengajar</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                  {loading || filterLoading ? "..." : countMengajar}
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-rose-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Tidak Mengajar</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                  {loading || filterLoading ? "..." : countTidakMengajar}
                </h2>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rincian Laporan</h2>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari nama atau NIP guru..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full sm:w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                >
                  Ekspor
                </button>
              </div>
            </div>

            <div className="relative bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6 shadow-sm overflow-hidden min-h-[300px]">
              {(loading || filterLoading) && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-150">
                  <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="mt-3 text-xs font-semibold text-slate-500 animate-pulse">
                    Memuat data absensi...
                  </p>
                </div>
              )}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px] sm:min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[16%]">TANGGAL</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[26%]">NAMA GURU</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[12%] text-center">TOTAL JADWAL</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[12%] text-center">JUMLAH MENGAJAR</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[14%] text-center">PERSENTASE MENGAJAR</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[12%] text-center">TIDAK MENGAJAR</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[8%] text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredGuruMengajar.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada data guru yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedGuruMengajar.map((row) => (
                      <tr key={row.guruId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 sm:py-4 font-semibold text-slate-800 text-xs sm:text-sm">
                          {row.periodeLabel}
                        </td>
                        <td className="py-2.5 sm:py-4">
                          <div className="font-semibold text-slate-900">{row.nama}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {row.nip ? `NIP/NUPTK: ${row.nip}` : "—"}
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-bold text-slate-700 text-sm sm:text-base">
                          {row.totalJadwal}
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-bold text-blue-600 text-sm sm:text-base">
                          {row.jumlahMengajar}
                        </td>
                        <td className="py-2.5 sm:py-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="font-bold text-slate-700 text-xs">{row.persentaseMengajar}%</span>
                            <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${row.persentaseMengajar}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-semibold text-rose-600 text-sm sm:text-base">
                          {row.tidakMengajar}
                        </td>
                        <td className="py-2.5 sm:py-4 text-center">
                          <button
                            onClick={() => setDetailModalGuruId(row.guruId)}
                            className="border border-slate-300 rounded-lg px-2.5 sm:px-4 py-1 text-xs sm:text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
              {filteredGuruMengajar.length > 0 && (
                <Pagination
                  currentPage={currentPageMengajar}
                  totalItems={filteredGuruMengajar.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPageMengajar}
                />
              )}
            </div>
          </div>

        </div>
      ) : (
        // Result State (Kehadiran)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards Kehadiran */}
          <ScrollingStatCards
            items={statCardsKehadiran}
            loading={loading || filterLoading}
            desktopGridCols="lg:grid-cols-4"
          />

          {/* Table Section Kehadiran */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rincian Laporan</h2>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari guru atau status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExportingAllDocx}
                  className="w-full sm:w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isExportingAllDocx ? "Mengekspor..." : "Ekspor"}
                </button>
              </div>
            </div>

            <div className="relative bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6 shadow-sm overflow-hidden min-h-[300px]">
              {(loading || filterLoading) && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-150">
                  <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="mt-3 text-xs font-semibold text-slate-500 animate-pulse">
                    Memuat data absensi...
                  </p>
                </div>
              )}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[15%]">TANGGAL PERIODE</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[21%]">NAMA GURU</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[10%] text-center">TOTAL HARI KERJA</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[12%] text-center">PERSENTASE HADIR</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[9%] text-center">JUMLAH HADIR</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[6%] text-center">IZIN</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[6%] text-center">SAKIT</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[7%] text-center">DINAS LUAR</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[7%] text-center">TIDAK HADIR</th>
                    <th className="pb-2.5 sm:pb-4 font-semibold w-[7%] text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredGuruKehadiran.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Tidak ada data guru yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedGuruKehadiran.map((row) => (
                      <tr key={row.guruId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 sm:py-4 font-semibold text-slate-800 text-xs sm:text-sm">
                          {row.periodeLabel}
                        </td>
                        <td className="py-2.5 sm:py-4">
                          <div className="font-semibold text-slate-900">{row.nama}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {row.nip ? `NIP/NUPTK: ${row.nip}` : "—"}
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-bold text-slate-800 text-sm sm:text-base">
                          {row.totalHariKerja}
                        </td>
                        <td className="py-2.5 sm:py-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="font-bold text-slate-700 text-xs">{row.persentaseHadir}%</span>
                            <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${row.persentaseHadir}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-bold text-blue-600 text-sm sm:text-base">
                          {row.jumlahHadir}
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-semibold text-orange-600">
                          {row.izin}
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-semibold text-rose-600">
                          {row.sakit}
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-semibold text-teal-600">
                          {row.dinasLuar}
                        </td>
                        <td className="py-2.5 sm:py-4 text-center font-semibold text-purple-600">
                          {row.tidakHadir}
                        </td>
                        <td className="py-2.5 sm:py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailModalGuruId(row.guruId)}
                              className="border border-slate-300 rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                            >
                              Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportDocxPerGuru(row)}
                              disabled={exportingGuruId === row.guruId}
                              className="inline-flex items-center gap-1 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-colors active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                              title="Ekspor Rekapitulasi (DOCX)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">
                                {exportingGuruId === row.guruId ? "..." : "Export"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
              {filteredGuruKehadiran.length > 0 && (
                <Pagination
                  currentPage={currentPageKehadiran}
                  totalItems={filteredGuruKehadiran.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPageKehadiran}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModalGuruId && (
        <LaporanDetailModal
          type={activeTab}
          detailModalGuruId={detailModalGuruId}
          guruList={guruList}
          laporanKehadiran={laporanKehadiran}
          laporanMengajar={laporanMengajar}
          startDate={startDate}
          endDate={endDate}
          totalJadwalGuru={rekapMengajarList.find((r) => r.guruId === detailModalGuruId)?.totalJadwal}
          totalHariKerjaGuru={rekapKehadiranList.find((r) => r.guruId === detailModalGuruId)?.totalHariKerja}
          persentaseHadirGuru={rekapKehadiranList.find((r) => r.guruId === detailModalGuruId)?.persentaseHadir}
          onClose={() => setDetailModalGuruId(null)}
          formatDateLabel={formatDateLabel}
          onPreviewPhoto={(url) => setPhotoOverlayUrl(url)}
        />
      )}

      {/* ── PHOTO OVERLAY ── */}
      <PhotoOverlay
        photoUrl={photoOverlayUrl}
        onClose={() => setPhotoOverlayUrl(null)}
      />

    </div>
  );
}
