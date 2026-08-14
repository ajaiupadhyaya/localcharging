import { supabase } from '@/lib/auth/supabase';
import { PLATFORM_FEE_RATE } from '@/constants/theme';

export async function fetchPlatformFeeRate(): Promise<number> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_fee_rate')
    .maybeSingle();
  if (error || data?.value == null) return PLATFORM_FEE_RATE;
  const n = Number(data.value);
  return Number.isFinite(n) ? n : PLATFORM_FEE_RATE;
}

export function isStripeTestMode(): boolean {
  const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  return !key || key.includes('test') || process.env.EXPO_PUBLIC_APP_ENV !== 'production';
}
