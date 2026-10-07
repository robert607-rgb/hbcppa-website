export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function text(value, name, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new ApiError(400, `Check ${name}.`);
  }
  return value.trim();
}
export function validDate(value, optional = false) {
  if (optional && value === '') return '';
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) throw new ApiError(400, 'Enter a valid date.');
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ApiError(400, 'Enter a valid date.');
  return value;
}
export function validateItems(kind, input, projectUrl) {
  if (!Array.isArray(input) || input.length > 500) throw new ApiError(400, 'Too many records.');
  const ids = new Set();
  return input.map((item) => {
    if (!item || typeof item !== 'object') throw new ApiError(400, 'Invalid record.');
    const id = text(item.id, 'record ID', 80, true);
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) throw new ApiError(400, 'Duplicate or invalid record ID.');
    ids.add(id);
    if (kind === 'officers') {
      if (!['officer', 'committee'].includes(item.group)) throw new ApiError(400, 'Choose officers or committee.');
      if (!Number.isInteger(item.order) || item.order < 0 || item.order > 999) throw new ApiError(400, 'Enter a display order from 0 to 999.');
      return {id, group: item.group, order: item.order,
        name: text(item.name, 'name', 160, true), role: text(item.role ?? '', 'role', 160, item.group === 'officer'),
        club: text(item.club ?? '', 'club', 160)};
    }
    if (kind === 'fixtures') {
      const date = validDate(item.date);
      const time = text(item.time, 'start time', 5, true);
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new ApiError(400, 'Enter a valid start time.');
      if (!['Indoor', 'Outdoor'].includes(item.type)) throw new ApiError(400, 'Choose an indoor or outdoor fixture.');
      return {id, date, time, type: item.type,
        opponent: text(item.opponent, 'opponent', 120, true), venue: text(item.venue, 'venue', 160, true),
        rinks: text(item.rinks, 'rinks and format', 120, true), dress: text(item.dress, 'dress code', 80, true),
        note: text(item.note ?? '', 'match notes', 500), result: text(item.result ?? '', 'result', 120)};
    }
    if (!['published', 'draft'].includes(item.status)) throw new ApiError(400, 'Choose draft or published.');
    const image = text(item.image ?? '', 'photo', 500);
    if (image && !image.startsWith(`${projectUrl}/storage/v1/object/public/hbcppa-news/`)) throw new ApiError(400, 'Upload the photo using this editor.');
    if (image && (!/^https:\/\//.test(image) || /[<>"\s]/.test(image))) throw new ApiError(400, 'Invalid photo URL.');
    return {id, title: text(item.title, 'news title', 180, true), body: text(item.body, 'news story', 20000, true),
      date: validDate(item.date ?? '', true), status: item.status, image,
      imageAlt: text(item.imageAlt ?? '', 'photo description', 250),
      kind: ['anniversary', 'archive'].includes(item.kind) ? item.kind : 'standard'};
  });
}
export function imageExtension(bytes, type) {
  if (bytes.length < 12 || bytes.length > 5242880) throw new ApiError(400, 'Choose a photo up to 5 MB.');
  if (type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (type === 'image/png' && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return 'png';
  if (type === 'image/webp' && new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP') return 'webp';
  throw new ApiError(400, 'Choose a JPEG, PNG or WebP photo.');
}
