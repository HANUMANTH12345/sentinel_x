import { createContext, useContext, useState, useCallback } from "react";

export interface ScannedNode {
  id: string;
  url: string;
  score: number;
  indicators: string[];
  chain: string[];
  hasSSL: boolean;
  timestamp: number;
}

interface UserScansContextValue {
  scans: ScannedNode[];
  addScan: (scan: Omit<ScannedNode, "id" | "timestamp">) => void;
  clearScans: () => void;
}

const UserScansContext = createContext<UserScansContextValue>({
  scans: [],
  addScan: () => {},
  clearScans: () => {},
});

export function UserScansProvider({ children }: { children: React.ReactNode }) {
  const [scans, setScans] = useState<ScannedNode[]>([]);

  const addScan = useCallback((scan: Omit<ScannedNode, "id" | "timestamp">) => {
    setScans((prev) => {
      const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newScan: ScannedNode = { ...scan, id, timestamp: Date.now() };
      return [newScan, ...prev].slice(0, 20);
    });
  }, []);

  const clearScans = useCallback(() => setScans([]), []);

  return (
    <UserScansContext.Provider value={{ scans, addScan, clearScans }}>
      {children}
    </UserScansContext.Provider>
  );
}

export function useUserScans() {
  return useContext(UserScansContext);
}
