import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/constants/theme';
import { supabase } from '@/lib/auth/supabase';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { BookingMessage } from '@/types';

export function BookingMessages({ bookingId }: { bookingId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [body, setBody] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at');
    setMessages((data as BookingMessage[]) ?? []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'booking_messages', filter: `booking_id=eq.${bookingId}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const send = async () => {
    if (!body.trim() || !user) return;
    await supabase.from('booking_messages').insert({
      booking_id: bookingId,
      sender_id: user.id,
      body: body.trim(),
    });
    setBody('');
    load();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <Text style={item.sender_id === user?.id ? styles.mine : styles.theirs}>{item.body}</Text>
        )}
        style={styles.list}
      />
      <TextInput
        style={styles.input}
        value={body}
        onChangeText={setBody}
        placeholder="I'm about 10 minutes away."
        placeholderTextColor={colors.neutralGray}
      />
      <Button title="Send" onPress={send} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 16 },
  title: { ...typography.title, color: colors.graphite },
  list: { maxHeight: 160 },
  mine: { ...typography.body, alignSelf: 'flex-end', color: colors.electricIndigo },
  theirs: { ...typography.body, alignSelf: 'flex-start', color: colors.graphite },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    ...typography.body,
    color: colors.graphite,
  },
});
