import AddCard from '@/components/AddCard';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';

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