<script>
  import { app } from './state.svelte.js';

  let { activity, onedit } = $props();

  const KIND_LABEL = {
    hike: 'Hike', flight: 'Flight', plan: 'Plan', holiday: 'Holiday',
    booking: 'To book', drive: 'Drive', food: 'Food', rest: 'Rest', custom: 'Custom'
  };

  // Only render a stat if there is a real value. An empty seed should look
  // empty, not like a row of zeroes.
  let stats = $derived([
    activity.distance_km != null ? `${activity.distance_km} km` : null,
    activity.ascent_m    != null ? `+${activity.ascent_m} m`    : null,
    activity.duration_min != null ? `${Math.round(activity.duration_min / 60)} h` : null,
    activity.difficulty || null
  ].filter(Boolean));

  let booking = $derived(activity.booking ?? null);
</script>

<article class="act" class:booking={activity.kind === 'booking'}>
  <div class="head">
    {#if activity.start_time}
      <span class="time mono">{activity.start_time.slice(0, 5)}</span>
    {/if}
    <h4>{activity.title}</h4>
    {#if activity.kind && KIND_LABEL[activity.kind]}
      <span class="pill {activity.kind === 'booking' ? 'hot' : 'ok'}">{KIND_LABEL[activity.kind]}</span>
    {/if}
  </div>

  {#if stats.length}
    <div class="stats mono">{stats.join(' · ')}</div>
  {/if}

  {#if booking?.needed}
    <div class="booking-line">
      <span class="pill {booking.status === 'done' ? 'ok' : 'warn'}">
        {booking.status === 'done' ? 'Booked' : 'Not booked'}
      </span>
      {#if booking.due}<span class="due mono">{booking.due}</span>{/if}
      {#if booking.url}
        <a href={booking.url} target="_blank" rel="noopener noreferrer">
          {booking.linkLabel || 'open'} ↗
        </a>
      {/if}
    </div>
  {/if}

  {#if activity.notes}
    <p class="notes">{activity.notes}</p>
  {/if}

  {#if app.editing}
    <div class="edit-row">
      <span class="grip mono" aria-hidden="true">⠿ drag</span>
      <button class="linkish" onclick={() => onedit?.(activity)}>edit</button>
    </div>
  {/if}
</article>

<style>
  .act {
    background: #fff; border: 1px solid var(--line);
    border-radius: 10px; padding: 12px 14px;
  }
  .act.booking { border-style: dashed; }
  .head { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
  .head h4 { font-family: var(--font-display); font-size: 16px; font-weight: 600; }
  .time { font-size: 12px; color: var(--rock-soft); }
  .stats { font-size: 11.5px; color: var(--rock-soft); margin-top: 4px; }
  .booking-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 7px; font-size: 12.5px; }
  .booking-line a { color: var(--pine); }
  .due { font-size: 11px; color: var(--glow); }
  .notes { font-size: 13px; color: var(--rock-soft); margin-top: 7px; white-space: pre-wrap; }
  .edit-row { margin-top: 8px; font-size: 12.5px; display: flex; align-items: center; gap: 12px; }
  .grip { font-size: 11px; color: var(--rock-soft); cursor: grab; }
  /* While editing the whole card is a drag handle, so make that legible. */
  :global(.acts.dropzone) .act { cursor: grab; }
  :global(.acts.dropzone) .act:active { cursor: grabbing; }
</style>
