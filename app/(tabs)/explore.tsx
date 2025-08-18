import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import AddCard from '@/components/AddCard';

export default function TabTwoScreen() {
  return (
    <ThemedView style={styles.container}>
      <AddCard />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  }
});