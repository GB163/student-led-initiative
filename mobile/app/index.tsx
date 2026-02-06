import { View, ActivityIndicator, StyleSheet } from 'react-native';

// ✅ The _layout.tsx handles all routing logic
// This is just a loading screen that users will never actually see
// because _layout.tsx redirects them immediately

export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#667eea" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});