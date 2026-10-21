import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Antrian = {
  id: string;
  tanggal: string;
  sesi: string;
  bukti?: string;
};

const antrianAwal: Antrian[] = [
  { id: 'a1', tanggal: '7 Oktober 2026', sesi: '15.00–15.30' },
  { id: 'a2', tanggal: '5 Oktober 2026', sesi: '10.00–10.30' },
  { id: 'a3', tanggal: '1 Oktober 2026', sesi: '09.00–09.30' },
];

type AppState = {
  menuOpen: boolean;
  loginOpen: boolean;
  antrian: Antrian[];
  setMenuOpen: (open: boolean) => void;
  openLogin: () => void;
  closeLogin: () => void;
  tambahAntrian: (item?: { tanggal: string; sesi: string }) => void;
  unggahBukti: (id: string, nama: string) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [antrian, setAntrian] = useState<Antrian[]>(antrianAwal);

  const value = useMemo<AppState>(
    () => ({
      menuOpen,
      loginOpen,
      antrian,
      setMenuOpen,
      openLogin: () => {
        setMenuOpen(false);
        setLoginOpen(true);
      },
      closeLogin: () => {
        setLoginOpen(false);
      },
      tambahAntrian: (item) => {
        setAntrian((current) => [
          {
            id: `${Date.now()}`,
            tanggal: item?.tanggal ?? '12 Oktober 2026',
            sesi: item?.sesi ?? '09.00–09.30',
          },
          ...current,
        ]);
      },
      unggahBukti: (id, nama) => {
        setAntrian((current) =>
          current.map((item) => (item.id === id ? { ...item, bukti: nama } : item)),
        );
      },
    }),
    [antrian, loginOpen, menuOpen],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return value;
}
