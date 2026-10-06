import React from "react";
import { HariJadwal, Kelas, Guru } from "@/types/schema";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface ScheduleFormData {
  hari: HariJadwal;
  kelas_id: string;
  guru_id: string;
  jam_mulai: string;
  jam_selesai: string;
  mata_pelajaran: string;
}

interface ScheduleFormProps {
  initialData: ScheduleFormData;
  kelasList: Kelas[];
  guruList: Guru[];
  onSubmit: (data: ScheduleFormData) => void;
  onCancel: () => void;
  submitting: boolean;
  submitText: string;
}

const HARI_OPTIONS: { value: HariJadwal; label: string }[] = [
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
];

export default function ScheduleForm({
  initialData,
  kelasList,
  guruList,
  onSubmit,
  onCancel,
  submitting,
  submitText,
}: ScheduleFormProps) {
  const [form, setForm] = React.useState<ScheduleFormData>(initialData);

  // Perbarui state jika initialData berubah (misal ganti mode dari Create ke Edit)
  React.useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hari */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Hari
          </label>
          <Select
            value={form.hari}
            onChange={(e) =>
              setForm({ ...form, hari: e.target.value as HariJadwal })
            }
            required
          >
            {HARI_OPTIONS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Kelas */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Kelas
          </label>
          <Select
            value={form.kelas_id}
            onChange={(e) => setForm({ ...form, kelas_id: e.target.value })}
            required
          >
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </Select>
        </div>

        {/* Jam Mulai */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Jam Mulai (HH:MM)
          </label>
          <Input
            type="time"
            placeholder="07:00"
            value={form.jam_mulai}
            onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })}
            required
          />
        </div>

        {/* Jam Selesai */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Jam Selesai (HH:MM)
          </label>
          <Input
            type="time"
            placeholder="08:30"
            value={form.jam_selesai}
            onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
            required
          />
        </div>

        {/* Mata Pelajaran */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Mata Pelajaran
          </label>
          <Input
            type="text"
            placeholder="Contoh: Matematika"
            value={form.mata_pelajaran}
            onChange={(e) =>
              setForm({ ...form, mata_pelajaran: e.target.value })
            }
            required
          />
        </div>

        {/* Guru */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Guru Pengajar
          </label>
          <Select
            value={form.guru_id}
            onChange={(e) => setForm({ ...form, guru_id: e.target.value })}
            required
          >
            {guruList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nama}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          fullWidth={false}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
          fullWidth={false}
        >
          {submitting ? "Menyimpan..." : submitText}
        </Button>
      </div>
    </form>
  );
}
