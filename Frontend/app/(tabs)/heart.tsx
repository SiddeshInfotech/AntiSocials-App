import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HeartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Heart Screen</Text>
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
  text: {
    fontSize: 20,
    fontWeight: '500',
  },
});
