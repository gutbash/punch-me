import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getCards } from '@/lib/storage';
import { LoyaltyCard } from '@/lib/types';

export default function CardsScreen() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => setCards(await getCards());
    const t = setInterval(load, 600);
    load();
    return () => clearInterval(t);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Your Cards</ThemedText>
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/card/[id]', params: { id: item.id } })}>
            <View style={styles.card}>
              <ThemedText type="subtitle">{item.name}</ThemedText>
              <ThemedText>
                {item.punches}/{item.goal} punches
              </ThemedText>
              {item.rewardDescription ? (
                <ThemedText>{item.rewardDescription}</ThemedText>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<ThemedText>No cards yet. Scan an "add" QR at the establishment.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(127,127,127,0.1)'
  }
});
