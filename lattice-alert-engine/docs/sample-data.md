# Sample Data Scenarios

Simulated (not real) electricity readings for testing and demonstration.
Loaded via `python sample-data/load_sample_data.py` (idempotent).

## Buildings & circuits
- **building_alpha**: circuits `main`, `ac_unit`
- **building_beta**: circuit `main`
- **building_gamma**: circuit `main` (all normal)

## Expected outcomes
- **building_alpha/main**: 10 normal readings (~1.0 kWh) establish baseline; the 11th reading (5.0 kWh) triggers
  fixed threshold, historical baseline, and sudden change alerts.
- **building_alpha/ac_unit**: 4 normal readings (~0.3 kWh); the 5th (2.5 kWh) triggers sudden change (and possibly baseline).
- **building_beta/main**: 4 normal readings (~2.0 kWh); the 5th (7.0 kWh) triggers fixed threshold and baseline.
- **building_gamma/main**: 5 normal readings (~0.5 kWh); no alerts expected.

Re-running the loader does not create duplicate readings or alerts (deduplication by building/circuit/timestamp).