import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title">About Cirque</ThemedText>
        <ThemedText>
          Cirque is a mobile app designed to help climbers discover and navigate bouldering
          circuits. It provides a curated list of boulders that are:
        </ThemedText>
        <ThemedText style={styles.listItem}>• Fun and engaging</ThemedText>
        <ThemedText style={styles.listItem}>• Walking distance apart</ThemedText>
        <ThemedText style={styles.listItem}>
          • Within a reasonable grade range
        </ThemedText>
        <ThemedText style={styles.listItem}>
          • Accessible with minimal equipment
        </ThemedText>
        <ThemedText>
          The app helps you navigate between problems and track your progress as you work through
          each circuit.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  listItem: {
    marginLeft: 16,
    marginBottom: 8,
  },
});
