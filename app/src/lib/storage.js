import { supabase } from './supabase.js';

/**
 * Uploads for photos, GPX tracks and booking confirmations.
 *
 * Two buckets, chosen by what the file is:
 *   trip-media  public   photos, covers, GPX  -> plain URLs, work offline once cached
 *   trip-docs   private  receipts, tickets    -> short-lived signed URLs only
 *
 * A booking confirmation usually carries a name, a reference and sometimes the
 * last digits of a card. Those do not belong in a public bucket just because
 * it is more convenient to link to.
 */

export const MEDIA = 'trip-media';
export const DOCS = 'trip-docs';

/** Where a given kind of file belongs. */
export function bucketFor(kind) {
  return kind === 'receipt' || kind === 'doc' ? DOCS : MEDIA;
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;      // matches the bucket limit

/**
 * Shrink a photo before it leaves the phone.
 *
 * A modern phone camera produces 3-6 MB per shot. Uploading that raw would eat
 * the free tier, and worse, every viewer would re-download it on a mountain
 * road. 1600px on the long edge is plenty for a full-width photo on any screen
 * these three will actually use.
 */
export function shrinkImage(file, maxEdge = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h) return reject(new Error('that image has no dimensions'));

      // Already small enough and already a JPEG: leave it alone. Re-encoding
      // an image that needs no resize throws away quality for nothing, and on
      // an already-compressed JPEG it usually makes the file BIGGER.
      if (Math.max(w, h) <= maxEdge && file.type === 'image/jpeg') {
        return resolve(file);
      }

      const scale = Math.min(1, maxEdge / Math.max(w, h));
      const cw = Math.round(w * scale), ch = Math.round(h * scale);
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, cw, ch);
      c.toBlob(
        b => {
          if (!b) return reject(new Error('could not re-encode that image'));
          // If our version is somehow larger than what we were given, keep
          // theirs. Uploading a bigger file than the user picked is never right.
          resolve(b.size < file.size ? b : file);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read that file as an image')); };
    img.src = url;
  });
}

const safeName = (name) =>
  (name || 'file')
    .replace(/[^\w.\-]+/g, '-')       // storage keys hate spaces and unicode
    .replace(/-+/g, '-')
    .slice(-80);

/**
 * Upload one file and record it in the files table.
 * @param {File} file
 * @param {{tripSlug:string, tripId:string, kind:string, dayId?:string, activityId?:string, uploadedBy?:string}} where
 */
export async function uploadFile(file, where) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB — the limit is 15 MB.`);
  }

  const isPhoto = where.kind === 'photo' || where.kind === 'cover';
  let body = file;
  let filename = file.name;

  if (isPhoto) {
    if (!/^image\//.test(file.type)) throw new Error(`${file.name} is not an image.`);
    body = await shrinkImage(file, where.kind === 'cover' ? 2000 : 1600);
    // shrinkImage may hand back the original untouched, so name the file after
    // what we are actually uploading rather than assuming it re-encoded.
    if (body !== file) filename = filename.replace(/\.[^.]+$/, '') + '.jpg';
  }
  const contentType = body.type || file.type || 'application/octet-stream';

  const bucket = bucketFor(where.kind);
  const folder = where.activityId ? `activities/${where.activityId}`
    : where.dayId ? `days/${where.dayId}`
    : where.kind === 'cover' ? 'cover'
    : 'trip';
  const path = `${where.tripSlug}/${folder}/${crypto.randomUUID()}-${safeName(filename)}`;

  const up = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: false
  });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);

  const row = {
    trip_id: where.tripId,
    day_id: where.dayId ?? null,
    activity_id: where.activityId ?? null,
    kind: where.kind,
    bucket,
    storage_path: path,
    filename,
    bytes: body.size ?? file.size,
    uploaded_by: where.uploadedBy ?? null
  };
  const { data, error } = await supabase.from('files').insert(row).select().single();
  if (error) {
    // Do not leave an orphan object behind if the row could not be written.
    await supabase.storage.from(bucket).remove([path]).catch(() => {});
    throw error;
  }
  return data;
}

export async function listFiles(tripId) {
  const { data, error } = await supabase
    .from('files').select('*').eq('trip_id', tripId).order('created_at');
  if (error) throw error;
  return data;
}

export async function removeFile(row) {
  const { error } = await supabase.from('files').delete().eq('id', row.id);
  if (error) throw error;
  // Storage is cleaned up after the row, so a failure here leaves a stray
  // object rather than a broken thumbnail pointing at nothing.
  const r = await supabase.storage.from(row.bucket).remove([row.storage_path]);
  if (r.error) console.error('file row deleted but the object remains:', r.error);
}

/** Public bucket: a plain URL, cacheable and offline-friendly. */
export function publicUrl(row) {
  const { data } = supabase.storage.from(row.bucket).getPublicUrl(row.storage_path);
  return data.publicUrl;
}

/** Private bucket: a short-lived signed URL, minted on demand. */
export async function signedUrl(row, seconds = 300) {
  const { data, error } = await supabase.storage
    .from(row.bucket).createSignedUrl(row.storage_path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export function prettyBytes(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}
