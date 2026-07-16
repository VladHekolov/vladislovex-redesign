import assert from 'node:assert/strict';

const guitarist = (hours) => Math.max(8000, hours * 5000);
const cajon = (hours) => Math.max(5000, hours * 3000);
const mini = (hours) => guitarist(hours) + cajon(hours) + 4000;

assert.equal(guitarist(0.5), 8000);
assert.equal(guitarist(1), 8000);
assert.equal(guitarist(1.5), 8000);
assert.equal(guitarist(2), 10000);
assert.equal(guitarist(3), 15000);

assert.equal(cajon(0.5), 5000);
assert.equal(cajon(1), 5000);
assert.equal(cajon(1.5), 5000);
assert.equal(cajon(2), 6000);
assert.equal(cajon(3), 9000);

assert.equal(mini(1), 17000);
assert.equal(mini(2), 20000);
assert.equal(mini(3), 28000);

function offerValues(selected) {
  const whole = Math.abs(selected - Math.round(selected)) < 0.01 && selected >= 1;
  const step = whole ? 1 : 0.5;
  if (selected <= 0.5) return [0.5, 1, 1.5];
  if (selected >= 5) return [3, 4, 5];
  return [selected - step, selected, selected + step];
}

assert.deepEqual(offerValues(2), [1, 2, 3]);
assert.deepEqual(offerValues(4), [3, 4, 5]);
assert.deepEqual(offerValues(2.5), [2, 2.5, 3]);
assert.deepEqual(offerValues(4.5), [4, 4.5, 5]);

console.log('Calculator pricing tests passed.');
