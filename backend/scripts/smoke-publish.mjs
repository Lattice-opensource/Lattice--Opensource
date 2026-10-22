import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://127.0.0.1:1883', { clientId: 'smoke-publisher' });
client.on('connect', () => {
  const ts = new Date().toISOString();
  const payload = {
    deviceId: 'dev_bed_ac_01',
    timestamp: ts,
    powerW: 1234.5,
    energyKwh: 0.05,
    energyKwhTotal: 99.9,
    voltageV: 230.4,
    currentA: 5.36,
  };
  const topic = 'lattice/telemetry/dev_bed_ac_01/telemetry';
  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
    console.log('published', topic, err ? err.message : 'ok');
    console.log('payload', JSON.stringify(payload));
    // duplicate
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (e2) => {
      console.log('duplicate published', e2 ? e2.message : 'ok');
      // invalid stale
      const stale = { ...payload, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), powerW: 10 };
      client.publish(topic, JSON.stringify(stale), { qos: 1 }, (e3) => {
        console.log('stale published', e3 ? e3.message : 'ok');
        setTimeout(() => client.end(() => process.exit(0)), 2000);
      });
    });
  });
});
client.on('error', (e) => { console.error('pub error', e.message); process.exit(1); });
