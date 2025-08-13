import { useEffect, useState } from 'react';
import { Alert, Button, Linking, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getCards, saveCards } from '@/lib/storage';
import { LoyaltyCard } from '@/lib/types';

export default function CardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const cards = await getCards();
      const c = cards.find(x => x.id === id);
      setCard(c ?? null);
    };
    load();
    const t = setInterval(load, 800);
    return () => clearInterval(t);
  }, [id]);

  const resetRedeem = async () => {
    if (!card) return;
    const cards = await getCards();
    const idx = cards.findIndex(c => c.id === card.id);
    if (idx === -1) return;
    const updated = { ...cards[idx], punches: 0, updatedAt: new Date().toISOString() };
    cards[idx] = updated;
    await saveCards(cards);
    setCard(updated);
  };

  if (!card) return (
    <ThemedView style={styles.center}>
      <ThemedText>Card not found.</ThemedText>
    </ThemedView>
  );

  const progress = `${card.punches}/${card.goal}`;
  const ready = card.punches >= card.goal;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{card.name}</ThemedText>
      <ThemedText type="subtitle">Progress: {progress}</ThemedText>
      {card.rewardDescription ? (
        <ThemedText>Reward: {card.rewardDescription}</ThemedText>
      ) : null}

      {card.walletPassUrl ? (
        <View style={{ marginVertical: 8 }}>
          <Button title={Platform.OS === 'ios' ? 'Add to Apple Wallet' : 'Open Wallet Pass'} onPress={() => Linking.openURL(card.walletPassUrl!)} />
        </View>
      ) : null}

      <View style={{ height: 16 }} />
      {ready ? (
        <>
          <ThemedText type="subtitle">Ready to redeem!</ThemedText>
          <Button title="Mark as Redeemed" onPress={() => {
            Alert.alert('Redeem now?', 'Ask the establishment to confirm, then mark as redeemed to reset punches.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Mark Redeemed', style: 'destructive', onPress: resetRedeem }
            ]);
          }} />
        </>
      ) : (
        <ThemedText>Collect more punches to unlock the reward.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
