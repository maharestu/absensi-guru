import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface TeacherFormData {
  nama: string;
  nip: string;
  jabatan: string;
  no_telepon: string;
  status: "aktif" | "nonaktif";
}

interface TeacherFormProps {
  initialData: TeacherFormData;
  onSubmit: (data: TeacherFormData) => void;
  onCancel: () => void;
  submitting: boolean;
  submitText: string;
}

export default function TeacherForm({
  initialData,
  onSubmit,
  onCancel,
  submitting,
  submitText,
}: TeacherFormProps) {
  const [form, setForm] = React.useState<TeacherFormData>(initialData);

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
        {/* Nama */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Nama Lengkap
          </label>
          <Input
            type="text"
            placeholder="Contoh: Budi Santoso, M.Pd"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
        </div>

        {/* NIP */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            NIP (Nomor Induk Pegawai)
          </label>
          <Input
            type="text"
            placeholder="Masukkan NIP"
            value={form.nip}
            onChange={(e) => setForm({ ...form, nip: e.target.value })}
            required
          />
        </div>

        {/* Jabatan */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Jabatan / Posisi
          </label>
          <Input
            type="text"
            placeholder="Contoh: Wali Kelas 10A"
            value={form.jabatan}
            onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
          />
        </div>

        {/* No Telepon */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            No Telepon / WhatsApp
          </label>
          <Input
            type="text"
            placeholder="Contoh: 08123456789"
            value={form.no_telepon}
            onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
          />
        </div>

        {/* Status Aktif */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Status Keaktifan
          </label>
          <Select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "aktif" | "nonaktif",
              })
            }
            required
          >
            <option value="aktif">Aktif Mengajar</option>
            <option value="nonaktif">Nonaktif / Cuti</option>
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
