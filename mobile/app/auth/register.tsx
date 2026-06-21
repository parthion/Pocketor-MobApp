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
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RegistrationStep = 'details' | 'otp' | 'complete';

export default function RegisterScreen() {
  const [step, setStep] = useState<RegistrationStep>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, validateEmail, validatePhone, validatePassword, sendOTP, verifyOTP } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Validate email domain
  const validateEmailDomain = (email: string): boolean => {
    const allowedDomains = [
      'gmail.com',
      'yahoo.com',
      'yahoo.co.in',
      'hotmail.com',
      'aol.com',
      'msn.com',
      'rediffmail.com',
      'ymail.com',
      'outlook.com',
      'live.com',
      'live.in',
      'icloud.com'
    ];
    
    const emailDomain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.includes(emailDomain);
  };

  const handleValidateAndSendOTP = async () => {
    setErrors([]);

    // Validate all fields
    if (!name.trim()) {
      setErrors(['Name is required']);
      return;
    }

    if (!email.trim()) {
      setErrors(['Email Address is required']);
      return;
    }

    if (!validateEmail(email)) {
      setErrors(['Please enter a valid email address']);
      return;
    }

    if (!validateEmailDomain(email)) {
      setErrors([
        'Invalid email domain. Only following domains are allowed: gmail.com, yahoo.com, yahoo.co.in, hotmail.com, aol.com, msn.com, rediffmail.com, ymail.com, outlook.com, live.com, live.in, icloud.com'
      ]);
      return;
    }

    if (!phone.trim()) {
      setErrors(['Phone Number is required']);
      return;
    }

    if (!validatePhone(phone)) {
      setErrors(['Please enter a valid 10-digit mobile number']);
      return;
    }

    if (!password.trim()) {
      setErrors(['Password is required']);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrors(passwordValidation.errors);
      return;
    }

    if (!confirmPassword.trim()) {
      setErrors(['Please confirm your password']);
      return;
    }

    if (password !== confirmPassword) {
      setErrors(['Passwords do not match']);
      return;
    }

    // Send OTP to email
    setLoading(true);
    try {
      const result = await sendOTP(email);
      
      if (result.success) {
        // Store the OTP for development (in production, this would be sent via email)
        if (result.otp) {
          setGeneratedOtp(result.otp);
          console.log('OTP sent to email:', result.otp);
        }
        
        setStep('otp');
        setErrors([]);
      } else {
        setErrors([result.message || 'Failed to send OTP']);
      }
    } catch (error) {
      setErrors(['Failed to send OTP. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndRegister = async () => {
    setErrors([]);

    if (!otp.trim()) {
      setErrors(['Please enter the OTP']);
      return;
    }

    if (otp.length !== 6) {
      setErrors(['OTP must be 6 digits']);
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      const verifyResult = await verifyOTP(email, otp);
      
      if (!verifyResult.success) {
        setErrors([verifyResult.message]);
        setLoading(false);
        return;
      }

      // Register user
      const registerResult = await register(email, password, name, phone);
      
      if (registerResult.success) {
        // Clear all fields
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setGeneratedOtp('');
        setErrors([]);
        
        // Show success alert and navigate to login
        Alert.alert(
          '✅ Success',
          'Registration completed successfully! Please login with your credentials.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to login page
                router.replace('/auth/login');
              },
            },
          ]
        );
      } else {
        setErrors([registerResult.message]);
      }
    } catch (error) {
      setErrors(['Registration failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('details');
      setOtp('');
      setErrors([]);
    } else {
      router.back();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Pocketor</Text>
          <Text style={styles.subtitle}>Join us to start with Pocketor</Text>
        </View>

        {step === 'details' ? (
          // Step 1: User Details
          <>
            {/* Error Messages */}
            {errors.length > 0 && (
              <View style={styles.errorContainer}>
                {errors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    {error}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.form}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Mobile */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Text style={styles.hint}>10-digit number (required for verification)</Text>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hint}>
                  Minimum 6 characters with uppercase, lowercase, and numbers
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Next Button */}
              <TouchableOpacity
                style={[styles.nextButton, loading && styles.buttonDisabled]}
                onPress={handleValidateAndSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>Next</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login Link */}
              <View style={styles.backToLoginContainer}>
                <Text style={styles.backToLoginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/auth/login')} disabled={loading}>
                  <Text style={styles.backToLoginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          // Step 2: OTP Verification
          <>
            <View style={styles.otpContainer}>
              <Text style={styles.otpTitle}>Hi {name},</Text>
              <Text style={styles.otpSubtitle}>
                OTP has been sent to{' '}
                <Text style={styles.emailHighlight}>{email}</Text>. Please enter
                the OTP to complete the registration.
              </Text>

              {/* Error Messages */}
              {errors.length > 0 && (
                <View style={styles.errorContainer}>
                  {errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      {error}
                    </Text>
                  ))}
                </View>
              )}

              {/* OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OTP</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {/* Development only - show OTP */}
              {__DEV__ && generatedOtp && (
                <View style={styles.devOtpContainer}>
                  <Text style={styles.devOtpText}>
                    Dev OTP: {generatedOtp}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButtonOtp}
                  onPress={handleBack}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTPAndRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By registering and logging in, you agree to our{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text> and{' '}
                <Text style={styles.termsLink}>Terms and Conditions</Text>
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
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
  subtitle: {
    fontSize: 14,
    color: '#666',
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
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  errorContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#CC2F2F',
    fontSize: 13,
  },
  nextButton: {
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
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  otpContainer: {
    width: '100%',
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    lineHeight: 20,
  },
  emailHighlight: {
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  backButtonOtp: {
    flex: 1,
    height: 50,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c757d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 30,
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#00A3FF',
    textDecorationLine: 'underline',
  },
  devOtpContainer: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  devOtpText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  backToLoginText: {
    fontSize: 13,
    color: '#666',
  },
  backToLoginLink: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
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
});
