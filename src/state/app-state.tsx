import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Antrian = {
  id: string;
  tanggal: string;
  sesi: string;
  bukti?: string;
};

export const ANTRIAN_SAAT_INI = 'Senin, 12 Oktober 2026, 09.00–09.30';
export const USER_EMAIL = 'pasien@email.com';

const antrianAwal: Antrian[] = [
  { id: 'a1', tanggal: '7 Oktober 2026', sesi: '15.00–15.30' },
  { id: 'a2', tanggal: '5 Oktober 2026', sesi: '10.00–10.30' },
  { id: 'a3', tanggal: '1 Oktober 2026', sesi: '09.00–09.30' },
];

type LoginResult = {
  error?: string;
  next?: 'ambil';
};

type AppState = {
  loggedIn: boolean;
  email: string;
  menuOpen: boolean;
  loginOpen: boolean;
  antrian: Antrian[];
  setMenuOpen: (open: boolean) => void;
  openLogin: (next?: 'ambil') => void;
  closeLogin: () => void;
  loginWithOtp: (otp: string) => LoginResult;
  logout: () => void;
  tambahAntrian: () => void;
  unggahBukti: (id: string, nama: string) => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [afterLogin, setAfterLogin] = useState<'ambil' | null>(null);
  const [antrian, setAntrian] = useState<Antrian[]>(antrianAwal);

  const value = useMemo<AppState>(
    () => ({
      loggedIn,
      email: USER_EMAIL,
      menuOpen,
      loginOpen,
      antrian,
      setMenuOpen,
      openLogin: (next) => {
        setAfterLogin(next ?? null);
        setMenuOpen(false);
        setLoginOpen(true);
      },
      closeLogin: () => {
        setAfterLogin(null);
        setLoginOpen(false);
      },
      loginWithOtp: (otp) => {
        if (!/^\d{5}$/.test(otp.trim())) {
          return { error: 'Masukkan OTP 5 digit.' };
        }
        const next = afterLogin ?? undefined;
        setLoggedIn(true);
        setLoginOpen(false);
        setAfterLogin(null);
        setMenuOpen(!next);
        return { next };
      },
      logout: () => {
        setLoggedIn(false);
        setMenuOpen(true);
      },
      tambahAntrian: () => {
        setAntrian((current) => [
          {
            id: `${Date.now()}`,
            tanggal: '12 Oktober 2026',
            sesi: '09.00–09.30',
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
    [afterLogin, antrian, loggedIn, loginOpen, menuOpen],
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
