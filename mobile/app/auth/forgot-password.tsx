import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

type ForgotPasswordStep = 'email' | 'reset-token' | 'new-password';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const router = useRouter();
  const { forgotPassword, resetPassword, validateEmail, validatePassword } = useAuth();

  const handleForgotPassword = async () => {
    setErrors([]);

    if (!validateEmail(email)) {
      setErrors(['Please enter a valid email address']);
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email);

      if (result.success) {
        Alert.alert('Success', result.message, [
          {
            text: 'OK',
            onPress: () => {
              setStep('reset-token');
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

  const handleResetPassword = async () => {
    setErrors([]);

    if (!resetToken.trim()) {
      setErrors(['Reset token is required']);
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrors(['All password fields are required']);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors(['Passwords do not match']);
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setErrors(passwordValidation.errors);
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email, resetToken, newPassword);

      if (result.success) {
        Alert.alert('Success', result.message, [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/auth/login');
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

  const passwordStrength = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Enter your email to receive a reset code'
              : step === 'reset-token'
              ? 'Enter the reset code from your email'
              : 'Create your new password'}
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
          {/* Step 1: Email */}
          {step === 'email' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, errors.length > 0 && styles.inputError]}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: Reset Token */}
          {step === 'reset-token' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reset Code</Text>
                <TextInput
                  style={[styles.input, errors.length > 0 && styles.inputError]}
                  placeholder="Enter the code from your email"
                  value={resetToken}
                  onChangeText={setResetToken}
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={() => setStep('new-password')}
                disabled={loading || !resetToken.trim()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('email')}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>← Back to Email</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 'new-password' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeIconText}>{showPassword ? '👁' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    {passwordStrength.errors.map((error, index) => (
                      <View key={index} style={styles.strengthItem}>
                        <Text style={styles.strengthX}>✗</Text>
                        <Text style={styles.strengthText}>{error}</Text>
                      </View>
                    ))}
                    {passwordStrength.valid && (
                      <View style={styles.strengthItem}>
                        <Text style={styles.strengthCheck}>✓</Text>
                        <Text style={styles.strengthValid}>Password is strong</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeIconText}>{showConfirmPassword ? '👁' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchIndicator}>
                    <Text
                      style={[
                        styles.matchText,
                        passwordsMatch && styles.matchSuccess,
                        !passwordsMatch && styles.matchError,
                      ]}
                    >
                      {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (!passwordStrength.valid || !passwordsMatch || loading) && styles.buttonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={!passwordStrength.valid || !passwordsMatch || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('reset-token')}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Cancel Button - Always visible */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.replace('/auth/login')}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
    gap: 16,
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
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeIconText: {
    fontSize: 20,
  },
  passwordStrengthContainer: {
    marginTop: 12,
    gap: 6,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthX: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
  },
  strengthText: {
    fontSize: 12,
    color: '#f44336',
  },
  strengthCheck: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  strengthValid: {
    fontSize: 12,
    color: '#4caf50',
  },
  matchIndicator: {
    marginTop: 8,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '500',
  },
  matchSuccess: {
    color: '#4caf50',
  },
  matchError: {
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
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
});
