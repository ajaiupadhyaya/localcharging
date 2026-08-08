import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token ?? '');
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { userId } = await req.json();
  if (userId !== user.id) return new Response('Forbidden', { status: 403 });

  await supabase.from('profiles').delete().eq('id', user.id);
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ ok: true });
});
