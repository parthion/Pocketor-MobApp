/**
 * SchemaForm
 * Renders form fields dynamically from a product_config json_schema.
 * Falls back gracefully when schema is null (uses existing hardcoded flows).
 *
 * json_schema.fields: Array<{ key, label, type: 'number'|'text'|'date'|'select', options?, required? }>
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface FieldDef {
  key: string;
  label: string;
  type: 'number' | 'text' | 'date' | 'select';
  options?: string[];
  required?: boolean;
  defaultValue?: any;
}

interface Props {
  schema: { fields?: FieldDef[] } | null;
  onSubmit: (values: Record<string, any>) => void;
  submitLabel?: string;
}

export default function SchemaForm({ schema, onSubmit, submitLabel = 'Calculate' }: Props) {
  const fields: FieldDef[] = schema?.fields ?? [];
  const initial = Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? '']));
  const [values, setValues] = useState<Record<string, any>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fallback: if no schema, render nothing (parent uses hardcoded screen)
  if (!schema || !fields.length) return null;

  const set = (key: string, val: any) => setValues((v) => ({ ...v, [key]: val }));

  const validate = () => {
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required && (values[f.key] === '' || values[f.key] == null)) {
        errs[f.key] = `${f.label} is required`;
      }
    });
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(values);
  };

  return (
    <ScrollView style={styles.container}>
      {fields.map((field) => (
        <View key={field.key} style={styles.fieldWrap}>
          <Text style={styles.label}>
            {field.label}{field.required ? ' *' : ''}
          </Text>

          {field.type === 'select' ? (
            <View style={styles.optionRow}>
              {(field.options ?? []).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.option, values[field.key] === opt && styles.optionSelected]}
                  onPress={() => set(field.key, opt)}
                >
                  <Text style={values[field.key] === opt ? styles.optionTextSel : styles.optionText}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TextInput
              style={[styles.input, errors[field.key] ? styles.inputError : null]}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
              value={String(values[field.key] ?? '')}
              onChangeText={(v) => set(field.key, field.type === 'number' ? v : v)}
              placeholder={field.label}
            />
          )}

          {errors[field.key] ? (
            <Text style={styles.error}>{errors[field.key]}</Text>
          ) : null}
        </View>
      ))}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>{submitLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, padding: 16 },
  fieldWrap:       { marginBottom: 16 },
  label:           { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#333' },
  input:           { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15 },
  inputError:      { borderColor: '#e53e3e' },
  error:           { color: '#e53e3e', fontSize: 12, marginTop: 2 },
  optionRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  optionSelected:  { backgroundColor: '#3182ce', borderColor: '#3182ce' },
  optionText:      { color: '#333' },
  optionTextSel:   { color: '#fff', fontWeight: '600' },
  submitBtn:       { backgroundColor: '#3182ce', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  submitText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
});
