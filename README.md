# Botl

Botl keeps track of the bottles in your wine closets. You describe each closet once, the way it really looks (grid, alternating, staggered and standing shelves), and every bottle gets a place with a short code like `D2-4`. Bottles that are not in a closet live in the **Cellar**. Everything moves by drag and drop, on the web and on a phone.

Built from the approved mockup (v0.11) with React (Vite), Node/Express and MongoDB (Atlas), deployed on Render.

## Run it locally

You need Node 22.9 or newer and a MongoDB: a local `mongod`, or your Atlas cluster.

```bash
cp .env.example .env     # put your MONGODB_URI in it
npm install
npm run dev              # API on :3000, app on http://localhost:5173
```

`npm test` runs the API tests against `MONGODB_TEST_URI` (default `mongodb://127.0.0.1:27017/botl_test`; that database is dropped first).

For a production-style run: `npm run build && npm start`, then open http://localhost:3000.

## MongoDB Atlas

1. Create a free M0 cluster.
2. Database Access: add a database user with a password.
3. Network Access: allow `0.0.0.0/0` (Render's free plan has no fixed outgoing IP).
4. Connect → Drivers: copy the connection string, fill in the password, and add the database name `botl` before the `?`:
   `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/botl?retryWrites=true&w=majority`

Indexes are created when the server starts.

## Render

1. New → Blueprint, pick this repository. Render reads `render.yaml`.
2. Fill in the two secret values when asked:
   - `MONGODB_URI`: the Atlas string from above.
   - `APP_PASSWORD`: optional. When set, the browser asks for this password (any user name) before showing Botl. Recommended, since the app has no accounts.
3. Deploy. Health check: `/healthz`.

## How it is built

```
shared/layout.js     closet geometry used by both sides: slots, pyramid rows, widths, facing, position codes
server/index.js      Express app: optional password, /api, serves the built client
server/models.js     Closet (shelves top to bottom) and Bottle (wine, location, slot)
server/routes/api.js state, closets, bottles, move/swap, drink
server/data/geo.js   sample country → region → appellation tree and grape list
client/src/          React app: phone layout (tabs Closet, Bottles, Layout) under 760px wide, three columns above
```

### Data model

- **Closet**: name, kind, width in bottles (0 = widest shelf), shelves top to bottom. A shelf is `grid`, `stagger` (pyramid: bottom row longest) or `stand`, with rows, slots per row, depth (1 or 2) and alternating (every other bottle neck first).
- **Bottle**: `wine` (name, producer, vintage, price, colour, drink window, grapes with %), `location` (country, region, appellation, vineyard), optional shared `winePhotoId`, and `slot` (closet, shelf, depth, row, column). No slot means the bottle is in the Cellar. Drinking a bottle sets `drunkAt` and keeps it as history. Uploaded wine photos are stored once in MongoDB and shared by copies in a batch.
- Slots are never stored; they follow from the shelf settings. A unique index keeps one bottle per slot.
- A layout change never deletes a bottle: bottles in slots that disappear go to the Cellar.

### API

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/state` | all closets and bottles in place or in the Cellar |
| GET | `/api/reference` | location tree, grapes, closet templates |
| POST | `/api/closets` | new closet, from a `template` (single, dual, rack, blank) or `shelves` |
| PATCH | `/api/closets/:id` | name, kind, width, shelves; returns how many bottles moved to the Cellar |
| DELETE | `/api/closets/:id` | delete; its bottles go to the Cellar |
| POST | `/api/bottles` | add `qty` identical bottles to the Cellar, or one bottle into a `slot` |
| PATCH | `/api/bottles/:id` | edit wine and location |
| POST | `/api/bottles/:id/quantity` | set a wine group's total bottle count; additions go to the global Cellar and removals consume cellar bottles before confirmed closet removals |
| GET | `/api/photos/:id` | retrieve an uploaded wine photo |
| POST | `/api/bottles/:id/move` | to a `slot` (swaps when taken) or to the Cellar with `slot: null` |
| POST | `/api/bottles/:id/drink` | mark as drunk |

## Not done yet

- The location list is the small sample from the mockup. The plan in the design notes is a bundled list built from EU eAmbrosia plus Wikidata.
- Magnums take a normal slot (open question from the mockup).
