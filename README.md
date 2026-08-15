# Cyprus & the Dolomites — Trip HQ

A single-page trip guide for 17 Sep – 10 Oct 2026. Itinerary, calendar, booking
checklist, budget, packing list and shared notes, in one HTML file with no
backend and no build step.

```
index.html            the whole site
images/               six location photos (Wikimedia Commons, CC BY-SA — credited in the footer)
supabase-setup.sql    database schema + access rules; paste into Supabase → SQL Editor
```

## Publishing it to GitHub Pages

You don't need git installed for this — GitHub's web uploader is enough.

1. Sign in at [github.com](https://github.com) and create a new **public** repository,
   e.g. `alps-trip`. Don't add a README (this folder already has one).
2. On the empty repo page, click **uploading an existing file**.
3. Drag in `index.html`, `README.md`, and the whole `images` folder. Commit.
4. Go to **Settings → Pages**. Under *Source*, pick **Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
5. Wait a minute, then your site is live at
   `https://<your-username>.github.io/alps-trip/` — send that link to the other two.

The repo is also your off-machine backup: every upload is a new commit, and you
can view or restore any earlier version from the repo's **History**.

## Changing it later

Edit `index.html`, then upload the new copy to the repo (**Add file → Upload files**,
drop it in, commit). Pages redeploys within a minute or two.

The trip content lives in plain arrays near the top of the `<script>` block, so you
can edit them without touching the layout:

| What | Array |
| --- | --- |
| Calendar entries | `EVENTS` |
| Booking checklist | `BOOKINGS` — `[title, detail, due, url, linkLabel]`, the last two optional |
| Budget rows | `BUDGET` |
| Packing list | `PACKING` |
| Who appears in the name picker | `PEOPLE` |

Note that `BOOKINGS`, `BUDGET` and `PACKING` define the *rows*; the ticks and
figures against them live in Supabase. If you add or reorder rows, the saved
state is positional, so existing ticks may line up against the wrong item —
add to the end of a list rather than inserting into the middle.

## How saving and sharing works

Bookings, budget, packing, calendar events, notes and the activity feed are
**shared between all three of you**, stored in Supabase (see `supabase-setup.sql`).
Tick something and the others see it.

Each person picks a **name** the first time they open the site — that's what
labels their notes and their entries in the activity feed. It is deliberately
**not a login**: there is no password, nothing is locked, and anyone could pick
any name. It exists to answer "who wrote this", not to keep anyone out.

Each person can also add a **profile photo** via *add photo* next to their name.
The picture is cropped square and resized to 128px in the browser before it goes
anywhere, so a 3 MB phone photo is stored as roughly 9 KB. Until someone adds one
they get a coloured circle with their initial. Photos live in `trip_state` under
`avatar:<name>` keys and are fetched once per page load rather than on the
sync poll, so they don't eat data on the trail.

The `anon` key sits in `index.html` in plain sight. That is what the key is for —
it only grants what the policies in `supabase-setup.sql` allow. But combined with
those deliberately open policies it does mean **anyone who finds the URL could
read or write the trip data**. Fine for three friends and a hiking itinerary;
not fine for anything sensitive. Don't put passport numbers or card details in
the notes.

### Working offline

The page keeps a full copy in `localStorage` under the `alpsTrip:` prefix, so:

- The guide, itinerary and photos work with **no connection at all**.
- Edits made offline are saved locally and queued in an outbox that survives a
  reload; they upload by themselves when signal returns.
- The pill at the top of the page tells you which state you're in — `✓ all changes
  synced` or `⟳ N changes waiting for signal`.
- In a private/incognito window the browser blocks storage entirely. The page
  detects this and shows a warning banner rather than silently losing work.

Two people editing the same thing at once is last-write-wins — the later save
replaces the earlier one. With three people planning one trip that's very unlikely
to bite, but it's why the activity feed exists: you can see what changed.

**Export trip data** on the Notes tab still writes a JSON file. Worth doing before
the trip — it's the one copy that doesn't depend on Supabase still being there.

### Changing the names

The three names in the picker live in one place near the top of the `<script>`
block in `index.html`:

```js
const PEOPLE = ['Liron', 'Sagi', 'Buza'];
```

Edit that line to the real names. Anyone can also type their own name instead.

## Photo credits

All six photos come from Wikimedia Commons under CC BY-SA 3.0 or 4.0 and are
credited to their photographers in the page footer. If you swap in your own photos,
keep the credits block accurate or remove the entries you replaced.
