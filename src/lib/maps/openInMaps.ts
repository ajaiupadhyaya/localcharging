import { Linking, Platform } from 'react-native';

export async function openInMaps(address: string, lat?: number | null, lng?: number | null) {
  const query = lat != null && lng != null ? `${lat},${lng}` : encodeURIComponent(address);
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encodeURIComponent(address)}&ll=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
  else await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
}
