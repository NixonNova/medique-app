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
  loginPhone: string | null;
  dummyPhone: string | null;
  antrian: Antrian[];
  setMenuOpen: (open: boolean) => void;
  openLogin: (phone?: string) => void;
  closeLogin: () => void;
  completeDummyLogin: (phone: string) => void;
  clearDummyLogin: () => void;
  tambahAntrian: (item?: { tanggal: string; sesi: string }) => void;
  unggahBukti: (id: string, nama: string) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState<string | null>(null);
  const [dummyPhone, setDummyPhone] = useState<string | null>(null);
  const [antrian, setAntrian] = useState<Antrian[]>(antrianAwal);

  const value = useMemo<AppState>(
    () => ({
      menuOpen,
      loginOpen,
      loginPhone,
      dummyPhone,
      antrian,
      setMenuOpen,
      openLogin: (phone?: string) => {
        const number = phone?.trim() ?? '';
        setMenuOpen(false);
        setLoginPhone(number ? number : null);
        setLoginOpen(true);
      },
      closeLogin: () => {
        setLoginOpen(false);
        setLoginPhone(null);
      },
      completeDummyLogin: (phone: string) => {
        setDummyPhone(phone);
        setLoginOpen(false);
        setLoginPhone(null);
      },
      clearDummyLogin: () => {
        setDummyPhone(null);
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
    [antrian, dummyPhone, loginPhone, loginOpen, menuOpen],
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
