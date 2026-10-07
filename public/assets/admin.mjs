import {request, renderFixtures, renderNews, renderOfficers, el, dateLabel} from './content.mjs';
const $ = id => document.getElementById(id);
const fixtureForm = $('fixture-form'), newsForm = $('news-form'), officerForm = $('officer-form');
let token = '', state = null, dirty = false, saving = false;
try {token = sessionStorage.getItem('hbcppa-admin-session') || '';} catch {}
const formValue = (form, name) => form.elements.namedItem(name).value;
function setValue(form, name, value) {form.elements.namedItem(name).value = value ?? '';}
function sessionToken(value) {
  token = value;
  try {value ? sessionStorage.setItem('hbcppa-admin-session', value) : sessionStorage.removeItem('hbcppa-admin-session');} catch {}
}
function status(message, error = false) {
  $('editor-status').textContent = message;
  $('editor-status').classList.toggle('is-error', error);
}
function busy(value) {
  saving = value;
  for (const button of document.querySelectorAll('#admin-dashboard button')) button.disabled = value;
  for (const input of document.querySelectorAll('#admin-dashboard input, #admin-dashboard select, #admin-dashboard textarea')) input.disabled = value;
}
function signedOut() {
  $('admin-dashboard').hidden = true;
  $('admin-login').hidden = false;
  $('login-password').value = '';
}
function errorMessage(error) {
  status(error.message, true);
  if (error.status === 401) {
    sessionToken(''); signedOut();
    $('login-status').textContent = 'Your session has expired. Sign in again to continue.';
    $('login-password').focus();
  }
}
function discardAllowed() {return !dirty || window.confirm('Discard the unsaved changes in this form?');}
function fixtureFromForm() {
  return {id: formValue(fixtureForm, 'id') || crypto.randomUUID(),
    type: formValue(fixtureForm, 'type'), date: formValue(fixtureForm, 'date'), opponent: formValue(fixtureForm, 'opponent').trim(),
    venue: formValue(fixtureForm, 'venue').trim(), time: formValue(fixtureForm, 'time'), rinks: formValue(fixtureForm, 'rinks').trim(),
    dress: formValue(fixtureForm, 'dress').trim(), note: formValue(fixtureForm, 'note').trim(), result: formValue(fixtureForm, 'result').trim()};
}
function newsFromForm() {
  return {id: formValue(newsForm, 'id') || crypto.randomUUID(), title: formValue(newsForm, 'title').trim(), body: formValue(newsForm, 'body').trim(),
    date: formValue(newsForm, 'date'), status: formValue(newsForm, 'status'), image: formValue(newsForm, 'image'),
    imageAlt: formValue(newsForm, 'imageAlt').trim(), kind: formValue(newsForm, 'kind') || 'standard'};
}
function officerFromForm() {
  return {id: formValue(officerForm, 'id') || crypto.randomUUID(), name: formValue(officerForm, 'name').trim(),
    group: formValue(officerForm, 'group'), role: formValue(officerForm, 'role').trim(),
    club: formValue(officerForm, 'club').trim(), order: Number(formValue(officerForm, 'order'))};
}
function previewOfficer() {
  const item = officerFromForm();
  officerForm.elements.namedItem('role').required = item.group === 'officer';
  if (item.name) renderOfficers([item], $('officer-preview'));
  else $('officer-preview').replaceChildren(el('p', {class: 'small'}, 'Enter a name to preview this entry.'));
}
function previewFixture() {
  const item = fixtureFromForm();
  if (item.date && item.time && item.opponent) renderFixtures([item], $('fixture-preview'));
  else $('fixture-preview').replaceChildren(el('p', {class: 'small'}, 'Enter an opponent, date and start time to preview this fixture.'));
}
function previewNews() {
  const item = newsFromForm();
  if (item.title || item.body) renderNews([item], $('news-preview'), true);
  else $('news-preview').replaceChildren(el('p', {class: 'small'}, 'Enter a title and story to preview your news.'));
}
function openFixture(item) {
  const value = item || {id:'',type:'Indoor',date:'',time:'14:00',opponent:'',venue:'',rinks:'6 Mixed Rinks',dress:'Whites',note:'',result:''};
  fixtureForm.reset();
  for (const [key, v] of Object.entries(value)) setValue(fixtureForm, key, v);
  $('fixture-editor-title').textContent = item ? 'Edit fixture' : 'Add a fixture';
  $('delete-fixture').hidden = !item;
  dirty = false; previewFixture(); renderLists();
}
function openNews(item) {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const value = item || {id:'',title:'',body:'',date:today,status:'draft',image:'',imageAlt:'',kind:'standard'};
  newsForm.reset();
  for (const [key,v] of Object.entries(value)) setValue(newsForm, key, v);
  $('news-editor-title').textContent = item ? 'Edit news story' : 'Add a news story';
  $('photo-file-status').textContent = '';
  $('delete-news').hidden = !item;
  $('photo-current').hidden = !value.image;
  if (value.image) $('photo-current').src = value.image; else $('photo-current').removeAttribute('src');
  $('remove-photo').hidden = !value.image;
  dirty = false; previewNews(); renderLists();
}
function openOfficer(item) {
  const group = formValue(officerForm, 'group') || 'officer';
  const nextOrder = state ? Math.max(0, ...state.officers.filter(o => o.group === group).map(o => o.order)) + 1 : 1;
  const value = item || {id:'',group,name:'',role:'',club:'',order:Math.min(nextOrder,999)};
  officerForm.reset();
  for (const [key,v] of Object.entries(value)) setValue(officerForm,key,v);
  $('officer-editor-title').textContent = item ? 'Edit officer or committee member' : 'Add officer or committee member';
  $('delete-officer').hidden = !item;
  dirty = false; previewOfficer(); renderLists();
}
function renderLists() {
  if (!state) return;
  $('fixture-list').replaceChildren();
  for (const fixture of [...state.fixtures].sort((a,b) => a.date.localeCompare(b.date))) {
    const button = el('button', {type:'button',class:'record-button','aria-pressed':String(formValue(fixtureForm,'id') === fixture.id)});
    button.append(el('strong',{},fixture.opponent),el('span',{},`${dateLabel(fixture.date)} · ${fixture.type}`),el('span',{},fixture.result || 'Result not yet published'));
    button.addEventListener('click', () => {if(discardAllowed()) {openFixture(fixture); status('');}});
    $('fixture-list').append(button);
  }
  if (!state.fixtures.length) $('fixture-list').append(el('p',{class:'small'},'No fixtures yet.'));
  $('news-list').replaceChildren();
  for (const story of [...state.news].sort((a,b) => (b.date || '').localeCompare(a.date || ''))) {
    const button = el('button',{type:'button',class:'record-button','aria-pressed':String(formValue(newsForm,'id') === story.id)});
    button.append(el('strong',{},story.title),el('span',{},`${story.status === 'published' ? 'Published' : 'Draft'}${story.date ? ' · '+dateLabel(story.date) : ''}`));
    button.addEventListener('click', () => {if(discardAllowed()) {openNews(story); status('');}});
    $('news-list').append(button);
  }
  if(!state.news.length) $('news-list').append(el('p',{class:'small'},'No news stories yet.'));
  $('officer-list').replaceChildren();
  for (const group of ['officer','committee']) {
    const items = state.officers.filter(o => o.group === group).sort((a,b) => a.order - b.order || a.name.localeCompare(b.name));
    if (items.length) $('officer-list').append(el('h3', {class:'officer-list-heading'}, group === 'officer' ? 'Officers' : 'Committee'));
    for (const item of items) {
      const button = el('button',{type:'button',class:'record-button','aria-pressed':String(formValue(officerForm,'id') === item.id)});
      button.append(el('strong',{},item.name),el('span',{},[item.role,item.club].filter(Boolean).join(' · ')));
      button.addEventListener('click', () => {if(discardAllowed()) {openOfficer(item); status('');}});
      $('officer-list').append(button);
    }
  }
  if (!state.officers.length) $('officer-list').append(el('p',{class:'small'},'No officers or committee members yet.'));
}
async function load(preserve = false) {
  busy(true);
  try {
    state = await request('admin',{token});
    $('admin-login').hidden = true; $('admin-dashboard').hidden = false;
    if (!preserve) {openFixture(state.fixtures[0]); openNews(state.news[0]); openOfficer(state.officers[0]);}
    renderLists();
    status(preserve ? 'Latest records loaded. Check your form before saving.' : 'Ready to edit. Saved changes appear on the public website.');
  } catch(error) {errorMessage(error); if(!state) signedOut();}
  finally {busy(false);}
}
$('login-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = $('login-submit'); button.disabled = true;
  $('login-status').textContent = 'Signing in…';
  try {
    const auth = await request('login',{method:'POST',body:{password:$('login-password').value}});
    sessionToken(auth.token); $('login-password').value = '';
    await load(Boolean(state && dirty));
    $('login-status').textContent = '';
  } catch(error) {$('login-status').textContent = error.message;}
  finally {button.disabled = false;}
});
$('show-password').addEventListener('click', () => {
  const showing = $('login-password').type === 'password';
  $('login-password').type = showing ? 'text' : 'password';
  $('show-password').textContent = showing ? 'Hide password' : 'Show password';
  $('show-password').setAttribute('aria-pressed', String(showing));
});
$('sign-out').addEventListener('click', async () => {
  if(!discardAllowed()) return; busy(true);
  try {await request('logout',{token,method:'POST'}); sessionToken(''); state = null; dirty = false; signedOut(); $('login-status').textContent = 'You have signed out.';}
  catch(error) {errorMessage(error);} finally {busy(false);}
});
$('reload-editor').addEventListener('click', () => load(true));
for(const tab of document.querySelectorAll('[data-editor-tab]')) tab.addEventListener('click', () => {
  if(!discardAllowed()) return;
  dirty = false;
  for(const button of document.querySelectorAll('[data-editor-tab]')) button.setAttribute('aria-pressed',String(button === tab));
  $('fixtures-panel').hidden = tab.dataset.editorTab !== 'fixtures';
  $('news-panel').hidden = tab.dataset.editorTab !== 'news';
  $('officers-panel').hidden = tab.dataset.editorTab !== 'officers';
  // Discarding a form restores its stored value before another section is opened.
  const selectedFixture = state.fixtures.find(f => f.id === formValue(fixtureForm,'id'));
  const selectedNews = state.news.find(n => n.id === formValue(newsForm,'id'));
  const selectedOfficer = state.officers.find(o => o.id === formValue(officerForm,'id'));
  openFixture(selectedFixture); openNews(selectedNews); openOfficer(selectedOfficer); status('');
});
$('add-fixture').addEventListener('click', () => {if(discardAllowed()) {openFixture(); status(''); fixtureForm.elements.opponent.focus();}});
$('add-news').addEventListener('click', () => {if(discardAllowed()) {openNews(); status(''); newsForm.elements.title.focus();}});
$('add-officer').addEventListener('click', () => {if(discardAllowed()) {openOfficer(); status(''); officerForm.elements.namedItem('name').focus();}});
fixtureForm.addEventListener('input', () => {dirty = true; previewFixture();});
newsForm.addEventListener('input', () => {dirty = true; previewNews();});
officerForm.addEventListener('input', () => {dirty = true; previewOfficer();});
officerForm.addEventListener('submit', async event => {
  event.preventDefault(); if(saving || !state) return; busy(true); status('Saving officer details…');
  try {
    const item = officerFromForm(), records = [...state.officers];
    const index = records.findIndex(o => o.id === item.id);
    if (index >= 0) records[index] = item; else records.push(item);
    const saved = await request('officers',{token,method:'PUT',body:{revision:state.revisions.officers,items:records}});
    state.officers = saved.items; state.revisions.officers = saved.revision;
    openOfficer(state.officers.find(o => o.id === item.id));
    status('Officer details saved. The public officers and committee page is updated.');
  } catch(error) {errorMessage(error);} finally {busy(false);}
});
fixtureForm.addEventListener('submit', async event => {
  event.preventDefault(); if(saving || !state) return; busy(true); status('Saving fixture…');
  try {
    const item = fixtureFromForm(), records = [...state.fixtures];
    const index = records.findIndex(f => f.id === item.id);
    if(index >= 0) records[index] = item; else records.push(item);
    const saved = await request('fixtures',{token,method:'PUT',body:{revision:state.revisions.fixtures,items:records}});
    state.fixtures = saved.items; state.revisions.fixtures = saved.revision;
    openFixture(state.fixtures.find(f => f.id === item.id)); status('Fixture saved. The public fixture list and homepage results are updated.');
  } catch(error) {errorMessage(error);} finally {busy(false);}
});
newsForm.addEventListener('submit', async event => {
  event.preventDefault(); if(saving || !state) return; busy(true); status('Saving news…');
  try {
    const photo = newsForm.elements.photo.files[0];
    if(photo) {
      if(photo.size > 5242880 || !['image/jpeg','image/png','image/webp'].includes(photo.type)) throw new Error('Choose a JPEG, PNG or WebP photo up to 5 MB.');
      status('Uploading photo…');
      const upload = await request('upload',{token,method:'POST',body:photo,raw:true});
      setValue(newsForm,'image',upload.url); newsForm.elements.photo.value = '';
    }
    const item = newsFromForm(), records = [...state.news];
    const index = records.findIndex(n => n.id === item.id);
    if(index >= 0) records[index] = item; else records.push(item);
    const saved = await request('news',{token,method:'PUT',body:{revision:state.revisions.news,items:records}});
    state.news = saved.items; state.revisions.news = saved.revision;
    openNews(state.news.find(n => n.id === item.id));
    status(item.status === 'published' ? 'News published. It now appears on the public news page and homepage.' : 'Draft saved. This story is visible only in the admin page.');
  } catch(error) {errorMessage(error);} finally {busy(false);}
});
async function remove(kind) {
  const form = kind === 'fixtures' ? fixtureForm : kind === 'officers' ? officerForm : newsForm;
  const id = formValue(form,'id'); if(!id || !state || saving) return;
  if(!window.confirm(`Remove this ${kind === 'fixtures' ? 'fixture' : kind === 'officers' ? 'officer or committee entry' : 'news story'} from the website?`)) return;
  busy(true); status('Removing record…');
  try {
    const saved = await request(kind,{token,method:'PUT',body:{revision:state.revisions[kind],items:state[kind].filter(item => item.id !== id)}});
    state[kind] = saved.items; state.revisions[kind] = saved.revision;
    kind === 'fixtures' ? openFixture() : kind === 'officers' ? openOfficer() : openNews();
    status('Record removed. The public website is updated.');
  } catch(error) {errorMessage(error);} finally {busy(false);}
}
$('delete-fixture').addEventListener('click', () => remove('fixtures'));
$('delete-news').addEventListener('click', () => remove('news'));
$('delete-officer').addEventListener('click', () => remove('officers'));
$('remove-photo').addEventListener('click', () => {setValue(newsForm,'image',''); setValue(newsForm,'imageAlt',''); newsForm.elements.photo.value=''; $('photo-current').hidden=true; $('remove-photo').hidden=true; dirty=true; previewNews();});
newsForm.elements.photo.addEventListener('change', () => {dirty = true; const photo=newsForm.elements.photo.files[0]; $('photo-file-status').textContent=photo ? `Selected: ${photo.name}. It will upload when you save.` : '';});
window.addEventListener('beforeunload', event => {if(dirty) {event.preventDefault(); event.returnValue='';}});
if(token) load(); else signedOut();
