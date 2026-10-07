export const API = 'https://ilowfptzxuxfcyubmlhz.supabase.co/functions/v1/hbcppa-content';
export function el(tag, attributes = {}, content = '') {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (content) node.textContent = content;
  return node;
}
export function dateLabel(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London'}).format(new Date(`${date}T12:00:00Z`));
}
const dayLabel = date => new Intl.DateTimeFormat('en-GB', {weekday: 'long', timeZone: 'Europe/London'}).format(new Date(`${date}T12:00:00Z`));
function timeLabel(time) {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}.${String(minute).padStart(2, '0')}${hour < 12 ? 'am' : 'pm'}`;
}
export function renderFixtures(items, container, jumps) {
  const groups = new Map();
  for (const item of [...items].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))) {
    const key = `${item.type} ${item.date.slice(0,4)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const fragment = document.createDocumentFragment();
  if (jumps) jumps.replaceChildren();
  for (const [name, rows] of groups) {
    const id = name.toLowerCase().replace(' ', '-');
    const titleId = `${id}-title`;
    const section = el('section', {class: 'fixture-season', id, 'aria-labelledby': titleId});
    const heading = el('div', {class: 'fixture-heading'});
    heading.append(el('h2', {id: titleId}, `${rows[0].type} fixtures ${rows[0].date.slice(0,4)}`), el('p', {}, `${rows.length} friendly ${rows.length === 1 ? 'match' : 'matches'}`));
    section.append(heading);
    const table = el('table', {class: 'fixture-table', role: 'table'});
    table.append(el('caption', {}, 'All times are local. Results are shown when published by the association.'));
    const thead = el('thead', {role: 'rowgroup'}), headerRow = el('tr', {role: 'row'});
    const labels = ['Opponent','Day & date','Venue','Time','Rinks','Dress','Result'];
    labels.forEach((label, i) => headerRow.append(el('th', {scope: 'col', id: `${id}-col-${i}`, role: 'columnheader'}, label)));
    thead.append(headerRow); table.append(thead);
    const tbody = el('tbody', {role: 'rowgroup'});
    for (const item of rows) {
      const row = el('tr', {role: 'row'}), rowId = `${id}-match-${item.id}`;
      row.append(el('th', {scope: 'row', role: 'rowheader', id: rowId}, item.opponent));
      for (let i = 1; i < labels.length; i++) {
        const td = el('td', {role: 'cell', headers: `${rowId} ${id}-col-${i}`});
        td.append(el('span', {class: 'fixture-label', 'aria-hidden': 'true'}, labels[i]));
        if (i === 1) td.append(el('span', {class: 'fixture-day'}, dayLabel(item.date)), el('time', {datetime: item.date}, dateLabel(item.date)));
        if (i === 2) td.append(document.createTextNode(item.venue));
        if (i === 3) {
          td.append(el('time', {datetime: item.time}, timeLabel(item.time)));
          if (item.note) td.append(el('span', {class: 'fixture-note'}, item.note));
        }
        if (i === 4) td.append(document.createTextNode(item.rinks));
        if (i === 5) td.append(el('span', {class: 'fixture-dress'}, item.dress));
        if (i === 6) td.append(el('span', {class: `fixture-result${item.result ? ' has-result' : ''}`}, item.result || 'Not yet published'));
        row.append(td);
      }
      tbody.append(row);
    }
    table.append(tbody); section.append(table); fragment.append(section);
    if (jumps) jumps.append(el('a', {class: `button${jumps.children.length ? ' secondary' : ''}`, href: `#${id}`}, name));
  }
  if (!items.length) fragment.append(el('p', {}, 'No fixtures are currently listed. Please contact the joint match secretaries for match enquiries.'));
  container.replaceChildren(fragment);
}
function bodyParagraphs(body) {
  const fragment = document.createDocumentFragment();
  for (const paragraph of body.split(/\n\s*\n/)) {
    const p = el('p');
    paragraph.split('\n').forEach((line,i) => {if(i) p.append(el('br')); p.append(document.createTextNode(line));});
    fragment.append(p);
  }
  return fragment;
}
export function renderNews(items, container, preview = false) {
  const fragment = document.createDocumentFragment();
  const stories = [...items].filter(n => preview || n.status === 'published').sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  for (const item of stories) {
    const section = el('article', {class: `news-story${item.kind === 'anniversary' ? ' news-feature' : ''}`, id: preview ? 'news-preview-story' : item.id});
    if (item.kind === 'anniversary') {
      const mark = el('div', {class: 'anniversary-mark', 'aria-hidden': 'true'}, '75');
      mark.append(el('span', {}, 'years in 2028')); section.append(mark);
    }
    const copy = el('div', {class: 'news-story-copy'});
    if (item.date) copy.append(el('time', {class: 'role', datetime: item.date}, dateLabel(item.date)));
    else if (item.kind === 'archive') copy.append(el('p', {class: 'role'}, '2026 event archive'));
    else if (item.kind === 'anniversary') copy.append(el('p', {class: 'role'}, 'Looking ahead to 2028'));
    copy.append(el('h2', {}, item.title));
    if (item.image && item.image.startsWith('https://ilowfptzxuxfcyubmlhz.supabase.co/storage/v1/object/public/hbcppa-news/')) {
      copy.append(el('img', {src: item.image, alt: item.imageAlt || item.title, loading: 'lazy', class: 'news-photo'}));
    }
    copy.append(bodyParagraphs(item.body)); section.append(copy); fragment.append(section);
  }
  if (!stories.length) fragment.append(el('p', {}, 'No news stories have been published yet.'));
  container.replaceChildren(fragment);
}
export async function request(path, {token, method = 'GET', body, raw = false} = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = raw ? body.type : 'application/json';
  let response;
  try {
    response = await fetch(`${API}/${path}`, {method, headers, cache: 'no-store', signal: AbortSignal.timeout(30000), body: body === undefined ? undefined : raw ? body : JSON.stringify(body)});
  } catch { throw new Error('Could not connect. Your changes are still in the form. Please try again.'); }
  const data = await response.json();
  if (!response.ok) {const error = new Error(data.error || 'Please try again.'); error.status = response.status; throw error;}
  return data;
}
