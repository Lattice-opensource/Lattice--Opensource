import { Aedes } from 'aedes';
import { createServer } from 'node:net';

const port = Number(process.env.MQTT_PORT ?? 1883);

const broker = await Aedes.createBroker();
const server = createServer(broker.handle);

server.listen(port, () => {
  console.log(`[smoke-broker] listening on mqtt://127.0.0.1:${port}`);
});

process.on('SIGINT', () => { server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
