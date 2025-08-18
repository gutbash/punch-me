import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, ActivityIndicator, Button, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { parseScanData } from '@/lib/qr';
import { getCardByEstablishment, upsertCard, incrementPunch } from '@/lib/storage';
import { LoyaltyCard } from '@/lib/types';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

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

  if (!permission) {
    return (
      <ThemedView style={styles.center}> 
        <ActivityIndicator />
        <ThemedText>Loading camera permissions…</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Camera permission is required to scan QR codes</ThemedText>
        <Button title="Grant permission" onPress={requestPermission} />
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
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : (result) => {
            setScanned(true);
            handleData(result.data).finally(() => 
              setTimeout(() => setScanned(false), 1200)
            );
          }}
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