import mongoose from 'mongoose';

const { Schema } = mongoose;

const ShelfSchema = new Schema({
  type: { type: String, enum: ['grid', 'stagger', 'stand'], default: 'grid' },
  rows: { type: Number, default: 1 },
  cols: { type: Number, default: 6 },
  depth: { type: Number, default: 1 },
  alt: { type: Boolean, default: false }
});

const ClosetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    kind: { type: String, default: 'Fridge', trim: true, maxlength: 40 },
    width: { type: Number, default: 0 }, // 0 = as wide as the widest shelf
    order: { type: Number, default: 0 },
    shelves: [ShelfSchema] // top to bottom
  },
  { timestamps: true }
);

export const COLORS = ['red', 'white', 'rose', 'spark', 'sweet'];

const WineSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    producer: { type: String, trim: true, default: '' },
    vintage: { type: String, trim: true, default: 'NV' },
    price: { type: Number, min: 0 },
    color: { type: String, enum: COLORS, default: 'red' },
    window: { type: String, trim: true, default: '' }, // drink window, e.g. "2026–2034"
    grapes: [{ _id: false, grape: { type: String, trim: true }, pct: { type: Number, min: 0, max: 100 } }]
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    country: { type: String, trim: true, default: '' },
    region: { type: String, trim: true, default: '' },
    appellation: { type: String, trim: true, default: '' },
    vineyard: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

// No slot means the bottle is in the Cellar (outside every closet).
const SlotSchema = new Schema(
  {
    closet: { type: Schema.Types.ObjectId, ref: 'Closet', required: true },
    shelf: { type: Schema.Types.ObjectId, required: true },
    d: { type: Number, default: 0 }, // 0 front, 1 back (two-deep lying shelves)
    r: { type: Number, default: 0 },
    c: { type: Number, default: 0 }
  },
  { _id: false }
);

const BottleSchema = new Schema(
  {
    wine: { type: WineSchema, default: () => ({}) },
    location: { type: LocationSchema, default: () => ({}) },
    wineGroupId: { type: Schema.Types.ObjectId, default: null, index: true },
    slot: { type: SlotSchema, default: null },
    drunkAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// one bottle per slot
BottleSchema.index(
  { 'slot.closet': 1, 'slot.shelf': 1, 'slot.d': 1, 'slot.r': 1, 'slot.c': 1 },
  { unique: true, partialFilterExpression: { 'slot.closet': { $exists: true } } }
);
BottleSchema.index({ drunkAt: 1 });

export const Closet = mongoose.model('Closet', ClosetSchema);
export const Bottle = mongoose.model('Bottle', BottleSchema);
