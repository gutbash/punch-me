import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, ActivityIndicator, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { parseScanData } from '@/lib/qr';
import { getCardByEstablishment, upsertCard, incrementPunch } from '@/lib/storage';
import { LoyaltyCard } from '@/lib/types';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleData = async (data: string) => {
    const parsed = parseScanData(data);
    if (parsed.type === 'unknown') {
      Alert.alert('Unrecognized code', 'This QR is not a supported loyalty code.');
      return;
    }

    if (parsed.type === 'add') {
      const existing = await getCardByEstablishment(parsed.establishmentId);
      const now = new Date().toISOString();
      const card: LoyaltyCard = existing ?? {
        id: parsed.establishmentId,
        establishmentId: parsed.establishmentId,
        name: parsed.name,
        goal: parsed.goal ?? 10,
        punches: 0,
        rewardDescription: parsed.reward,
        walletPassUrl: parsed.walletPassUrl,
        createdAt: now,
        updatedAt: now,
      };
      // Update fields if provided
      card.name = parsed.name || card.name;
      if (parsed.goal) card.goal = parsed.goal;
      if (parsed.reward) card.rewardDescription = parsed.reward;
      if (parsed.walletPassUrl) card.walletPassUrl = parsed.walletPassUrl;
      card.updatedAt = now;
      await upsertCard(card);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Card added', `${card.name} card is now in your wallet.`);
  router.push({ pathname: '/card/[id]', params: { id: card.id } });
      return;
    }

    if (parsed.type === 'punch') {
      const card = await getCardByEstablishment(parsed.establishmentId);
      if (!card) {
        Alert.alert('No card found', 'Scan the add QR for this establishment first.');
        return;
      }
      const updated = await incrementPunch(parsed.establishmentId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (updated) {
        const reached = updated.punches >= updated.goal;
        Alert.alert('Punch added', `${updated.punches}/${updated.goal} collected${reached ? ' — Ready to redeem!' : ''}`);
      }
      return;
    }
  };

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.center}> 
        <ActivityIndicator />
        <ThemedText>Requesting camera permission…</ThemedText>
      </ThemedView>
    );
  }
  if (hasPermission === false) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Camera permission not granted.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Scan QR</ThemedText>
      {Platform.OS === 'web' ? (
        <View style={styles.center}>
          <ThemedText>QR scanning is limited on web. Use a native device for best results.</ThemedText>
        </View>
      ) : null}
      <View style={styles.scannerWrap}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : (e) => {
            setScanned(true);
            handleData(e.data).finally(() => setTimeout(() => setScanned(false), 1200));
          }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <Button title="Reset scanner" onPress={() => setScanned(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scannerWrap: {
    overflow: 'hidden',
    borderRadius: 12,
    aspectRatio: 3/4,
    width: '100%',
    backgroundColor: 'black'
  }
});
