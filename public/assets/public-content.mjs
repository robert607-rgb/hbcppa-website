import {request, renderFixtures, renderNews, renderOfficers, el, dateLabel} from './content.mjs';
async function refresh() {
  try {
    const data = await request('public');
    const schedules = document.getElementById('fixture-schedules');
    if (schedules) {
      renderFixtures(data.fixtures, schedules, document.getElementById('fixture-jumps'));
      document.getElementById('fixture-updated').textContent = `Last updated ${new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London'}).format(new Date(data.updatedAt))}.`;
    }
    const news = document.getElementById('news-stories');
    if (news) renderNews(data.news, news);
    const officers = document.getElementById('officers-list');
    if (officers) renderOfficers(data.officers, officers);
    const homeNews = document.getElementById('home-news-items');
    if (homeNews) {
      const newest = [...data.news].sort((a,b) => (b.date || '').localeCompare(a.date || '')).slice(0,3);
      homeNews.replaceChildren();
      for (const story of newest) {
        const article = el('article');
        if (story.date) article.append(el('time', {class: 'role', datetime: story.date}, dateLabel(story.date)));
        const heading = el('h3'); heading.append(el('a', {href: `/news/#${story.id}`}, story.title));
        const excerpt = story.body.slice(0, 190).trim();
        article.append(heading, el('p', {}, `${excerpt}${story.body.length > 190 ? '…' : ''}`));
        homeNews.append(article);
      }
      document.getElementById('home-news').hidden = newest.length === 0;
    }
    const homeResults = document.getElementById('home-result-items');
    if (homeResults) {
      const results = data.fixtures.filter(f => f.result).sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);
      homeResults.replaceChildren();
      for (const fixture of results) {
        const article = el('article');
        article.append(el('time', {class:'role', datetime: fixture.date}, dateLabel(fixture.date)), el('h3', {}, fixture.opponent), el('p', {class: 'home-result'}, fixture.result));
        homeResults.append(article);
      }
      document.getElementById('home-results').hidden = results.length === 0;
    }
    const status = document.getElementById('content-status');
    if (status) status.hidden = true;
  } catch {
    const status = document.getElementById('content-status');
    if (status) {status.hidden = false; status.textContent = 'The latest updates could not be loaded. The previously saved page content is shown below. Please try again shortly.';}
  }
}
refresh();
// Recheck after returning to an open tab so published edits become visible.
let refreshedAt = Date.now();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && Date.now() - refreshedAt > 30000) {refreshedAt = Date.now(); refresh();}
});
