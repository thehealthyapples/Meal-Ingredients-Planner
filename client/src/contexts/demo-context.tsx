import { createContext, useContext, useState } from "react";

interface DemoContextValue {
  isDemoMode: boolean;
  resetKey: number;
  reset: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  resetKey: 0,
  reset: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [resetKey, setResetKey] = useState(0);

  const reset = () => setResetKey((k) => k + 1);

  return (
    <DemoContext.Provider value={{ isDemoMode: true, resetKey, reset }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode(): DemoContextValue {
  return useContext(DemoContext);
}
