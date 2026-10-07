// Runs against a real MongoDB: MONGODB_TEST_URI, or a local mongod on 27017. The test database is dropped first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../index.js';

const URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/botl_test';
let server, base;

before(async () => {
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();
  await mongoose.syncIndexes();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  server.close();
  await mongoose.disconnect();
});

const call = async (method, url, body) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
};
const wine = { name: 'Reserva', producer: 'Marqués de Murrieta', vintage: '2018', price: 25, color: 'red', grapes: [{ grape: 'Tempranillo', pct: 80 }, { grape: 'Garnacha', pct: 20 }] };

test('closet from template, bottles, moves, swaps, cellar and reconcile', async () => {
  const { body: { closet } } = await call('POST', '/closets', { template: 'dual' });
  assert.equal(closet.shelves.length, 7);
  assert.equal(closet.shelves[0].type, 'stand');
  const sh = closet.shelves[1];
  const slot = (c, extra = {}) => ({ closet: closet._id, shelf: sh._id, d: 0, r: 0, c, ...extra });

  // several copies to the Cellar
  const add = await call('POST', '/bottles', { wine, location: { country: 'Spain', region: 'Rioja', appellation: 'Rioja' }, qty: 3 });
  assert.equal(add.status, 201);
  assert.equal(add.body.bottles.length, 3);
  assert.ok(add.body.bottles.every((b) => b.slot === null));
  const [a, b] = add.body.bottles;

  // into slots
  assert.equal((await call('POST', `/bottles/${a._id}/move`, { slot: slot(0) })).status, 200);
  assert.equal((await call('POST', `/bottles/${b._id}/move`, { slot: slot(1) })).status, 200);

  // a slot that does not exist
  assert.equal((await call('POST', `/bottles/${a._id}/move`, { slot: slot(40) })).status, 400);

  // adding straight into a taken slot is refused
  assert.equal((await call('POST', '/bottles', { wine, slot: slot(0) })).status, 409);

  // dropping on a taken slot swaps
  const sw = await call('POST', `/bottles/${a._id}/move`, { slot: slot(1) });
  assert.equal(sw.body.swapped, true);
  const byId = Object.fromEntries(sw.body.bottles.map((x) => [x._id, x]));
  assert.equal(byId[a._id].slot.c, 1);
  assert.equal(byId[b._id].slot.c, 0);

  // a bottle from the Cellar dropped on a taken slot swaps the other one out to the Cellar
  const c3 = add.body.bottles[2];
  const sw2 = await call('POST', `/bottles/${c3._id}/move`, { slot: slot(0) });
  assert.equal(sw2.body.swapped, true);
  assert.equal(sw2.body.bottles.find((x) => x._id === b._id).slot, null);

  // shrinking the shelf sends bottles in vanished slots to the Cellar
  const shelves = closet.shelves.map((s) => ({ ...s }));
  shelves[1].cols = 1;
  const p = await call('PATCH', `/closets/${closet._id}`, { shelves });
  assert.equal(p.body.moved, 1);
  assert.equal(p.body.closet.shelves[1]._id, sh._id, 'shelf ids are kept');

  // drinking removes it from the state
  await call('POST', `/bottles/${c3._id}/drink`);
  const st = await call('GET', '/state');
  assert.equal(st.body.bottles.length, 2);
  assert.ok(st.body.bottles.every((x) => x.slot === null));

  // deleting a closet keeps its bottles
  await call('POST', `/bottles/${a._id}/move`, { slot: { closet: closet._id, shelf: closet.shelves[0]._id, d: 0, r: 1, c: 2 } });
  const del = await call('DELETE', `/closets/${closet._id}`);
  assert.equal(del.body.moved, 1);
  const st2 = await call('GET', '/state');
  assert.equal(st2.body.closets.length, 0);
  assert.equal(st2.body.bottles.length, 2);
});

test('wine data is cleaned', async () => {
  const r = await call('POST', '/bottles', { wine: { name: ' X ', color: 'blue', price: 'abc', grapes: [{ grape: '', pct: 50 }, { grape: 'Merlot', pct: 140 }] } });
  const w = r.body.bottles[0].wine;
  assert.equal(w.name, 'X');
  assert.equal(w.color, 'red');
  assert.equal(w.price, undefined);
  assert.deepEqual(w.grapes, [{ grape: 'Merlot', pct: 100 }]);
  assert.equal((await call('POST', '/bottles', { wine: {} })).status, 400);
});
