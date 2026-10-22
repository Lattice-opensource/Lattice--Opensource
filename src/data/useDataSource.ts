import { useContext } from "react";
import { DataSourceContext, type DataSourceContextValue } from "./DataSourceContext";

export function useDataSource(): DataSourceContextValue {
  const ctx = useContext(DataSourceContext);
  if (!ctx) throw new Error("useDataSource must be used inside DataSourceProvider");
  return ctx;
}
