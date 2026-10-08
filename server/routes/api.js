import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { Closet, Bottle, WinePhoto, COLORS } from '../models.js';
import { cleanShelf, validKeys, slotKey, TEMPLATES, LIMITS } from '../../shared/layout.js';
import { GEO, GRAPES } from '../data/geo.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, done) => done(null, true)
});
const imageType = (file) => {
  if (!file) return null;
  const data = file.buffer;
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
};
const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const isId = (v) => mongoose.isValidObjectId(v);
const str = (v, max = 120) => (v == null ? '' : String(v).trim().slice(0, max));

function cleanWine(w = {}) {
  const price = w.price === '' || w.price == null ? undefined : Number(w.price);
  return {
    name: str(w.name),
    producer: str(w.producer),
    vintage: str(w.vintage, 10) || 'NV',
    price: Number.isFinite(price) && price >= 0 ? price : undefined,
    color: COLORS.includes(w.color) ? w.color : 'red',
    window: str(w.window, 40),
    grapes: (Array.isArray(w.grapes) ? w.grapes : [])
      .map((g) => ({ grape: str(g.grape, 60), pct: g.pct === '' || g.pct == null ? undefined : Math.min(100, Math.max(0, Number(g.pct) || 0)) }))
      .filter((g) => g.grape)
      .slice(0, 20)
  };
}
function cleanLocation(l = {}) {
  return { country: str(l.country, 60), region: str(l.region, 80), appellation: str(l.appellation, 80), vineyard: str(l.vineyard, 80) };
}
const wineGroupFilter = (wine, location) => ({
  'wine.name': wine.name,
  'wine.producer': wine.producer,
  'wine.vintage': wine.vintage,
  'wine.color': wine.color,
  'location.country': location.country,
  'location.region': location.region,
  'location.appellation': location.appellation,
  'location.vineyard': location.vineyard
});

// Checks that a slot exists in its closet's current layout and returns it in stored form.
async function resolveSlot(slot) {
  if (!slot) return null;
  if (!isId(slot.closet) || !isId(slot.shelf)) throw new HttpError(400, 'Unknown slot');
  const closet = await Closet.findById(slot.closet);
  if (!closet) throw new HttpError(404, 'Closet not found');
  const sh = closet.shelves.id(slot.shelf);
  const s = { closet: closet._id, shelf: new mongoose.Types.ObjectId(String(slot.shelf)), d: +slot.d || 0, r: +slot.r || 0, c: +slot.c || 0 };
  if (!sh || !validKeys(sh).has(slotKey(String(sh._id), s.d, s.r, s.c))) throw new HttpError(400, 'That slot does not exist');
  return s;
}
const occupant = (s) =>
  Bottle.findOne({ drunkAt: null, 'slot.closet': s.closet, 'slot.shelf': s.shelf, 'slot.d': s.d, 'slot.r': s.r, 'slot.c': s.c });

// Bottles whose slot no longer exists after a layout change go to the Cellar. A layout change never deletes a bottle.
async function reconcile(closet) {
  const valid = new Set();
  closet.shelves.forEach((sh) => validKeys(sh).forEach((k) => valid.add(k)));
  const inside = await Bottle.find({ drunkAt: null, 'slot.closet': closet._id }, { slot: 1 });
  const lost = inside.filter((b) => !valid.has(slotKey(String(b.slot.shelf), b.slot.d, b.slot.r, b.slot.c))).map((b) => b._id);
  if (lost.length) await Bottle.updateMany({ _id: { $in: lost } }, { $set: { slot: null } });
  return lost.length;
}

/* everything the app shows, in one call: a personal collection is small */
router.get('/state', ah(async (req, res) => {
  const [closets, bottles] = await Promise.all([
    Closet.find().sort({ order: 1, createdAt: 1 }),
    Bottle.find({ drunkAt: null }).sort({ createdAt: 1 })
  ]);
  res.json({ closets, bottles });
}));

router.get('/reference', (req, res) => {
  res.json({ geo: GEO, grapes: GRAPES, templates: Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, { name: t.name, kind: t.kind, desc: t.desc }])) });
});

router.get('/photos/:id', ah(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Photo not found');
  const photo = await WinePhoto.findById(req.params.id);
  if (!photo) throw new HttpError(404, 'Photo not found');
  res.type(photo.contentType).set('X-Content-Type-Options', 'nosniff').send(photo.data);
}));

/* closets */
router.post('/closets', ah(async (req, res) => {
  const t = TEMPLATES[req.body.template] || TEMPLATES.blank;
  const count = await Closet.countDocuments();
  const shelves = Array.isArray(req.body.shelves) && req.body.shelves.length ? req.body.shelves : t.shelves();
  const closet = await Closet.create({
    name: str(req.body.name, 80) || t.name,
    kind: str(req.body.kind, 40) || t.kind,
    order: count,
    shelves: shelves.slice(0, 26).map(cleanShelf).map(({ _id, ...s }) => s)
  });
  res.status(201).json({ closet });
}));

router.patch('/closets/:id', ah(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Closet not found');
  const closet = await Closet.findById(req.params.id);
  if (!closet) throw new HttpError(404, 'Closet not found');
  const b = req.body;
  if (b.name != null) closet.name = str(b.name, 80) || closet.name;
  if (b.kind != null) closet.kind = str(b.kind, 40);
  if (b.width != null) closet.width = Math.min(LIMITS.width[1], Math.max(0, Math.round(+b.width || 0)));
  if (Array.isArray(b.shelves)) {
    if (!b.shelves.length) throw new HttpError(400, 'A closet needs at least one shelf');
    // shelves keep their id so their bottles stay put; the client may name a new shelf's id itself
    const seen = new Set();
    closet.shelves = b.shelves.slice(0, 26).map(cleanShelf).map((s) => {
      if (s._id && (!isId(s._id) || seen.has(String(s._id)))) delete s._id;
      if (s._id) seen.add(String(s._id));
      return s;
    });
  }
  await closet.save();
  const moved = await reconcile(closet);
  res.json({ closet, moved });
}));

router.delete('/closets/:id', ah(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Closet not found');
  const closet = await Closet.findById(req.params.id);
  if (!closet) throw new HttpError(404, 'Closet not found');
  const r = await Bottle.updateMany({ drunkAt: null, 'slot.closet': closet._id }, { $set: { slot: null } });
  await closet.deleteOne();
  res.json({ moved: r.modifiedCount });
}));

/* bottles */
router.post('/bottles', upload.single('photo'), ah(async (req, res) => {
  let body = req.body;
  if (req.is('multipart/form-data')) {
    try {
      body = { ...req.body, wine: JSON.parse(req.body.wine || '{}'), location: JSON.parse(req.body.location || '{}'), slot: JSON.parse(req.body.slot || 'null') };
    } catch {
      throw new HttpError(400, 'Invalid wine or location data');
    }
  }
  const detectedImageType = imageType(req.file);
  if (req.file && !detectedImageType) throw new HttpError(400, 'The uploaded file is not a supported JPEG, PNG, or WebP image');
  const wine = cleanWine(body.wine);
  if (!wine.name && !wine.producer) throw new HttpError(400, 'Give the wine a name or a producer');
  const location = cleanLocation(body.location);
  const slot = await resolveSlot(body.slot);
  const qty = slot ? 1 : Math.min(48, Math.max(1, Math.round(+body.qty || 1)));
  if (slot && (await occupant(slot))) throw new HttpError(409, 'That slot is taken');
  const groupFilter = wineGroupFilter(wine, location);
  const existing = await Bottle.findOne({ ...groupFilter, drunkAt: null });
  const wineGroupId = existing?.wineGroupId || new mongoose.Types.ObjectId();
  const photo = req.file && await WinePhoto.create({ contentType: detectedImageType, data: req.file.buffer });
  const winePhotoId = photo?._id || existing?.winePhotoId || null;
  if (existing)
    await Bottle.updateMany({ ...groupFilter, drunkAt: null }, { $set: { wineGroupId, winePhotoId } });
  // one form can create several identical bottles, each with its own place
  const bottles = await Bottle.insertMany(Array.from({ length: qty }, () => ({ wine, location, wineGroupId, winePhotoId, slot })));
  res.status(201).json({ bottles });
}));

router.patch('/bottles/:id', ah(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Bottle not found');
  const bottle = await Bottle.findOne({ _id: req.params.id, drunkAt: null });
  if (!bottle) throw new HttpError(404, 'Bottle not found');
  const wineGroupId = bottle.wineGroupId || new mongoose.Types.ObjectId();
  const groupFilter = bottle.wineGroupId
    ? { wineGroupId, drunkAt: null }
    : { ...wineGroupFilter(bottle.wine.toObject(), bottle.location.toObject()), drunkAt: null };
  const set = { wineGroupId, winePhotoId: bottle.winePhotoId || null };
  if (req.body.wine) set.wine = cleanWine(req.body.wine);
  if (req.body.location) set.location = cleanLocation(req.body.location);
  await Bottle.updateMany(groupFilter, { $set: set }, { runValidators: true });
  const bottles = await Bottle.find({ wineGroupId, drunkAt: null }).sort({ createdAt: 1 });
  res.json({ bottle: bottles.find((item) => item._id.equals(bottle._id)), bottles });
}));

// Move a bottle to a slot, or to the Cellar with slot: null. Moving onto a taken slot swaps the two bottles.
router.post('/bottles/:id/move', ah(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Bottle not found');
  const a = await Bottle.findOne({ _id: req.params.id, drunkAt: null });
  if (!a) throw new HttpError(404, 'Bottle not found');
  const target = await resolveSlot(req.body.slot);
  const from = a.slot ? a.slot.toObject() : null;
  if (!target) {
    a.slot = null;
    await a.save();
    return res.json({ bottles: [a] });
  }
  const b = await occupant(target);
  if (b && b._id.equals(a._id)) return res.json({ bottles: [a] });
  if (b) {
    // free both slots first so the one-bottle-per-slot index never sees two bottles in one slot
    await Bottle.updateOne({ _id: a._id }, { $set: { slot: null } });
    await Bottle.updateOne({ _id: b._id }, { $set: { slot: from } });
  }
  await Bottle.updateOne({ _id: a._id }, { $set: { slot: target } });
  const bottles = await Bottle.find({ _id: { $in: b ? [a._id, b._id] : [a._id] } });
  res.json({ bottles, swapped: !!b });
}));

router.post('/bottles/:id/drink', ah(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Bottle not found');
  const bottle = await Bottle.findOneAndUpdate({ _id: req.params.id, drunkAt: null }, { $set: { drunkAt: new Date(), slot: null } }, { new: true });
  if (!bottle) throw new HttpError(404, 'Bottle not found');
  res.json({ bottle });
}));

router.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be smaller than 3 MB after resizing' : 'Could not read the uploaded photo' });
  if (err.code === 11000) return res.status(409).json({ error: 'That slot is taken' });
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.name === 'ValidationError' || err.type === 'entity.parse.failed') return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default router;
