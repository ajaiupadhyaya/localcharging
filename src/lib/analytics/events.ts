type AnalyticsProps = Record<string, string | number | boolean | undefined>;

const SENSITIVE_KEYS = ['address', 'exact_address', 'lat', 'lng', 'private'];

function sanitize(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;
  const clean: AnalyticsProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))) continue;
    clean[k] = v;
  }
  return clean;
}

export function track(event: string, properties?: AnalyticsProps) {
  if (__DEV__) {
    console.debug('[analytics]', event, sanitize(properties));
  }
  // PostHog / other provider can be wired here
}

export const AnalyticsEvents = {
  MAP_OPENED: 'map_opened',
  CHARGER_VIEWED: 'charger_viewed',
  FILTER_USED: 'filter_used',
  SEARCH_PERFORMED: 'search_performed',
  BOOKING_REQUESTED: 'booking_requested',
  BOOKING_APPROVED: 'booking_approved',
  BOOKING_DECLINED: 'booking_declined',
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  HOST_ONBOARDING_STARTED: 'host_onboarding_started',
  HOST_ONBOARDING_COMPLETED: 'host_onboarding_completed',
} as const;
