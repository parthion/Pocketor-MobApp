/**
 * CalculationPreview Screen
 * Renders a SchemaForm from a product config and shows the server-calculated schedule.
 * Falls back to existing loan creation flow if no config available.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SchemaForm from '../../components/SchemaForm';
import { fetchProductConfig, calcFromConfig, ProductConfig } from '../../service/productConfig.service';
import { useAuth } from '../../context/AuthContext';

export default function CalculationPreview() {
  const { configId } = useLocalSearchParams<{ configId: string }>();
  const { token }    = useAuth();
  const router       = useRouter();

  const [config,   setConfig]   = useState<ProductConfig | null>(null);
  const [result,   setResult]   = useState<{ summary: any; schedule: any[] } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [calcBusy, setCalcBusy] = useState(false);

  useEffect(() => {
    if (!configId || !token) { setLoading(false); return; }
    fetchProductConfig(token, configId)
      .then(setConfig)
      .finally(() => setLoading(false));
  }, [configId, token]);

  const handleCalc = async (inputs: Record<string, any>) => {
    if (!token || !configId) return;
    setCalcBusy(true);
    try {
      const res = await calcFromConfig(token, configId, inputs);
      setResult(res);
    } catch (e: any) {
      Alert.alert('Calculation Error', e.message);
    } finally {
      setCalcBusy(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;

  // Fallback: no config — let parent/caller use the existing hardcoded flow
  if (!config) {
    return (
      <View style={styles.center}>
        <Text style={styles.fallback}>No product config found. Using default flow.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{config.name}</Text>
      <Text style={styles.sub}>v{config.version}</Text>

      <SchemaForm
        schema={config.jsonSchema}
        onSubmit={handleCalc}
        submitLabel={calcBusy ? 'Calculating…' : 'Preview Schedule'}
      />

      {result && (
        <>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Summary</Text>
            {Object.entries(result.summary).map(([k, v]) => (
              <Text key={k} style={styles.summaryRow}>
                {k}: <Text style={styles.summaryVal}>{String(v)}</Text>
              </Text>
            ))}
          </View>

          <Text style={styles.scheduleTitle}>Repayment Schedule</Text>
          <FlatList
            data={result.schedule}
            keyExtractor={(item) => String(item.installmentNo)}
            renderItem={({ item }) => (
              <View style={styles.scheduleRow}>
                <Text style={styles.cell}>#{item.installmentNo}</Text>
                <Text style={styles.cell}>{item.dueDate}</Text>
                <Text style={styles.cell}>₹{item.totalDue}</Text>
                <Text style={styles.cell}>bal ₹{item.balance}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallback:      { color: '#666', fontSize: 14, textAlign: 'center', padding: 16 },
  title:         { fontSize: 20, fontWeight: '700', padding: 16, paddingBottom: 2 },
  sub:           { fontSize: 12, color: '#888', paddingHorizontal: 16, marginBottom: 8 },
  summaryBox:    { margin: 16, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 10 },
  summaryTitle:  { fontWeight: '700', marginBottom: 6, color: '#1a365d' },
  summaryRow:    { fontSize: 13, marginBottom: 2, color: '#333' },
  summaryVal:    { fontWeight: '600' },
  scheduleTitle: { fontWeight: '700', paddingHorizontal: 16, marginBottom: 4, color: '#1a365d' },
  scheduleRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cell:          { flex: 1, fontSize: 12, color: '#333' },
});
