import 'server-only';

import { createClient } from '@supabase/supabase-js';

type SupabaseClientType = ReturnType<typeof createClient>;

let client: SupabaseClientType | null = null;

export function getSupabaseAdminClient(): SupabaseClientType {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables');
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'latent-library-admin',
      },
    },
  });

  return client;
}


