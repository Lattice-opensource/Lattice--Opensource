import type { DatabaseSync } from 'node:sqlite';
import type { Report, ReportAlertSummary } from '@lattice/contracts';
import { listAlerts } from '../db/repositories/alerts.js';
import { getSite } from '../db/repositories/sites.js';
import { computeSummary } from './summary.js';
import { aggregate, resolveTariff } from './aggregate.js';
import { startOfDayInTz } from '../lib/time.js';
import { toIso } from '../lib/time.js';
import { round2 } from './cost.js';

export interface ReportParams {
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  circuitId?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  from?: string;
  to?: string;
  compare?: boolean;
}

function periodRange(params: ReportParams, tz: string): { from: string; to: string } {
  const now = new Date();
  if (params.period === 'custom') {
    if (!params.from || !params.to) throw new Error('Custom period requires from and to');
    return { from: params.from, to: params.to };
  }
  if (params.period === 'daily') {
    return { from: startOfDayInTz(tz, now), to: now.toISOString() };
  }
  const days = params.period === 'weekly' ? 7 : 30;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: now.toISOString() };
}

export function generateReport(db: DatabaseSync, params: ReportParams): Report {
  const siteId = params.siteId ?? 'site_home_01';
  const site = getSite(db, siteId);
  const tz = site?.timezone ?? 'Asia/Kolkata';
  const { from, to } = periodRange(params, tz);

  const summary = computeSummary(db, {
    siteId,
    buildingId: params.buildingId,
    floorId: params.floorId,
    roomId: params.roomId,
    circuitId: params.circuitId,
    from,
    to,
  });

  const spanMs = new Date(to).getTime() - new Date(from).getTime();
  const bucket = spanMs > 7 * 24 * 60 * 60 * 1000 ? 'day' : 'hour';
  const tariff = resolveTariff(db, siteId);
  const series = aggregate(db, {
    siteId,
    buildingId: params.buildingId,
    floorId: params.floorId,
    roomId: params.roomId,
    circuitId: params.circuitId,
    from,
    to,
    bucket,
    groupBy: 'site',
    tariff,
  });

  const peakPowerW = series.reduce((max, p) => Math.max(max, p.powerWMax), 0);
  const avgPowerW = series.length ? series.reduce((s, p) => s + p.powerWAvg, 0) / series.length : 0;
  const totalReadings = summary.dataQuality.simulatedReadings + summary.dataQuality.realReadings;

  const alertsList = listAlerts(db, {
    siteId,
    buildingId: params.buildingId ?? undefined,
    floorId: params.floorId ?? undefined,
    roomId: params.roomId ?? undefined,
    circuitId: params.circuitId ?? undefined,
    from,
    to,
  });
  const alertSummary: ReportAlertSummary = {
    total: alertsList.length,
    bySeverity: {
      low: alertsList.filter((a) => a.severity === 'low').length,
      medium: alertsList.filter((a) => a.severity === 'medium').length,
      high: alertsList.filter((a) => a.severity === 'high').length,
    },
    unresolved: alertsList.filter((a) => a.status !== 'resolved').length,
  };

  const report: Report = {
    scope: {
      siteId: siteId ?? null,
      buildingId: params.buildingId ?? null,
      floorId: params.floorId ?? null,
      roomId: params.roomId ?? null,
      circuitId: params.circuitId ?? null,
    },
    period: {
      type: params.period,
      from,
      to,
    },
    summary: {
      energyKwh: summary.totals.energyKwh,
      costInr: summary.totals.costInr,
      averagePowerW: round2(avgPowerW),
      peakPowerW: round2(peakPowerW),
      deviceCount: summary.byDevice.length,
      readingAvailability: totalReadings > 0 ? 1 : 0,
      simulatedReadings: summary.dataQuality.simulatedReadings,
      realReadings: summary.dataQuality.realReadings,
    },
    series,
    byDevice: summary.byDevice,
    bySpace: summary.byRoom,
    alerts: alertSummary,
    generatedAt: toIso(new Date()),
  };

  if (params.compare) {
    const duration = new Date(to).getTime() - new Date(from).getTime();
    const prevTo = from;
    const prevFrom = new Date(new Date(from).getTime() - duration).toISOString();
    const prevSummary = computeSummary(db, {
      siteId,
      buildingId: params.buildingId,
      floorId: params.floorId,
      roomId: params.roomId,
      circuitId: params.circuitId,
      from: prevFrom,
      to: prevTo,
    });
    report.comparison = {
      previousFrom: prevFrom,
      previousTo: prevTo,
      energyKwh: prevSummary.totals.energyKwh,
      costInr: prevSummary.totals.costInr,
      energyChangeKwh: round2(summary.totals.energyKwh - prevSummary.totals.energyKwh),
      costChangeInr: round2(summary.totals.costInr - prevSummary.totals.costInr),
      energyChangePercent: prevSummary.totals.energyKwh > 0
        ? round2(((summary.totals.energyKwh - prevSummary.totals.energyKwh) / prevSummary.totals.energyKwh) * 100)
        : null,
    };
  }

  return report;
}