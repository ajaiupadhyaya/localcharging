import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'signin') await signIn(email.trim(), password);
      else await signUp(email.trim(), password, displayName.trim() || 'Driver');
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
      <Text style={styles.subtitle}>Charge locally. Drive confidently.</Text>
      {mode === 'signup' ? (
        <TextField label="Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      ) : null}
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title={mode === 'signin' ? 'Sign in' : 'Sign up'} onPress={submit} loading={loading} fullWidth />
      <Button
        title={mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        variant="ghost"
        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        fullWidth
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, backgroundColor: colors.warmWhite, flexGrow: 1 },
  title: { ...typography.display, color: colors.graphite },
  subtitle: { ...typography.body, color: colors.neutralGray, marginBottom: 8 },
});
