import { createContext, useMemo, useState, type ReactNode } from "react";

export interface DataSourceState {
  simulated: boolean;
  notice: string;
}

export interface DataSourceContextValue extends DataSourceState {
  setDataSource: (value: DataSourceState) => void;
}

export const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataSourceState>({
    simulated: true,
    notice: "Loading data source status…",
  });

  const value = useMemo<DataSourceContextValue>(
    () => ({ ...state, setDataSource: setState }),
    [state],
  );

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}
