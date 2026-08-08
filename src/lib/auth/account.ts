import { supabase } from '@/lib/auth/supabase';

export async function deleteAccount() {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Not signed in');

  const { error } = await supabase.functions.invoke('delete-account', {
    body: { userId: session.session.user.id },
  });

  if (error) {
    // Fallback: sign out and mark for manual cleanup if edge function not deployed
    await supabase.auth.signOut();
    throw new Error('Account deletion requested. Contact support if data remains.');
  }
}
