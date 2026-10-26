import { createClient } from '@supabase/supabase-js'

import { createDemoClient } from './demo/client'

// Demo build (`npm run demo` / `vite --mode demo`): no login, no server,
// sample LASA data stored in the visitor's browser. Vite swaps this check
// for a constant at build time, so the demo code is left out of the real build.
export const isDemo =
  import.meta.env.MODE === 'demo' || import.meta.env.VITE_DEMO === 'true'

export const supabase = isDemo
  ? createDemoClient()
  : createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    )
