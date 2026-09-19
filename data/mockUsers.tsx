export type MockUser = {
  username: string;
  password: string;
  nama: string;
  role: "guru" | "admin";
};

export const mockUsers: MockUser[] = [
  {
    username: "1987654321",
    password: "Guru123!",
    nama: "Budi Santoso",
    role: "guru",
  },
  {
    username: "admin",
    password: "Admin123!",
    nama: "Administrator",
    role: "admin",
  },
];