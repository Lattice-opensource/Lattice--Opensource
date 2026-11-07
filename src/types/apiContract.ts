// Compatibility aliases for older frontend imports. The authoritative types live
// in backend/packages/contracts and are resolved through tsconfig paths.
import type {
  ErrorResponse,
  HealthResponse as SharedHealthResponse,
  LatestReadingsResponse,
  Reading,
  SiteSummary,
} from "@lattice/contracts";

export type {
  ApiErrorBody,
  Building,
  Circuit,
  Device,
  ErrorResponse,
  Floor,
  HealthResponse,
  LatestReading,
  LatestReadingsResponse,
  ListResponse,
  Reading,
  ReadingSource,
  ResponseMeta,
  Site,
  SiteConfig,
  SiteSummary,
  Summary,
} from "@lattice/contracts";

export type ApiReading = Reading;
export type ReadingsResponse = LatestReadingsResponse;
export type ApiSiteSummary = SiteSummary;
export type ApiError = ErrorResponse;
export type ApiHealthResponse = SharedHealthResponse;
