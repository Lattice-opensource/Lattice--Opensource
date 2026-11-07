import { z } from 'zod';
import type {
  Site,
  Room,
  Building,
  Floor,
  Circuit,
  Device,
  DeviceCategory,
  DeviceStatus,
  Reading,
  ReadingSource,
  FlatTariff,
  SlabTariff,
  Tariff,
  SiteConfig,
  ResponseMeta,
  ListResponse,
  ItemResponse,
  ApiErrorBody,
  ErrorResponse,
  HealthResponse,
  SiteSummary,
  LatestReading,
  LatestReadingsResponse,
  SeedResult,
  AggregatePoint,
  Summary,
  AggregateGroupBy,
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertType,
  Report,
  ReportPeriod,
  ReportScope,
  ReportSummary,
  ReportAlertSummary,
  ReportComparison,
} from '../types.js';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** ISO-8601 UTC timestamp string with millisecond precision. Offsets other than Z are rejected. */
export const IsoDateTimeSchema = z.iso.datetime();

export const DeviceCategorySchema = z.enum([
  'hvac',
  'lighting',
  'kitchen',
  'electronics',
  'appliance',
  'ev',
  'other',
]);

export const DeviceStatusSchema = z.enum(['online', 'offline', 'stale', 'unknown']);

export const ReadingSourceSchema = z.enum(['simulator', 'device', 'import']);

/* -------------------------------------------------------------------------- */
/* Domain schemas                                                             */
/* -------------------------------------------------------------------------- */

export const SiteSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  timezone: z.string().min(1).max(64),
  currency: z.string().length(3),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const RoomSchema = z.object({
  id: z.string().min(1).max(64),
  siteId: z.string().min(1).max(64),
  buildingId: z.string().min(1).max(64).nullable(),
  floorId: z.string().min(1).max(64).nullable(),
  name: z.string().min(1).max(120),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const BuildingSchema = z.object({ id: z.string().min(1).max(64), siteId: z.string().min(1).max(64), name: z.string().min(1).max(120), createdAt: IsoDateTimeSchema, updatedAt: IsoDateTimeSchema });
export const FloorSchema = z.object({ id: z.string().min(1).max(64), buildingId: z.string().min(1).max(64), name: z.string().min(1).max(120), level: z.number().int(), createdAt: IsoDateTimeSchema, updatedAt: IsoDateTimeSchema });
export const CircuitSchema = z.object({ id: z.string().min(1).max(64), siteId: z.string().min(1).max(64), buildingId: z.string().min(1).max(64).nullable(), floorId: z.string().min(1).max(64).nullable(), roomId: z.string().min(1).max(64).nullable(), name: z.string().min(1).max(120), createdAt: IsoDateTimeSchema, updatedAt: IsoDateTimeSchema });

export const DeviceSchema = z.object({
  id: z.string().min(1).max(64),
  siteId: z.string().min(1).max(64),
  roomId: z.string().min(1).max(64).nullable(),
  circuitId: z.string().min(1).max(64).nullable(),
  roomName: z.string().min(1).max(120).nullable(),
  name: z.string().min(1).max(120),
  category: DeviceCategorySchema,
  model: z.string().min(1).max(120).nullable(),
  ratedPowerW: z.number().min(0).nullable(),
  status: DeviceStatusSchema,
  lastSeenAt: IsoDateTimeSchema.nullable(),
  isSimulated: z.boolean(),
  installedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ReadingSchema = z.object({
  id: z.string().min(1).max(64),
  deviceId: z.string().min(1).max(64),
  timestamp: IsoDateTimeSchema,
  intervalStart: IsoDateTimeSchema,
  intervalSeconds: z.number().int().min(0),
  powerW: z.number().min(0),
  energyKwh: z.number().min(0).nullable(),
  energyKwhTotal: z.number().min(0).nullable(),
  voltageV: z.number().min(0).nullable(),
  currentA: z.number().min(0).nullable(),
  isSimulated: z.boolean(),
  source: ReadingSourceSchema,
});

/* -------------------------------------------------------------------------- */
/* Tariff + config                                                            */
/* -------------------------------------------------------------------------- */

export const FlatTariffSchema = z.object({
  type: z.literal('flat'),
  unit: z.literal('kWh'),
  rateInrPerKwh: z.number().min(0),
});

export const SlabTariffSchema = z.object({
  type: z.literal('slab'),
  unit: z.literal('kWh'),
  slabs: z
    .array(
      z.object({
        upToKwh: z.number().min(0).nullable(),
        rateInrPerKwh: z.number().min(0),
      }),
    )
    .min(1),
});

export const TariffSchema = z.discriminatedUnion('type', [
  FlatTariffSchema,
  SlabTariffSchema,
]);

export const SiteConfigSchema = z.object({
  siteId: z.string().min(1).max(64),
  currency: z.string().length(3),
  timezone: z.string().min(1).max(64),
  tariff: TariffSchema,
  staleAfterSeconds: z.number().int().min(1),
  dataSource: z.object({
    mode: z.enum(['simulated', 'live', 'mixed']),
    simulated: z.boolean(),
    notice: z.string().min(1),
  }),
});

/* -------------------------------------------------------------------------- */
/* Envelopes                                                                  */
/* -------------------------------------------------------------------------- */

export const ResponseMetaSchema = z.object({
  serverTime: IsoDateTimeSchema,
  total: z.number().int().min(0).optional(),
  limit: z.number().int().min(0).optional(),
  offset: z.number().int().min(0).optional(),
  hasMore: z.boolean().optional(),
});

export const ListResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: ResponseMetaSchema,
  });

export const ItemResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: item,
    meta: ResponseMetaSchema,
  });

export const ApiErrorBodySchema = z.object({
  code: z.enum([
    'VALIDATION_ERROR',
    'INVALID_QUERY',
    'NOT_FOUND',
    'UNAUTHORIZED',
    'RATE_LIMITED',
    'INTERNAL_ERROR',
    'SERVICE_UNAVAILABLE',
  ]),
  message: z.string().min(1),
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  requestId: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  error: ApiErrorBodySchema,
});

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  timestamp: IsoDateTimeSchema,
  service: z.string().min(1),
  version: z.string().min(1),
  uptimeSeconds: z.number().min(0),
  time: IsoDateTimeSchema,
  database: z.enum(['up', 'down']),
});

export const SiteSummarySchema = z.object({
  siteId: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  currentPowerW: z.number().min(0),
  todayEnergyKwh: z.number().min(0),
  todayCostInr: z.number().min(0),
});

export const LatestReadingSchema = z.object({
  deviceId: z.string().min(1).max(64),
  timestamp: IsoDateTimeSchema,
  powerWatts: z.number().min(0),
  energyKwh: z.number().min(0),
  source: z.enum(['simulated', 'real']),
  id: z.string().min(1).max(64),
  intervalStart: IsoDateTimeSchema,
  intervalSeconds: z.number().int().min(0),
  energyKwhTotal: z.number().min(0).nullable(),
  voltageV: z.number().min(0).nullable(),
  currentA: z.number().min(0).nullable(),
  isSimulated: z.boolean(),
});

export const LatestReadingsResponseSchema = z.object({
  data: z.array(ReadingSchema),
  meta: ResponseMetaSchema,
  readings: z.array(LatestReadingSchema),
  count: z.number().int().min(0),
  generatedAt: IsoDateTimeSchema,
});

export const SeedResultSchema = z.object({
  seeded: z.boolean(),
  reason: z.string().min(1),
});

/* -------------------------------------------------------------------------- */
/* Aggregate + summary                                                        */
/* -------------------------------------------------------------------------- */

export const AggregateGroupBySchema = z.enum(['device', 'room', 'site']);

export const AggregatePointSchema = z.object({
  bucketStart: IsoDateTimeSchema,
  bucketEnd: IsoDateTimeSchema,
  groupBy: AggregateGroupBySchema,
  siteId: z.string().min(1).max(64),
  deviceId: z.string().min(1).max(64).nullable(),
  deviceName: z.string().min(1).max(120).nullable(),
  roomId: z.string().min(1).max(64).nullable(),
  roomName: z.string().min(1).max(120).nullable(),
  powerWAvg: z.number().min(0),
  powerWMax: z.number().min(0),
  energyKwh: z.number().min(0),
  costInr: z.number().min(0),
  costIsEstimate: z.boolean().optional(),
  sampleCount: z.number().int().min(0),
  isSimulated: z.boolean(),
});

export const SummarySchema = z.object({
  siteId: z.string().min(1).max(64),
  window: z.object({ from: IsoDateTimeSchema, to: IsoDateTimeSchema }),
  totals: z.object({
    powerW: z.number().min(0),
    energyKwh: z.number().min(0),
    costInr: z.number().min(0),
    costIsEstimate: z.boolean().optional(),
  }),
  byDevice: z.array(
    z.object({
      deviceId: z.string().min(1).max(64),
      deviceName: z.string().min(1).max(120),
      roomId: z.string().min(1).max(64).nullable(),
      roomName: z.string().min(1).max(120).nullable(),
      category: DeviceCategorySchema,
      status: DeviceStatusSchema,
      isSimulated: z.boolean(),
      powerW: z.number().min(0),
      energyKwh: z.number().min(0),
      costInr: z.number().min(0),
      lastSeenAt: IsoDateTimeSchema.nullable(),
    }),
  ),
  byRoom: z.array(
    z.object({
      roomId: z.string().min(1).max(64),
      roomName: z.string().min(1).max(120),
      powerW: z.number().min(0),
      energyKwh: z.number().min(0),
      costInr: z.number().min(0),
    }),
  ),
  dataQuality: z.object({
    simulated: z.boolean(),
    simulatedReadings: z.number().int().min(0),
    realReadings: z.number().int().min(0),
    simulatedEnergyKwh: z.number().min(0),
    realEnergyKwh: z.number().min(0),
  }),
});

/* -------------------------------------------------------------------------- */
/* Alerts                                                                     */
/* -------------------------------------------------------------------------- */

export const AlertSeveritySchema = z.enum(['low', 'medium', 'high']);
export const AlertStatusSchema = z.enum(['active', 'acknowledged', 'resolved']);
export const AlertTypeSchema = z.enum([
  'consumption_increase',
  'high_consumption',
  'overnight_consumption',
  'unexpected_device_activity',
  'missing_readings',
]);

export const AlertSchema = z.object({
  id: z.string().min(1).max(64),
  siteId: z.string().min(1).max(64).nullable(),
  buildingId: z.string().min(1).max(64).nullable(),
  floorId: z.string().min(1).max(64).nullable(),
  roomId: z.string().min(1).max(64).nullable(),
  circuitId: z.string().min(1).max(64).nullable(),
  deviceId: z.string().min(1).max(64).nullable(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  status: AlertStatusSchema,
  title: z.string().min(1).max(200),
  observedValue: z.number().nullable(),
  expectedValue: z.number().nullable(),
  additionalCostInr: z.number().nullable(),
  explanation: z.string().min(1),
  recommendation: z.string().min(1),
  detectedAt: IsoDateTimeSchema,
  acknowledgedAt: IsoDateTimeSchema.nullable(),
  resolvedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

export const ReportPeriodSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  from: IsoDateTimeSchema,
  to: IsoDateTimeSchema,
});

export const ReportScopeSchema = z.object({
  siteId: z.string().min(1).max(64).nullable(),
  buildingId: z.string().min(1).max(64).nullable(),
  floorId: z.string().min(1).max(64).nullable(),
  roomId: z.string().min(1).max(64).nullable(),
  circuitId: z.string().min(1).max(64).nullable(),
});

export const ReportSummarySchema = z.object({
  energyKwh: z.number().min(0),
  costInr: z.number().min(0),
  averagePowerW: z.number().min(0),
  peakPowerW: z.number().min(0),
  deviceCount: z.number().int().min(0),
  readingAvailability: z.number().min(0).max(1),
  simulatedReadings: z.number().int().min(0),
  realReadings: z.number().int().min(0),
});

export const ReportAlertSummarySchema = z.object({
  total: z.number().int().min(0),
  bySeverity: z.object({ low: z.number().int().min(0), medium: z.number().int().min(0), high: z.number().int().min(0) }),
  unresolved: z.number().int().min(0),
});

export const ReportComparisonSchema = z.object({
  previousFrom: IsoDateTimeSchema,
  previousTo: IsoDateTimeSchema,
  energyKwh: z.number().min(0),
  costInr: z.number().min(0),
  energyChangeKwh: z.number(),
  costChangeInr: z.number(),
  energyChangePercent: z.number().nullable(),
});

export const ReportSchema = z.object({
  scope: ReportScopeSchema,
  period: ReportPeriodSchema,
  summary: ReportSummarySchema,
  series: z.array(AggregatePointSchema),
  byDevice: SummarySchema.shape.byDevice,
  bySpace: SummarySchema.shape.byRoom,
  alerts: ReportAlertSummarySchema,
  comparison: ReportComparisonSchema.optional(),
  generatedAt: IsoDateTimeSchema,
});

/* -------------------------------------------------------------------------- */
/* Compile-time lockstep with the type-only definitions                       */
/* -------------------------------------------------------------------------- */
//
// These assertions fail to compile if a schema's inferred shape ever drifts
// from the corresponding interface in ../types.ts.

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertions: [
  AssertEqual<z.infer<typeof SiteSchema>, Site>,
  AssertEqual<z.infer<typeof RoomSchema>, Room>,
  AssertEqual<z.infer<typeof BuildingSchema>, Building>,
  AssertEqual<z.infer<typeof FloorSchema>, Floor>,
  AssertEqual<z.infer<typeof CircuitSchema>, Circuit>,
  AssertEqual<z.infer<typeof DeviceSchema>, Device>,
  AssertEqual<z.infer<typeof ReadingSchema>, Reading>,
  AssertEqual<z.infer<typeof FlatTariffSchema>, FlatTariff>,
  AssertEqual<z.infer<typeof SlabTariffSchema>, SlabTariff>,
  AssertEqual<z.infer<typeof TariffSchema>, Tariff>,
  AssertEqual<z.infer<typeof SiteConfigSchema>, SiteConfig>,
  AssertEqual<z.infer<typeof ResponseMetaSchema>, ResponseMeta>,
  AssertEqual<z.infer<typeof ApiErrorBodySchema>, ApiErrorBody>,
  AssertEqual<z.infer<typeof ErrorResponseSchema>, ErrorResponse>,
  AssertEqual<z.infer<typeof HealthResponseSchema>, HealthResponse>,
  AssertEqual<z.infer<typeof SiteSummarySchema>, SiteSummary>,
  AssertEqual<z.infer<typeof LatestReadingSchema>, LatestReading>,
  AssertEqual<z.infer<typeof LatestReadingsResponseSchema>, LatestReadingsResponse>,
  AssertEqual<z.infer<typeof SeedResultSchema>, SeedResult>,
  AssertEqual<z.infer<typeof AggregatePointSchema>, AggregatePoint>,
  AssertEqual<z.infer<typeof SummarySchema>, Summary>,
  AssertEqual<z.infer<typeof AlertSchema>, Alert>,
  AssertEqual<z.infer<typeof ReportSchema>, Report>,
] = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
];
void _assertions;

