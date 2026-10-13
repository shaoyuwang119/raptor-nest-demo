import { supabaseAdmin } from '@/config/supabaseAdmin'

export async function isAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}
