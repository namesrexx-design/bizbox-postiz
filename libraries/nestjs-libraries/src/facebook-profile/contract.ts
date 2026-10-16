import { createHash } from 'node:crypto';

// PR507 POSTIZ-LANE.md wire contract. This identifier is never an OAuth Page ID.
export const PROFILE_INTERNAL_ID = 'bizbox:facebook-profile:v1';
export const PROFILE_TOKEN = 'external-pc-only:no-native-publisher';
export const stable = (v: any): string => Array.isArray(v)
  ? `[${v.map(stable).join(',')}]`
  : v && typeof v === 'object'
  ? `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`
  : JSON.stringify(v);
export const digest = (v: any) => createHash('sha256').update(stable(v)).digest('hex');
export class ProfileError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
const fail = (message: string): never => { throw new ProfileError(message); };
const exact = (v: any, keys: string[]) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).sort().join() !== keys.sort().join()) fail('Unexpected profile fields');
};
const localSchedule = (at: string, timezone: string) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(at)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
export function validateBatch(b: any) {
  exact(b, ['schema', 'batchId', 'profileUrl', 'profileName', 'timezone', 'items']);
  if (b.schema !== 'bizbox.facebook-profile-batch.v1' || !/^[a-zA-Z0-9_-]{1,80}$/.test(b.batchId)) fail('Invalid profile batch');
  if (!/^https:\/\/www\.facebook\.com\/(?:[a-zA-Z0-9.]+|profile\.php\?id=\d+)$/.test(b.profileUrl)) fail('Exact Facebook profile URL required');
  if (typeof b.profileName !== 'string' || !b.profileName.trim() || b.profileName.length > 100) fail('Profile name required');
  if (typeof b.timezone !== 'string' || !b.timezone.includes('/')) fail('Explicit IANA timezone required');
  try { new Intl.DateTimeFormat('en-US', { timeZone: b.timezone }).format(); } catch { fail('IANA timezone required'); }
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 7) fail('Batch must contain 1–7 reels');
  const ids = new Set(), times = new Set();
  for (const item of b.items) {
    exact(item, ['id', 'caption', 'mediaUrl', 'mediaSha256', 'mediaBytes', 'scheduleAt', 'audience', 'aiLabel']);
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || ids.has(item.id)) fail('Unique item IDs required');
    ids.add(item.id);
    if (typeof item.caption !== 'string' || !item.caption.trim() || item.caption.length > 2200) fail('Caption required (max 2200)');
    let url: URL;
    try { url = new URL(item.mediaUrl); } catch { fail('HTTPS MP4 URL required'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.port || !url.pathname.endsWith('.mp4')) fail('HTTPS MP4 URL required');
    if (typeof item.mediaSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(item.mediaSha256) || !Number.isSafeInteger(item.mediaBytes) || item.mediaBytes < 1 || item.mediaBytes > 1024 ** 3) fail('Exact media SHA256/size required');
    const t = Date.parse(item.scheduleAt);
    if (typeof item.scheduleAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:00(?:Z|[+-]\d\d:\d\d)$/.test(item.scheduleAt) || !Number.isFinite(t)) fail('Minute precision schedule required');
    const rawDate = item.scheduleAt.slice(0, 10);
    if (new Date(`${rawDate}T00:00:00Z`).toISOString().slice(0, 10) !== rawDate || Number(item.scheduleAt.slice(11, 13)) > 23) fail('Invalid calendar date/time');
    const local = localSchedule(item.scheduleAt, b.timezone);
    for (const minutes of [-120, -90, -60, -30, 30, 60, 90, 120]) {
      if (localSchedule(new Date(t + minutes * 60e3).toISOString(), b.timezone) === local) fail('Ambiguous DST wall time');
    }
    if (times.has(t)) fail('Unique schedule times required');
    times.add(t);
    if (item.audience !== 'Public' || item.aiLabel !== true) fail('Public audience and AI label must be explicit');
  }
  return b;
}
export function parseSettings(value: any) {
  try { return typeof value === 'string' ? JSON.parse(value) : value; }
  catch { fail('Invalid saved profile settings'); }
}
export function isProfileIntegration(integration: any) {
  return integration?.internalId === PROFILE_INTERNAL_ID;
}
export function checkLane(post: any, integrationId: string) {
  const settings = parseSettings(post.settings);
  const lane = settings?.bizboxFacebookProfile;
  if (!lane) fail('Not a Facebook-profile lane entry');
  const batch = validateBatch(lane.batch);
  const item = batch.items.find((i: any) => i.id === lane.itemId);
  let image: any;
  try { image = typeof post.image === 'string' ? JSON.parse(post.image) : post.image; } catch { fail('Invalid saved media'); }
  if (lane.version !== 1 || lane.lane !== 'facebook-profile' || typeof lane.approvalId !== 'string' || !/^appr_[a-zA-Z0-9_]+$/.test(lane.approvalId) || lane.digest !== digest(batch) || !item ||
      !Array.isArray(image) || image.length !== 1 || image[0].path !== item.mediaUrl || image[0].id !== item.mediaSha256 ||
      post.integrationId !== integrationId || post.state !== 'DRAFT' || post.releaseId || post.parentPostId || post.intervalInDays ||
      post.content !== item.caption || !Number.isFinite(Date.parse(post.publishDate)) || Date.parse(post.publishDate) !== Date.parse(item.scheduleAt)) fail('Postiz Facebook-profile lane drift');
  return { settings, lane, item };
}
export function applyNativeResult(post: any, body: any, integrationId: string) {
  const { settings, lane, item } = checkLane(post, integrationId);
  exact(body, ['approvalId', 'digest', 'native']);
  const native = body.native;
  exact(native, ['aiLabel', 'audience', 'scheduleAt', 'status', 'url']);
  if (body.approvalId !== lane.approvalId || body.digest !== lane.digest || native.status !== 'scheduled' || native.scheduleAt !== item.scheduleAt || native.audience !== 'Public' || native.aiLabel !== true || typeof native.url !== 'string' || !/^https:\/\/www\.facebook\.com\/reel\/\d+\/?$/.test(native.url)) fail('Native result does not match approved lane item');
  if ((lane.native && digest(lane.native) !== digest(native)) || (post.releaseURL && post.releaseURL !== native.url)) fail('Conflicting native result: reconciliation required');
  return { settings: JSON.stringify({ ...settings, bizboxFacebookProfile: { ...lane, native } }), releaseURL: native.url };
}
