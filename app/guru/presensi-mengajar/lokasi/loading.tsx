import FullScreenLoader from "@/components/ui/full-screen-loader";

export default function LokasiMengajarLoading() {
  return (
    <FullScreenLoader
      message="Menyiapkan data ruang kelas..."
      bgClass="bg-[#EEF2F7]"
    />
  );
}
