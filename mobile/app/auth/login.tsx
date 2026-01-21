import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

type LoginType = 'email' | 'phone';

export default function LoginScreen() {
  const [loginType, setLoginType] = useState<LoginType>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { login, loginWithPhone, validateEmail, validatePhone } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // Reset errors
    setErrors([]);

    if (loginType === 'email') {
      // Email login
      if (!validateEmail(email)) {
        setErrors(['Please enter a valid email address']);
        return;
      }
    } else {
      // Phone login
      if (!validatePhone(phone)) {
        setErrors(['Please enter a valid phone number']);
        return;
      }
    }

    if (!password.trim()) {
      setErrors(['Password is required']);
      return;
    }

    setLoading(true);
    try {
      const result =
        loginType === 'email'
          ? await login(email, password)
          : await loginWithPhone(phone, password);

      if (result.success) {
        // Login successful - navigate immediately
        setTimeout(() => {
          router.replace('/');
        }, 100);
      } else if (!result.isRegistered) {
        // User not registered - offer to register
        Alert.alert(
          'Account Not Found',
          `This ${loginType} is not registered. Would you like to create an account?`,
          [
            {
              text: 'Cancel',
              onPress: () => setErrors([result.message]),
              style: 'cancel',
            },
            {
              text: 'Register',
              onPress: () => {
                router.push('/auth/register');
              },
            },
          ]
        );
      } else {
        // Wrong password
        setErrors([result.message]);
      }
    } catch (error) {
      setErrors(['An unexpected error occurred']);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleNavigateToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Pocketor</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to manage your Account</Text>
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
          {/* Login Type Selector */}
          <View style={styles.loginTypeContainer}>
            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'email' && styles.loginTypeActive]}
              onPress={() => {
                setLoginType('email');
                setPhone('');
                setErrors([]);
              }}
              disabled={loading}
            >
              <Text
                style={[
                  styles.loginTypeText,
                  loginType === 'email' && styles.loginTypeTextActive,
                ]}
              >
                ✉️ Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'phone' && styles.loginTypeActive]}
              onPress={() => {
                setLoginType('phone');
                setEmail('');
                setErrors([]);
              }}
              disabled={loading}
            >
              <Text
                style={[
                  styles.loginTypeText,
                  loginType === 'phone' && styles.loginTypeTextActive,
                ]}
              >
                📱 Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Input */}
          {loginType === 'email' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.length > 0 && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* Phone Input */}
          {loginType === 'phone' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.length > 0 && styles.inputError]}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={(text) => {
                  // Keep only digits
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setPhone(cleaned);
                }}
                editable={!loading}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Text style={styles.hint}>10-digit number for verification</Text>
            </View>
          )}

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelContainer}>
              <Text style={styles.label}>Password *</Text>
              <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                <Text style={styles.forgotPasswordLink}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.length > 0 && styles.inputError]}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleNavigateToRegister} disabled={loading}>
            <Text style={styles.switchLink}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
          <Text style={styles.infoText}>
            • First time? Create a new account{'\n'}
            • Returning user? Sign in with your credentials{'\n'}
            • Verify your email & phone for security{'\n'}
            • Forgot password? Use the reset option
          </Text>
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
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    minHeight: '100%',
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorIcon: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20,
  },
  errorText: {
    color: '#CC2F2F',
    fontSize: 13,
    flex: 1,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  loginTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  loginTypeButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loginTypeActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  loginTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  loginTypeTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    fontSize: 18,
    padding: 8,
  },
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchText: {
    fontSize: 13,
    color: '#666',
  },
  switchLink: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#0066CC',
    lineHeight: 18,
  },
});
