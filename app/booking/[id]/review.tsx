import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, typography } from '@/constants/theme';
import { supabase } from '@/lib/auth/supabase';
import { AnalyticsEvents, track } from '@/lib/analytics/events';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  const submit = async () => {
    const { error } = await supabase.rpc('submit_review', {
      p_booking_id: id,
      p_rating: Number(rating),
      p_comment: comment || null,
    });
    if (error) Alert.alert('Error', error.message);
    else {
      track(AnalyticsEvents.REVIEW_SUBMITTED, { rating: Number(rating) });
      Alert.alert('Thanks', 'Thanks for charging locally.');
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was it?</Text>
      <TextField label="Rating (1-5)" value={rating} onChangeText={setRating} keyboardType="numeric" />
      <TextField label="Comment" value={comment} onChangeText={setComment} multiline />
      <Button title="Submit review" onPress={submit} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, backgroundColor: colors.warmWhite },
  title: { ...typography.display, color: colors.graphite },
});
