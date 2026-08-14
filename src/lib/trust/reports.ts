import { supabase } from '@/lib/auth/supabase';

export async function reportCharger(chargerId: string, reporterId: string, reason: string, description?: string) {
  return supabase.from('charger_reports').insert({
    charger_id: chargerId,
    reporter_id: reporterId,
    reason,
    description,
  });
}

export async function reportUser(reportedUserId: string, reporterId: string, reason: string, description?: string) {
  return supabase.from('charger_reports').insert({
    reported_user_id: reportedUserId,
    reporter_id: reporterId,
    reason,
    description,
  });
}

export async function blockUser(userId: string, blockedId: string) {
  const { data: profile } = await supabase.from('profiles').select('blocked_user_ids').eq('id', userId).single();
  const current = (profile?.blocked_user_ids as string[]) ?? [];
  if (current.includes(blockedId)) return;
  return supabase
    .from('profiles')
    .update({ blocked_user_ids: [...current, blockedId] })
    .eq('id', userId);
}

export async function pauseCharger(chargerId: string) {
  return supabase.rpc('set_charger_paused', { p_charger_id: chargerId, p_paused: true });
}

export async function resumeCharger(chargerId: string) {
  return supabase.rpc('set_charger_paused', { p_charger_id: chargerId, p_paused: false });
}
