import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, radii, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/auth/supabase';
import { AnalyticsEvents, track } from '@/lib/analytics/events';
import { geocodeSearch } from '@/lib/maps/geocoding';
import type { ApprovalMode, ConnectorType, ParkingType, PricingType } from '@/types';

const STEPS = [
  'location',
  'charger',
  'parking',
  'access',
  'schedule',
  'approval',
  'pricing',
  'preview',
] as const;

const CONNECTORS: { id: ConnectorType; label: string }[] = [
  { id: 'j1772', label: 'J1772' },
  { id: 'nacs', label: 'NACS' },
  { id: 'ccs', label: 'CCS' },
  { id: 'chademo', label: 'CHAdeMO' },
];

const PARKING: { id: ParkingType; label: string }[] = [
  { id: 'driveway', label: 'Driveway' },
  { id: 'garage', label: 'Garage (outdoor stall)' },
  { id: 'parking_lot', label: 'Lot' },
  { id: 'street_adjacent', label: 'Street' },
];

const DEFAULT_DAYS = [1, 2, 3, 4, 5];

export default function HostOnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const { chargerId } = useLocalSearchParams<{ chargerId?: string }>();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [form, setForm] = useState({
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    name: '',
    connector: 'j1772' as ConnectorType,
    maxKw: '11.5',
    parkingType: 'driveway' as ParkingType,
    parkingInstructions: '',
    accessInstructions: '',
    arrivalInstructions: '',
    approvalMode: 'manual' as ApprovalMode,
    pricingType: 'per_kwh' as PricingType,
    pricePerKwh: '0.18',
    pricePerSession: '5',
    pricePerHour: '2',
    neighborhood: '',
    photos: [] as string[],
    weekdayStart: '17:00',
    weekdayEnd: '21:00',
    days: DEFAULT_DAYS as number[],
  });

  useEffect(() => {
    if (!chargerId || !user) return;
    (async () => {
      const { data } = await supabase.from('chargers').select('*').eq('id', chargerId).maybeSingle();
      if (!data) return;
      const { data: hours } = await supabase
        .from('charger_availability')
        .select('*')
        .eq('charger_id', chargerId);
      setForm((f) => ({
        ...f,
        address: data.exact_address ?? '',
        name: data.name ?? '',
        connector: data.connector_type,
        maxKw: String(data.max_kw ?? 11.5),
        parkingType: data.parking_type,
        parkingInstructions: data.parking_instructions ?? '',
        accessInstructions: data.access_instructions_private ?? '',
        arrivalInstructions: data.arrival_instructions ?? '',
        approvalMode: data.approval_mode,
        pricingType: data.pricing_type,
        pricePerKwh: String(data.price_per_kwh ?? 0.18),
        pricePerSession: String(data.price_per_session ?? 5),
        pricePerHour: String(data.price_per_hour ?? 2),
        neighborhood: data.neighborhood ?? '',
        photos: data.photos ?? [],
        weekdayStart: hours?.[0]?.start_time?.slice(0, 5) ?? '17:00',
        weekdayEnd: hours?.[0]?.end_time?.slice(0, 5) ?? '21:00',
        days: hours?.length ? hours.map((h) => h.day_of_week) : DEFAULT_DAYS,
      }));
    })();
  }, [chargerId, user]);

  const lookupAddress = async () => {
    if (!form.address.trim()) return null;
    setGeocoding(true);
    const result = await geocodeSearch(form.address);
    setGeocoding(false);
    if (!result) {
      Alert.alert('Address', 'Could not find that address. Check spelling and try again.');
      return null;
    }
    setForm((f) => ({
      ...f,
      lat: result.lat,
      lng: result.lng,
      address: result.address ?? f.address,
      neighborhood: f.neighborhood || result.neighborhood || '',
    }));
    return result;
  };

  const pickPhoto = async () => {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo access to show drivers where to park.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const resp = await fetch(asset.uri);
    const blob = await resp.blob();
    const { error } = await supabase.storage.from('charger-photos').upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    if (error) {
      Alert.alert('Upload failed', error.message);
      return;
    }
    const { data } = supabase.storage.from('charger-photos').getPublicUrl(path);
    setForm((f) => ({ ...f, photos: [...f.photos, data.publicUrl].slice(0, 3) }));
  };

  const next = async () => {
    if (step === 0) {
      track(AnalyticsEvents.HOST_ONBOARDING_STARTED);
      if (form.lat == null || form.lng == null) {
        const found = await lookupAddress();
        if (!found) return;
      }
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  const saveHours = async (id: string) => {
    await supabase.from('charger_availability').delete().eq('charger_id', id);
    await supabase.from('charger_availability').insert(
      form.days.map((day) => ({
        charger_id: id,
        day_of_week: day,
        start_time: form.weekdayStart,
        end_time: form.weekdayEnd,
        enabled: true,
      })),
    );
  };

  const submit = async () => {
    if (!user) return;
    if (form.lat == null || form.lng == null) {
      Alert.alert('Location', 'Look up the address before publishing.');
      return;
    }
    setLoading(true);
    const payload = {
      p_name: form.name || 'Home charger',
      p_exact_address: form.address,
      p_lng: form.lng,
      p_lat: form.lat,
      p_connector: form.connector,
      p_max_kw: Number(form.maxKw),
      p_parking_type: form.parkingType,
      p_parking_instructions: form.parkingInstructions,
      p_access_instructions_private: form.accessInstructions || null,
      p_approval_mode: form.approvalMode,
      p_pricing_type: form.pricingType,
      p_price_per_kwh: form.pricingType === 'per_kwh' ? Number(form.pricePerKwh) : null,
      p_neighborhood: form.neighborhood,
      p_price_per_session: form.pricingType === 'per_session' ? Number(form.pricePerSession) : null,
      p_price_per_hour: form.pricingType === 'per_hour' ? Number(form.pricePerHour) : null,
      p_photos: form.photos,
      p_arrival_instructions: form.arrivalInstructions || form.parkingInstructions || null,
    };

    if (chargerId) {
      const { error } = await supabase.rpc('update_charger_listing', { p_charger_id: chargerId, ...payload });
      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }
      await saveHours(chargerId);
    } else {
      const { data, error } = await supabase.rpc('create_charger_listing', payload);
      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }
      if (data) await saveHours(data as string);
      track(AnalyticsEvents.HOST_ONBOARDING_COMPLETED);
    }

    await refreshProfile();
    setLoading(false);
    Alert.alert(chargerId ? 'Updated' : 'Listed', chargerId ? 'Your charger settings were saved.' : 'Your charger is live.');
    router.replace('/host');
  };

  const priceLabel = () => {
    if (form.pricingType === 'free') return 'Free';
    if (form.pricingType === 'per_session') return `$${form.pricePerSession}/session`;
    if (form.pricingType === 'per_hour') return `$${form.pricePerHour}/hour`;
    return `$${form.pricePerKwh}/kWh`;
  };

  const renderStep = () => {
    switch (STEPS[step]) {
      case 'location':
        return (
          <>
            <Text style={styles.question}>Where is the charger?</Text>
            <TextField label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v, lat: null, lng: null })} />
            <Button title="Look up address" variant="secondary" onPress={lookupAddress} loading={geocoding} />
            {form.lat != null ? (
              <Text style={styles.hint}>Pinned near {form.neighborhood || 'this address'} (exact location stays private).</Text>
            ) : (
              <Text style={styles.hint}>We’ll place an approximate pin. House number stays hidden until you approve a driver.</Text>
            )}
            <TextField label="Neighborhood (shown before approval)" value={form.neighborhood} onChangeText={(v) => setForm({ ...form, neighborhood: v })} />
          </>
        );
      case 'charger':
        return (
          <>
            <Text style={styles.question}>What charger do you have?</Text>
            <TextField label="Listing name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Text style={styles.label}>Connector</Text>
            <View style={styles.row}>
              {CONNECTORS.map((c) => (
                <Pressable key={c.id} onPress={() => setForm({ ...form, connector: c.id })} style={[styles.chip, form.connector === c.id && styles.chipOn]}>
                  <Text style={[styles.chipText, form.connector === c.id && styles.chipTextOn]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextField label="Max kW" value={form.maxKw} onChangeText={(v) => setForm({ ...form, maxKw: v })} keyboardType="decimal-pad" />
          </>
        );
      case 'parking':
        return (
          <>
            <Text style={styles.question}>Where should the driver park?</Text>
            <View style={styles.row}>
              {PARKING.map((p) => (
                <Pressable key={p.id} onPress={() => setForm({ ...form, parkingType: p.id })} style={[styles.chip, form.parkingType === p.id && styles.chipOn]}>
                  <Text style={[styles.chipText, form.parkingType === p.id && styles.chipTextOn]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextField label="Parking instructions" value={form.parkingInstructions} onChangeText={(v) => setForm({ ...form, parkingInstructions: v })} multiline />
            <Text style={styles.label}>Photos (charger / parking / approach — no interiors)</Text>
            <View style={styles.photoRow}>
              {form.photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.photo} />
              ))}
            </View>
            {form.photos.length < 3 ? <Button title="Add photo" variant="secondary" onPress={pickPhoto} /> : null}
          </>
        );
      case 'access':
        return (
          <>
            <Text style={styles.question}>Private access notes</Text>
            <Text style={styles.hint}>Gate codes etc. — only shown after approval.</Text>
            <TextField label="Private instructions" value={form.accessInstructions} onChangeText={(v) => setForm({ ...form, accessInstructions: v })} multiline />
            <TextField label="Arrival notes (after approval)" value={form.arrivalInstructions} onChangeText={(v) => setForm({ ...form, arrivalInstructions: v })} multiline />
          </>
        );
      case 'schedule':
        return (
          <>
            <Text style={styles.question}>When can drivers request?</Text>
            <TextField label="Start (local)" value={form.weekdayStart} onChangeText={(v) => setForm({ ...form, weekdayStart: v })} />
            <TextField label="End (local)" value={form.weekdayEnd} onChangeText={(v) => setForm({ ...form, weekdayEnd: v })} />
            <Text style={styles.label}>Days</Text>
            <View style={styles.row}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
                <Pressable
                  key={`${label}-${i}`}
                  onPress={() =>
                    setForm({
                      ...form,
                      days: form.days.includes(i) ? form.days.filter((d) => d !== i) : [...form.days, i],
                    })
                  }
                  style={[styles.dayChip, form.days.includes(i) && styles.chipOn]}
                >
                  <Text style={[styles.chipText, form.days.includes(i) && styles.chipTextOn]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        );
      case 'approval':
        return (
          <>
            <Text style={styles.question}>How should requests be handled?</Text>
            <Button title="Ask me first" variant={form.approvalMode === 'manual' ? 'primary' : 'secondary'} onPress={() => setForm({ ...form, approvalMode: 'manual' })} />
            <Button title="Automatically approve" variant={form.approvalMode === 'automatic' ? 'primary' : 'secondary'} onPress={() => setForm({ ...form, approvalMode: 'automatic' })} />
          </>
        );
      case 'pricing':
        return (
          <>
            <Text style={styles.question}>How much do you want to charge?</Text>
            <View style={styles.row}>
              {(['free', 'per_kwh', 'per_session', 'per_hour'] as PricingType[]).map((t) => (
                <Pressable key={t} onPress={() => setForm({ ...form, pricingType: t })} style={[styles.chip, form.pricingType === t && styles.chipOn]}>
                  <Text style={[styles.chipText, form.pricingType === t && styles.chipTextOn]}>
                    {t === 'free' ? 'Free' : t === 'per_kwh' ? 'kWh' : t === 'per_session' ? 'Session' : 'Hourly'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {form.pricingType === 'per_kwh' ? (
              <TextField label="Price per kWh" value={form.pricePerKwh} onChangeText={(v) => setForm({ ...form, pricePerKwh: v })} keyboardType="decimal-pad" />
            ) : null}
            {form.pricingType === 'per_session' ? (
              <TextField label="Price per session" value={form.pricePerSession} onChangeText={(v) => setForm({ ...form, pricePerSession: v })} keyboardType="decimal-pad" />
            ) : null}
            {form.pricingType === 'per_hour' ? (
              <TextField label="Price per hour" value={form.pricePerHour} onChangeText={(v) => setForm({ ...form, pricePerHour: v })} keyboardType="decimal-pad" />
            ) : null}
          </>
        );
      case 'preview':
        return (
          <>
            <Text style={styles.question}>What drivers will see</Text>
            <Text style={styles.previewTitle}>{form.name || 'Home charger'}</Text>
            <Text style={styles.body}>
              {form.maxKw} kW · {form.connector.toUpperCase()} · {form.neighborhood || 'Neighborhood'}
            </Text>
            <Text style={styles.body}>
              {priceLabel()} · {form.approvalMode === 'manual' ? 'Approval required' : 'Instant approval'}
            </Text>
            <Text style={styles.hint}>Exact address stays hidden until you approve.</Text>
          </>
        );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.progress}>
        {chargerId ? 'Edit listing' : 'New listing'} · Step {step + 1} of {STEPS.length}
      </Text>
      {renderStep()}
      <View style={styles.nav}>
        {step > 0 ? <Button title="Back" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
        <Button title={step === STEPS.length - 1 ? (chargerId ? 'Save changes' : 'Publish listing') : 'Continue'} onPress={next} loading={loading} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, backgroundColor: colors.warmWhite, flexGrow: 1 },
  progress: { ...typography.caption, color: colors.neutralGray },
  question: { ...typography.title, color: colors.graphite },
  hint: { ...typography.caption, color: colors.neutralGray },
  body: { ...typography.body, color: colors.graphite },
  previewTitle: { ...typography.display, color: colors.graphite },
  nav: { gap: 8, marginTop: 16 },
  label: { ...typography.label, color: colors.neutralGray },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChip: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.electricIndigo, borderColor: colors.electricIndigo },
  chipText: { ...typography.caption, color: colors.graphite, fontWeight: '600' },
  chipTextOn: { color: colors.white },
  photoRow: { flexDirection: 'row', gap: 8 },
  photo: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.border },
});
