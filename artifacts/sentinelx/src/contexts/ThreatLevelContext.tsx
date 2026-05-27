import { createContext, useContext, useState } from "react";

interface ThreatLevelContextValue {
  threatLevel: number;
  setThreatLevel: (level: number) => void;
}

const ThreatLevelContext = createContext<ThreatLevelContextValue>({
  threatLevel: 0,
  setThreatLevel: () => {},
});

export function ThreatLevelProvider({ children }: { children: React.ReactNode }) {
  const [threatLevel, setThreatLevel] = useState(0);
  return (
    <ThreatLevelContext.Provider value={{ threatLevel, setThreatLevel }}>
      {children}
    </ThreatLevelContext.Provider>
  );
}

export function useThreatLevel() {
  return useContext(ThreatLevelContext);
}
