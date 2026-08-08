import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, typography } from '@/constants/theme';
import { supabase } from '@/lib/auth/supabase';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  const submit = async () => {
    const { data: booking } = await supabase.from('bookings').select('*, chargers(host_id)').eq('id', id).single();
    if (!booking) return;
    const revieweeId =
      user?.id === booking.driver_id ? (booking.chargers as any).host_id : booking.driver_id;
    const { error } = await supabase.from('reviews').insert({
      booking_id: id,
      reviewer_id: user!.id,
      reviewee_id: revieweeId,
      rating: Number(rating),
      comment: comment || null,
    });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Thanks', 'Thanks for charging locally.');
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
