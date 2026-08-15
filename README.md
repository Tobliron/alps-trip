# Cyprus & the Dolomites — Trip HQ

A single-page trip guide for 17 Sep – 10 Oct 2026. Itinerary, calendar, booking
checklist, budget, packing list and shared notes, in one HTML file with no
backend and no build step.

```
index.html      the whole site
images/         six location photos (Wikimedia Commons, CC BY-SA — credited in the footer)
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

## How saving works

Checkboxes, budget edits, custom calendar events and notes are stored in each
person's **own browser** via `localStorage`, under the `alpsTrip:` prefix. That means:

- Your ticks survive reloads and closing the tab, on that device and browser.
- The three of you do **not** see each other's edits. It's three private copies of
  the same guide.
- To share state, use **Export trip data** on the Notes tab and send the JSON;
  the other person uses **Import backup**.
- In a private/incognito window the browser blocks storage. The page detects this
  and shows a warning banner rather than silently losing your work.

Clearing your browser's site data for the domain will wipe your ticks, so export a
JSON backup before doing that — and before the trip, when the checklist matters most.

## Photo credits

All six photos come from Wikimedia Commons under CC BY-SA 3.0 or 4.0 and are
credited to their photographers in the page footer. If you swap in your own photos,
keep the credits block accurate or remove the entries you replaced.
