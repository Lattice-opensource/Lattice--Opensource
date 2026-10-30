const env = import.meta.env ?? ({} as Record<string, string | undefined>);

export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL ?? "http://localhost:8000",
  useSampleData: env.VITE_USE_SAMPLE_DATA !== "false",
} as const;
