import {createHandler} from './handler.mjs';
// Secret credentials are injected by the host and never sent to the website.
const url = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default;
if (!url || !key) throw new Error('Missing server configuration');
Deno.serve(createHandler({url, key}));
