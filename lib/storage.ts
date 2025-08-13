import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoyaltyCard } from '@/lib/types';

const KEY = 'loyalty_cards_v1';

export async function getCards(): Promise<LoyaltyCard[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LoyaltyCard[];
    return parsed;
  } catch (e) {
    console.warn('Failed to parse stored cards', e);
    return [];
  }
}

export async function saveCards(cards: LoyaltyCard[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(cards));
}

export async function upsertCard(card: LoyaltyCard): Promise<void> {
  const cards = await getCards();
  const idx = cards.findIndex(c => c.id === card.id);
  if (idx >= 0) cards[idx] = card; else cards.push(card);
  await saveCards(cards);
}

export async function getCardByEstablishment(establishmentId: string): Promise<LoyaltyCard | undefined> {
  const cards = await getCards();
  return cards.find(c => c.establishmentId === establishmentId);
}

export async function incrementPunch(establishmentId: string): Promise<LoyaltyCard | undefined> {
  const cards = await getCards();
  const idx = cards.findIndex(c => c.establishmentId === establishmentId);
  if (idx === -1) return undefined;
  const card = { ...cards[idx] };
  card.punches = Math.min(card.punches + 1, card.goal);
  card.updatedAt = new Date().toISOString();
  cards[idx] = card;
  await saveCards(cards);
  return card;
}

export async function resetPunches(establishmentId: string): Promise<LoyaltyCard | undefined> {
  const cards = await getCards();
  const idx = cards.findIndex(c => c.establishmentId === establishmentId);
  if (idx === -1) return undefined;
  const card = { ...cards[idx] };
  card.punches = 0;
  card.updatedAt = new Date().toISOString();
  cards[idx] = card;
  await saveCards(cards);
  return card;
}
