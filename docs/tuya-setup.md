# Tuya Smart Life integration setup

This guide prepares Lattice to read an AZIOT smart plug that is linked through the Smart Life app and Tuya Cloud. It covers the integration foundation only; it does not connect a real device.

## Required Tuya Cloud details

Create a project in the Tuya IoT Development Platform (Cloud → Development) and collect:

- **Access ID** (Client ID)
- **Access Secret** (Client Secret)
- **Data centre / regional base URL** that matches the Smart Life account region (for example `https://openapi.tuyain.com` for India, `https://openapi.tuyaeu.com` for Europe, `https://openapi.tuyaus.com` for the Americas, `https://openapi.tuyacn.com` for China). Verify the exact value shown in your project.
- **Device ID** of the smart plug after it has been linked to the project.
- The API services subscribed for the project (at minimum: Authorization, IoT Core / Device Management and Device Control).

Never paste the Access Secret, QR codes or account passwords into chat or commit them to Git.

## Link a Smart Life account

1. In the Tuya Cloud project, open **Devices → Link Tuya App Account → Add App Account**.
2. Select the data centre that matches the region of the Smart Life account registered on the phone. For an account registered in India, choose the India data centre if it is listed.
3. Scan the QR code with the Smart Life app (do not share the QR code).
4. After linking, the devices from that Smart Life account appear under the project.

## Configure environment variables

Copy `backend/.env.example` to `backend/.env` and set:

```
TUYA_ENABLED=false
TUYA_ACCESS_ID=
TUYA_ACCESS_SECRET=
TUYA_BASE_URL=
TUYA_DEVICE_ID=
TUYA_POLL_INTERVAL_SECONDS=60
```

Fill in the empty values locally. `TUYA_ENABLED` defaults to `false`; leave it `false` until Tuya Cloud access has been verified. Real `.env` files are gitignored.

## Configure the device

The integration uses `TUYA_DEVICE_ID` to identify the smart plug in both Tuya Cloud and Lattice. When enabled, Lattice creates/updates a non-simulated device record for it and stores its readings with `source = device` and `isSimulated = false`.

## Test the connection (manual)

1. Set `TUYA_ENABLED=true` with valid credentials.
2. Start the backend (`npm run dev` in `backend/`).
3. Watch the logs for `[tuya]` messages. A successful poll stores a reading; failures are logged without crashing the app.
4. Query `GET /api/readings/latest` or the dashboard to see the device's power reading.
5. Set `TUYA_ENABLED=false` to return to simulator mode.

Do not claim the smart plug is connected until real readings have been successfully retrieved.

## Switch back to simulator mode

Set `TUYA_ENABLED=false` (or unset it) and restart the backend. Simulator readings remain the default and are unaffected by Tuya failures. Existing readings are never deleted by the Tuya integration.