import { useCallback, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import { useDataSource } from "../data/useDataSource";
import { useApiResource } from "../data/useApiResource";
import type { SiteOverview } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SitePowerChart } from "../components/dashboard/SitePowerChart";
import { DeviceList } from "../components/dashboard/DeviceList";
import { RoomCards } from "../components/dashboard/RoomCards";
import { TopConsumers } from "../components/dashboard/TopConsumers";
import { ApplianceRanking, rankAppliances, type AppliancePeriod } from "../components/dashboard/ApplianceRanking";
import { resolveWholeSite } from "../data/api/normalize";

const POLL_INTERVAL_MS = 10000;

export function DashboardPage() {
  const { setDataSource } = useDataSource();
  const [appliancePeriod, setAppliancePeriod] = useState<AppliancePeriod>("today");

  const loader = useCallback(async (): Promise<SiteOverview> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    setDataSource(overview.dataSource);
    return overview;
  }, [setDataSource]);

  const { state, reload } = useApiResource<SiteOverview>(loader, POLL_INTERVAL_MS);

  const applianceLoader = useCallback(async () => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    const siteId = overview.siteId;

    let devices = overview.devices;
    let householdEnergy = overview.wholeSite.energyKwh;

    if (appliancePeriod === "7d") {
      const now = new Date();
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();
      const windowDevices = (await api.getDeviceSummaries?.(siteId, from, to)) ?? overview.devices;
      const currentById = new Map(overview.devices.map((d) => [d.deviceId, d]));
      devices = windowDevices.map((d) => ({
        ...d,
        powerW: currentById.get(d.deviceId)?.powerW ?? d.powerW,
      }));
      householdEnergy = resolveWholeSite(devices).energyKwh;
    }

    const appliances = devices.filter((d) => d.roomName !== null);
    const applianceEnergy = appliances.reduce((s, d) => s + d.energyKwh, 0);
    const coverageIncomplete =
      householdEnergy > 0 && applianceEnergy < householdEnergy * 0.99;

    return {
      devices,
      householdEnergy,
      coverageIncomplete,
    };
  }, [appliancePeriod]);

  const { state: applianceState } = useApiResource(applianceLoader);

  if (state.status === "loading") {
    return (
      <div className="py-16">
        <Spinner label="Loading dashboard" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="py-8">
        <ErrorState message={state.message} onRetry={reload} />
      </div>
    );
  }

  const overview = state.data;
  const { wholeSite } = overview;
  const meterBased = wholeSite.source === "meter";
  const currencySymbol = overview.currency === "INR" ? "₹" : "";

  return (
    <div className="space-y-5">
      {state.error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-xs text-ink/80">
            <span className="font-semibold">Refresh failed:</span> {state.error} — showing the last
            successful reading.
          </p>
          <button
            type="button"
            onClick={reload}
            className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-warn"
          >
            Retry
          </button>
        </div>
      ) : null}


      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {overview.siteName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {overview.onlineDeviceCount} of {overview.deviceCount} devices reporting ·{" "}
            {Math.round(wholeSite.powerW)} W live · {overview.rooms.length} zones
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-ok ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            live
          </span>
          <p className="mt-1 text-xs text-muted">
            Updated{" "}
            {new Date(overview.lastUpdated).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card eyebrow="01 · Estimated spend today">
          <p className="text-4xl font-bold tracking-tight text-ink">
            {currencySymbol}
            {wholeSite.costInr.toFixed(0)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
              {Math.round(wholeSite.powerW)} W live
            </span>
            <span className="rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-ink">
              {wholeSite.energyKwh.toFixed(2)} kWh today
            </span>
            <span className="rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-ink">
              {meterBased ? "site meter" : "device sum"}
            </span>
          </div>
          <p className="mt-4 text-xs text-muted">
            {meterBased
              ? "Total site load read from the site meter; appliance readings are not added on top."
              : "Summed from individual devices; no site meter is reporting."}
          </p>
        </Card>

        <Card eyebrow="02 · Usage insights">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-warn">Peak power today</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {Math.round(overview.peak.powerW)} W
              </p>
              <p className="mt-1 text-xs text-ink/70">
                {overview.peak.at
                  ? new Date(overview.peak.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "no data"}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ok">Average power</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {Math.round(overview.averagePowerW)} W
              </p>
              <p className="mt-1 text-xs text-ink/70">Average across today&apos;s readings</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Waste and savings estimates are not shown: the API v1 contract has no baseline or
            tariff-shift model to derive them from.
          </p>
        </Card>
      </div>

      <Card
        eyebrow="03 · Quick actions"
        title="Device control"
        action={
          <span className="rounded-full bg-page px-2.5 py-1 text-[11px] font-semibold text-muted">
            Unavailable
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {["All on", "Night", "All off"].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              aria-disabled="true"
              title="Device control is not part of API v1 — buttons are disabled and change nothing."
              className="cursor-not-allowed rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-muted"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          API v1 exposes read-only endpoints, so these controls are disabled rather than
          pretending to switch devices on or off.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card eyebrow="04 · Today's curve" title="Whole-site watts — line">
          <SitePowerChart points={overview.series} timezone={overview.timezone} />
          <p className="mt-2 text-xs text-muted">
            {meterBased
              ? "Site meter readings for today (local time)."
              : "Summed device readings for today (local time)."}
          </p>
        </Card>

        <Card
          title={`Equipment · ${overview.onlineDeviceCount} on`}
          action={<span className="text-xs text-muted">{overview.deviceCount} total</span>}
        >
          {overview.devices.length === 0 ? (
            <EmptyState title="No devices" description="No equipment is reporting for this building." />
          ) : (
            <DeviceList devices={overview.devices} />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card eyebrow="05 · Zones" title="Usage by zone">
          <RoomCards rooms={overview.rooms} />
        </Card>

        <Card eyebrow="06 · Highest consumers" title="By current power">
          <TopConsumers devices={overview.devices} />
        </Card>
      </div>

      {applianceState.status === "ready" ? (
        <ApplianceRanking
          items={rankAppliances(applianceState.data.devices, applianceState.data.householdEnergy)}
          householdEnergyKwh={applianceState.data.householdEnergy}
          coverageIncomplete={applianceState.data.coverageIncomplete}
          period={appliancePeriod}
          onPeriodChange={setAppliancePeriod}
        />
      ) : applianceState.status === "loading" ? (
        <div className="py-6">
          <Spinner label="Loading appliance insights" />
        </div>
      ) : (
        <ErrorState message={applianceState.message} />
      )}
    </div>
  );
}
