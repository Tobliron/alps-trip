import { NS } from './config.js';

/**
 * UI strings, English and Hebrew.
 *
 * Only interface text lives here. Anything the three of you type — day titles,
 * notes, activity names, place names — is shown exactly as entered and never
 * translated, because a trip written in one language should not be mangled by
 * a toggle meant for buttons and labels.
 */

const en = {
  'app.tagline': 'Trip Planning',
  'app.loading': 'Loading…',
  'app.offline': 'offline — cached copy',
  'app.error.title': "Couldn't load the trip",
  'app.error.hint': 'If the database migrations have not been run yet, run supabase/RUN_THIS.sql in the Supabase SQL editor.',
  'app.noTrips.title': 'No trips yet',
  'app.noTrips.body': 'Run the seed migration, or unlock editing to create one.',
  'app.countdown': '{n} days until the trip',
  'app.countdown.one': '{n} day until the trip',
  'app.today': 'Today',
  'app.today.open': 'open today below',
  'app.sleeping': 'sleeping',

  'edit.locked': 'Edit',
  'edit.unlocked': 'Editing · Done',
  'edit.title': 'Unlock editing',
  'edit.blurb': 'Everyone can read the trip. Changing it needs the group password.',
  'edit.who': 'Who are you?',
  'edit.whoOther': 'or type a name',
  'edit.whoRequired': 'Pick who you are, so changes show who made them.',
  'edit.password': 'Group password',
  'edit.unlock': 'Unlock',
  'edit.checking': 'Checking…',
  'edit.cancel': 'Cancel',
  'edit.wrongPassword': "That password didn't work.",
  'edit.tipLocked': 'Unlock editing with the group password',
  'edit.tipUnlocked': 'Editing is on — click to lock',

  'day.empty': 'Nothing planned yet.',
  'day.addActivity': '+ Add activity',
  'day.addTitle': 'Add a title',

  'act.edit': 'edit',
  'act.drag': 'drag',
  'act.booked': 'Booked',
  'act.notBooked': 'Not booked',
  'kind.hike': 'Hike', 'kind.flight': 'Flight', 'kind.plan': 'Plan', 'kind.holiday': 'Holiday',
  'kind.booking': 'To book', 'kind.drive': 'Drive', 'kind.food': 'Food', 'kind.rest': 'Rest',
  'kind.custom': 'Custom',

  'backlog.title': 'Not yet on a day',
  'backlog.hintEditing': 'Bookings and to-dos without a date. Drag one onto a day to schedule it.',
  'backlog.hintLocked': 'Bookings and to-dos without a date. Unlock editing to drag them onto days.',
  'backlog.empty': 'Nothing outstanding — everything is on a day.',
  'backlog.add': '+ Add to backlog',

  'editor.title': 'Edit activity',
  'editor.field.title': 'Title', 'editor.field.type': 'Type', 'editor.field.start': 'Start',
  'editor.field.minutes': 'Minutes', 'editor.walk': 'The walk', 'editor.field.km': 'Distance km',
  'editor.field.ascent': 'Ascent m', 'editor.field.descent': 'Descent m',
  'editor.field.difficulty': 'Difficulty', 'editor.field.map': 'Map link',
  'editor.getting': 'Getting there', 'editor.field.trailhead': 'Trailhead',
  'editor.field.parking': 'Parking', 'editor.field.transport': 'Transport',
  'editor.onday': 'On the day', 'editor.field.food': 'Food and water',
  'editor.field.rain': 'Rain / backup plan', 'editor.field.notes': 'Notes',
  'editor.booking': 'Needs booking or paying', 'editor.field.status': 'Status',
  'editor.field.due': 'Due', 'editor.field.cost': 'Cost', 'editor.field.ref': 'Reference',
  'editor.field.url': 'Booking link', 'editor.files': 'Files',
  'editor.filesHint': 'Photos and GPX are public. Confirmations go in the private bucket and open through a short-lived link.',
  'editor.save': 'Save', 'editor.saving': 'Saving…', 'editor.delete': 'Delete',
  'status.todo': 'Not booked', 'status.pending': 'Waiting on them', 'status.done': 'Booked',

  'files.photo': 'Photo', 'files.gpx': 'GPX track', 'files.receipt': 'Confirmation', 'files.doc': 'Document',
  'files.uploading': 'uploading {name}…',

  'loc.set': 'set location', 'loc.clear': 'clear',
  'loc.blurb': 'Used for the map and the weather forecast. Nothing is guessed — pick the right match, or leave it empty.',
  'loc.placeholder': 'place name', 'loc.lookup': 'Look up',
  'loc.none': 'Nothing found for that name — try a nearby town.',

  'wx.from': 'forecast from {date}',
  'wx.noLocation': 'no location set — no forecast',

  'map.title': 'Map',
  'map.placed': '{n} of {total} days placed',
  'map.none': 'No days have coordinates yet — set one on a day to put it on the map.',

  'dash.title': 'Dashboard',
  'dash.days': 'days', 'dash.daysAllPlanned': 'all have something planned',
  'dash.daysEmpty': '{n} with nothing planned',
  'dash.booked': 'booked', 'dash.outstanding': '{n} still outstanding',
  'dash.onFoot': 'on foot', 'dash.ascent': 'ascent',
  'dash.noDistances': 'no distances filled in yet', 'dash.noAscent': 'no ascent filled in yet',
  'dash.fromN': 'from {a} of {b} activities',
  'dash.budget': 'budget pp', 'dash.spent': 'spent €{n} so far', 'dash.noSpend': 'nothing recorded as spent',
  'dash.onMap': 'on the map', 'dash.photos': '{n} photos uploaded',
  'dash.untilLine': '{n} days until {trip}. {m} things still to schedule.',

  'tab.overview': 'Overview', 'tab.days': 'Days', 'tab.map': 'Map', 'tab.budget': 'Budget',
  'tab.packing': 'Packing', 'tab.notes': 'Notes', 'tab.log': 'Activity', 'tab.backup': 'Backup',

  'cd.until': 'Counting down to',
  'cd.days': 'days', 'cd.hours': 'hours', 'cd.minutes': 'minutes', 'cd.seconds': 'seconds',

  'search.placeholder': 'Search the trip…',
  'search.none': 'Nothing matches “{q}”.',

  'budget.title': 'Budget',
  'budget.blurb': 'Per person, in euro. Estimated is what you planned; actual is what it really cost.',
  'budget.item': 'Item', 'budget.est': 'Estimated', 'budget.actual': 'Actual', 'budget.note': 'Note',
  'budget.totalPP': 'Total per person', 'budget.totalGroup': 'Trip total for {n} people',
  'budget.add': '+ Add budget line',

  'pack.title': 'Packing',
  'pack.blurb': 'Hut essentials matter most — rifugios require a sleeping bag liner and many are cash-only.',
  'pack.count': '{n} of {total} packed',
  'pack.add': '+ Add item',

  'notes.title': 'Notes',
  'notes.blurb': 'Shared with the group — confirmation numbers, restaurant tips, who owes what.',
  'notes.placeholder': 'Write a note for the group…',
  'notes.post': 'Post note', 'notes.posting': 'Posting…', 'notes.delete': 'delete',
  'notes.empty': 'No notes yet.',
  'notes.lockedHint': 'Unlock editing to add a note.',
  'notes.justNow': 'just now', 'notes.minsAgo': '{n}m ago', 'notes.hoursAgo': '{n}h ago',

  'log.title': 'Activity',
  'log.blurb': 'Who changed what, newest first. Names are self-declared — a record for the three of you, not a security log.',
  'log.empty': 'Nothing recorded yet.',

  'data.title': 'Backup',
  'data.blurb': 'A copy of this trip as one JSON file. It mirrors the database exactly, so importing it restores the trip rather than duplicating it.',
  'data.export': '⬇ Export trip JSON', 'data.exporting': 'Exporting…',
  'data.import': '⬆ Restore from file', 'data.importing': 'Importing…',
  'data.verify': 'Verify round-trip', 'data.verifying': 'Checking…',
  'data.lockedHint': 'Unlock editing to restore from a file.'
};

const he = {
  'app.tagline': 'תכנון טיולים',
  'app.loading': 'טוען…',
  'app.offline': 'לא מקוון — עותק שמור',
  'app.error.title': 'לא הצלחנו לטעון את הטיול',
  'app.error.hint': 'אם עדיין לא הרצתם את המיגרציות, הריצו את supabase/RUN_THIS.sql בעורך ה-SQL של Supabase.',
  'app.noTrips.title': 'אין עדיין טיולים',
  'app.noTrips.body': 'הריצו את מיגרציית הזריעה, או פתחו עריכה כדי ליצור טיול.',
  'app.countdown': 'עוד {n} ימים לטיול',
  'app.countdown.one': 'עוד יום אחד לטיול',
  'app.today': 'היום',
  'app.today.open': 'פתחו את היום למטה',
  'app.sleeping': 'לינה',

  'edit.locked': 'עריכה',
  'edit.unlocked': 'במצב עריכה · סיום',
  'edit.title': 'פתיחת עריכה',
  'edit.blurb': 'כולם יכולים לקרוא את הטיול. כדי לשנות צריך את סיסמת הקבוצה.',
  'edit.who': 'מי אתם?',
  'edit.whoOther': 'או הקלידו שם',
  'edit.whoRequired': 'בחרו מי אתם, כדי שהשינויים יראו מי ביצע אותם.',
  'edit.password': 'סיסמת הקבוצה',
  'edit.unlock': 'פתחו',
  'edit.checking': 'בודק…',
  'edit.cancel': 'ביטול',
  'edit.wrongPassword': 'הסיסמה הזו לא עבדה.',
  'edit.tipLocked': 'פתחו עריכה עם סיסמת הקבוצה',
  'edit.tipUnlocked': 'מצב עריכה פעיל — לחצו כדי לנעול',

  'day.empty': 'עדיין לא תוכנן כלום.',
  'day.addActivity': '+ הוספת פעילות',
  'day.addTitle': 'הוסיפו כותרת',

  'act.edit': 'עריכה',
  'act.drag': 'גרירה',
  'act.booked': 'הוזמן',
  'act.notBooked': 'לא הוזמן',
  'kind.hike': 'טיול רגלי', 'kind.flight': 'טיסה', 'kind.plan': 'תוכנית', 'kind.holiday': 'חג',
  'kind.booking': 'להזמין', 'kind.drive': 'נסיעה', 'kind.food': 'אוכל', 'kind.rest': 'מנוחה',
  'kind.custom': 'אחר',

  'backlog.title': 'עדיין לא משויך ליום',
  'backlog.hintEditing': 'הזמנות ומשימות בלי תאריך. גררו אחת ליום כדי לשבץ אותה.',
  'backlog.hintLocked': 'הזמנות ומשימות בלי תאריך. פתחו עריכה כדי לגרור אותן לימים.',
  'backlog.empty': 'אין משימות פתוחות — הכול משובץ.',
  'backlog.add': '+ הוספה לרשימה',

  'editor.title': 'עריכת פעילות',
  'editor.field.title': 'כותרת', 'editor.field.type': 'סוג', 'editor.field.start': 'שעת התחלה',
  'editor.field.minutes': 'דקות', 'editor.walk': 'המסלול', 'editor.field.km': 'מרחק בק״מ',
  'editor.field.ascent': 'עלייה במטרים', 'editor.field.descent': 'ירידה במטרים',
  'editor.field.difficulty': 'רמת קושי', 'editor.field.map': 'קישור למפה',
  'editor.getting': 'איך מגיעים', 'editor.field.trailhead': 'תחילת המסלול',
  'editor.field.parking': 'חניה', 'editor.field.transport': 'תחבורה',
  'editor.onday': 'ביום עצמו', 'editor.field.food': 'אוכל ומים',
  'editor.field.rain': 'תוכנית לגשם', 'editor.field.notes': 'הערות',
  'editor.booking': 'דורש הזמנה או תשלום', 'editor.field.status': 'סטטוס',
  'editor.field.due': 'עד מתי', 'editor.field.cost': 'עלות', 'editor.field.ref': 'מספר אישור',
  'editor.field.url': 'קישור להזמנה', 'editor.files': 'קבצים',
  'editor.filesHint': 'תמונות ו-GPX ציבוריים. אישורי הזמנה נשמרים בנפרד ונפתחים בקישור זמני.',
  'editor.save': 'שמירה', 'editor.saving': 'שומר…', 'editor.delete': 'מחיקה',
  'status.todo': 'לא הוזמן', 'status.pending': 'ממתין לתשובה', 'status.done': 'הוזמן',

  'files.photo': 'תמונה', 'files.gpx': 'מסלול GPX', 'files.receipt': 'אישור הזמנה', 'files.doc': 'מסמך',
  'files.uploading': 'מעלה את {name}…',

  'loc.set': 'קביעת מיקום', 'loc.clear': 'ניקוי',
  'loc.blurb': 'משמש למפה ולתחזית מזג האוויר. שום דבר לא מנוחש — בחרו את ההתאמה הנכונה, או השאירו ריק.',
  'loc.placeholder': 'שם מקום', 'loc.lookup': 'חיפוש',
  'loc.none': 'לא נמצא מקום בשם הזה — נסו עיר סמוכה.',

  'wx.from': 'תחזית החל מ-{date}',
  'wx.noLocation': 'לא נקבע מיקום — אין תחזית',

  'map.title': 'מפה',
  'map.placed': '{n} מתוך {total} ימים ממוקמים',
  'map.none': 'לאף יום אין עדיין קואורדינטות — קבעו מיקום ליום כדי שיופיע במפה.',

  'dash.title': 'לוח מחוונים',
  'dash.days': 'ימים', 'dash.daysAllPlanned': 'לכולם יש תוכנית',
  'dash.daysEmpty': '{n} בלי תוכנית',
  'dash.booked': 'הוזמנו', 'dash.outstanding': '{n} עדיין פתוחות',
  'dash.onFoot': 'ברגל', 'dash.ascent': 'עלייה מצטברת',
  'dash.noDistances': 'עדיין לא הוזנו מרחקים', 'dash.noAscent': 'עדיין לא הוזנו נתוני עלייה',
  'dash.fromN': 'מתוך {a} מ-{b} פעילויות',
  'dash.budget': 'תקציב לאדם', 'dash.spent': 'הוצאו {n}€ עד כה', 'dash.noSpend': 'לא נרשמו הוצאות',
  'dash.onMap': 'על המפה', 'dash.photos': '{n} תמונות הועלו',
  'dash.untilLine': 'עוד {n} ימים ל{trip}. {m} דברים עדיין לשבץ.',

  'tab.overview': 'סקירה', 'tab.days': 'ימים', 'tab.map': 'מפה', 'tab.budget': 'תקציב',
  'tab.packing': 'ציוד', 'tab.notes': 'הערות', 'tab.log': 'פעילות', 'tab.backup': 'גיבוי',

  'cd.until': 'הספירה לאחור ל',
  'cd.days': 'ימים', 'cd.hours': 'שעות', 'cd.minutes': 'דקות', 'cd.seconds': 'שניות',

  'search.placeholder': 'חיפוש בטיול…',
  'search.none': 'אין תוצאות ל״{q}״.',

  'budget.title': 'תקציב',
  'budget.blurb': 'לאדם, ביורו. משוער הוא מה שתכננתם; בפועל הוא מה שזה באמת עלה.',
  'budget.item': 'פריט', 'budget.est': 'משוער', 'budget.actual': 'בפועל', 'budget.note': 'הערה',
  'budget.totalPP': 'סה״כ לאדם', 'budget.totalGroup': 'סה״כ לטיול עבור {n} אנשים',
  'budget.add': '+ הוספת שורה',

  'pack.title': 'ציוד',
  'pack.blurb': 'הציוד לבקתות הוא הקריטי — הרפוג׳ים דורשים שק שינה פנימי ורבים מהם מזומן בלבד.',
  'pack.count': '{n} מתוך {total} ארוזים',
  'pack.add': '+ הוספת פריט',

  'notes.title': 'הערות',
  'notes.blurb': 'משותף לקבוצה — מספרי אישור, המלצות מסעדות, מי חייב למי.',
  'notes.placeholder': 'כתבו הערה לקבוצה…',
  'notes.post': 'פרסום', 'notes.posting': 'מפרסם…', 'notes.delete': 'מחיקה',
  'notes.empty': 'עדיין אין הערות.',
  'notes.lockedHint': 'פתחו עריכה כדי להוסיף הערה.',
  'notes.justNow': 'הרגע', 'notes.minsAgo': 'לפני {n} דק׳', 'notes.hoursAgo': 'לפני {n} שע׳',

  'log.title': 'פעילות',
  'log.blurb': 'מי שינה מה, מהחדש לישן. השמות מוצהרים עצמאית — תיעוד עבורכם, לא יומן אבטחה.',
  'log.empty': 'עדיין לא תועד כלום.',

  'data.title': 'גיבוי',
  'data.blurb': 'עותק של הטיול בקובץ JSON אחד. הוא משקף את מסד הנתונים במדויק, כך שייבוא משחזר את הטיול ולא משכפל אותו.',
  'data.export': '⬇ ייצוא הטיול', 'data.exporting': 'מייצא…',
  'data.import': '⬆ שחזור מקובץ', 'data.importing': 'מייבא…',
  'data.verify': 'בדיקת הלוך ושוב', 'data.verifying': 'בודק…',
  'data.lockedHint': 'פתחו עריכה כדי לשחזר מקובץ.'
};

const DICTS = { en, he };

export const i18n = $state({
  locale: readStored()
});

function readStored() {
  try {
    const v = localStorage.getItem(NS + 'locale');
    return v === 'he' || v === 'en' ? v : 'en';
  } catch { return 'en'; }
}

export function setLocale(next) {
  i18n.locale = next === 'he' ? 'he' : 'en';
  try { localStorage.setItem(NS + 'locale', i18n.locale); } catch { /* private window */ }
  applyDirection();
}

/** The whole document flips, so Leaflet, dialogs and form controls follow. */
export function applyDirection() {
  const rtl = i18n.locale === 'he';
  document.documentElement.lang = i18n.locale;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
}

/**
 * Look up a string. Missing keys fall back to English and then to the key
 * itself, so a gap shows up as readable English rather than a blank button.
 */
export function t(key, vars) {
  const dict = DICTS[i18n.locale] ?? en;
  let s = dict[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/** Dates and numbers should read naturally in whichever language is on. */
export function locale() {
  return i18n.locale === 'he' ? 'he-IL' : 'en-GB';
}

export function fmtDate(iso, opts) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString(locale(), opts);
}

export function fmtNumber(n) {
  return Number(n).toLocaleString(locale());
}
