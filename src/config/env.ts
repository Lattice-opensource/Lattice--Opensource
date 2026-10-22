export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  useSampleData: import.meta.env.VITE_USE_SAMPLE_DATA !== "false",
} as const;
