import assert from 'node:assert/strict';

const bands = [
  { maxRoundTripKm: 40, category: 'inside', price: 0 },
  { maxRoundTripKm: 70, category: 'to20', price: 3000 },
  { maxRoundTripKm: 100, category: 'to35', price: 4000 },
  { maxRoundTripKm: 150, category: 'to50', price: 5000 },
  { maxRoundTripKm: 200, category: 'to75', price: 6000 },
  { maxRoundTripKm: 260, category: 'to100', price: 7000 },
  { maxRoundTripKm: 320, category: 'to130', price: 8000 },
  { maxRoundTripKm: Infinity, category: 'far', price: 9000 }
];

function getBand(km) {
  return bands.find((band) => km <= band.maxRoundTripKm);
}

function parseBackendRoute(payload) {
  const route = payload?.ok ? payload.route : null;
  if (!route) return null;

  let oneWayKm = Number(route.oneWayKm);
  let roundTripKm = Number(route.roundTripKm);
  const durationSeconds = Number(route.durationSeconds);

  if (!Number.isFinite(oneWayKm) || oneWayKm <= 0) {
    const distanceMeters = Number(route.distanceMeters);
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;
    oneWayKm = distanceMeters / 1000;
  }
  if (!Number.isFinite(roundTripKm) || roundTripKm <= 0) roundTripKm = oneWayKm * 2;

  return {
    oneWayKm,
    roundTripKm,
    oneWayMinutes: Number.isFinite(durationSeconds) ? durationSeconds / 60 : null
  };
}

assert.deepEqual(getBand(40), bands[0]);
assert.deepEqual(getBand(40.1), bands[1]);
assert.deepEqual(getBand(70), bands[1]);
assert.deepEqual(getBand(100), bands[2]);
assert.deepEqual(getBand(150), bands[3]);
assert.deepEqual(getBand(260), bands[5]);
assert.deepEqual(getBand(320), bands[6]);
assert.deepEqual(getBand(321), bands[7]);

assert.deepEqual(
  parseBackendRoute({
    ok: true,
    route: {
      distanceMeters: 12500,
      durationSeconds: 1800,
      oneWayKm: 12.5,
      roundTripKm: 25
    }
  }),
  { oneWayKm: 12.5, roundTripKm: 25, oneWayMinutes: 30 }
);

assert.deepEqual(
  parseBackendRoute({
    ok: true,
    route: { distanceMeters: 15000, durationSeconds: 1200 }
  }),
  { oneWayKm: 15, roundTripKm: 30, oneWayMinutes: 20 }
);

assert.equal(parseBackendRoute({ ok: false }), null);
assert.equal(parseBackendRoute({ ok: true, route: {} }), null);

console.log('backend route distance tests passed.');
