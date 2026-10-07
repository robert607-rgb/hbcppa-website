-- Extend the existing shared content table without changing saved fixtures or news.
alter table public.hbcppa_content drop constraint hbcppa_content_key_check;
alter table public.hbcppa_content add constraint hbcppa_content_key_check
  check (key in ('fixtures', 'news', 'officers'));
