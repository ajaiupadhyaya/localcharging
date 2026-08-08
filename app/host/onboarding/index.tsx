import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/auth/supabase';
import { AnalyticsEvents, track } from '@/lib/analytics/events';

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

export default function HostOnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    address: '',
    lat: 38.0293,
    lng: -78.4767,
    name: "Alex's Home Charger",
    connector: 'j1772',
    maxKw: '11.5',
    parkingType: 'driveway',
    parkingInstructions: 'Pull into the right side of the driveway.',
    accessInstructions: '',
    approvalMode: 'manual' as 'manual' | 'automatic',
    pricingType: 'per_kwh' as 'free' | 'per_kwh' | 'per_session' | 'per_hour',
    pricePerKwh: '0.18',
    neighborhood: 'Belmont',
  });

  const next = () => {
    if (step === 0) track(AnalyticsEvents.HOST_ONBOARDING_STARTED);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.rpc('create_charger_listing', {
      p_name: form.name,
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
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    await supabase.from('profiles').update({ role: 'both' }).eq('id', user.id);
    await refreshProfile();
    track(AnalyticsEvents.HOST_ONBOARDING_COMPLETED);
    setLoading(false);
    Alert.alert('Listed', 'Your charger is live.');
    router.replace('/host');
  };

  const renderStep = () => {
    switch (STEPS[step]) {
      case 'location':
        return (
          <>
            <Text style={styles.question}>Where is the charger?</Text>
            <TextField label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
            <TextField label="Neighborhood (shown before approval)" value={form.neighborhood} onChangeText={(v) => setForm({ ...form, neighborhood: v })} />
          </>
        );
      case 'charger':
        return (
          <>
            <Text style={styles.question}>What charger do you have?</Text>
            <TextField label="Listing name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <TextField label="Max kW" value={form.maxKw} onChangeText={(v) => setForm({ ...form, maxKw: v })} keyboardType="decimal-pad" />
          </>
        );
      case 'parking':
        return (
          <>
            <Text style={styles.question}>Where should the driver park?</Text>
            <TextField label="Parking instructions" value={form.parkingInstructions} onChangeText={(v) => setForm({ ...form, parkingInstructions: v })} multiline />
          </>
        );
      case 'access':
        return (
          <>
            <Text style={styles.question}>Private access notes</Text>
            <Text style={styles.hint}>Gate codes etc. — only shown after approval.</Text>
            <TextField label="Private instructions" value={form.accessInstructions} onChangeText={(v) => setForm({ ...form, accessInstructions: v })} multiline />
          </>
        );
      case 'schedule':
        return <Text style={styles.body}>Weekday evenings by default. Customize in charger settings after listing.</Text>;
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
            <TextField label="Price per kWh" value={form.pricePerKwh} onChangeText={(v) => setForm({ ...form, pricePerKwh: v, pricingType: 'per_kwh' })} keyboardType="decimal-pad" />
          </>
        );
      case 'preview':
        return (
          <>
            <Text style={styles.question}>Preview</Text>
            <Text style={styles.previewTitle}>{form.name}</Text>
            <Text style={styles.body}>{form.maxKw} kW · Level 2 · {form.neighborhood}</Text>
            <Text style={styles.body}>${form.pricePerKwh}/kWh · {form.approvalMode === 'manual' ? 'Approval required' : 'Instant approval'}</Text>
          </>
        );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.progress}>Step {step + 1} of {STEPS.length}</Text>
      {renderStep()}
      <View style={styles.nav}>
        {step > 0 ? <Button title="Back" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
        <Button title={step === STEPS.length - 1 ? 'Publish listing' : 'Continue'} onPress={next} loading={loading} fullWidth />
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
});
