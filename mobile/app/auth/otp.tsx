import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OTPVerificationScreen() {
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const router = useRouter();
  const { verifyOTP, sendOTP } = useAuth();
  const { contact, type } = useLocalSearchParams<{ contact: string; type: 'email' | 'phone' }>();

  // Timer effect for OTP expiry
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    setErrors([]);

    if (!otp.trim()) {
      setErrors(['OTP is required']);
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setErrors(['OTP must be 6 digits']);
      return;
    }

    if (timeLeft <= 0) {
      setErrors(['OTP has expired. Please request a new one.']);
      return;
    }

    setLoading(true);
    try {
      if (!contact) {
        setErrors(['Contact information missing']);
        setLoading(false);
        return;
      }

      const result = await verifyOTP(contact, otp);

      if (result.success) {
        Alert.alert('Success', 'Your ' + type + ' has been verified successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to registration screen or next step
              router.back();
            },
          },
        ]);
      } else {
        setErrors([result.message]);
      }
    } catch (error) {
      setErrors(['An unexpected error occurred']);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setErrors([]);
    setLoading(true);

    try {
      if (!contact) {
        setErrors(['Contact information missing']);
        setLoading(false);
        return;
      }

      const result = await sendOTP(
        type === 'email' ? contact : undefined,
        type === 'phone' ? contact : undefined
      );

      if (result.success) {
        setOTP('');
        setTimeLeft(600); // Reset timer
        Alert.alert('Success', result.message);
      } else {
        setErrors([result.message]);
      }
    } catch (error) {
      setErrors(['Failed to resend OTP']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verify {type === 'email' ? 'Email' : 'Phone'}</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to {contact}
          </Text>
        </View>

        {/* Error Messages */}
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <Text style={styles.errorIcon}>!</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={[styles.input, errors.length > 0 && styles.inputError]}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOTP}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              placeholderTextColor="#999"
            />
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Code expires in:</Text>
            <Text style={[styles.timerText, timeLeft < 60 && styles.timerExpiring]}>
              {formatTimeLeft()}
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={[styles.resendLink, loading && styles.resendDisabled]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    padding: 16,
    marginBottom: 24,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 18,
    color: '#f44336',
    fontWeight: '700',
    marginRight: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    flex: 1,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#fff5f5',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  timerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ff6b35',
  },
  timerExpiring: {
    color: '#f44336',
  },
  button: {
    backgroundColor: '#ff6b35',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '600',
  },
  resendDisabled: {
    opacity: 0.5,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
