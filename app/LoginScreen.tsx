import { isValidEmail } from '@/services/mockApi';
import { useAuthStore } from '@/stores/authStore';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSimpleLogin, setShowSimpleLogin] = useState(false);
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // Se já estiver logado, redirecionar
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Limpar erro quando mudar de input
  useEffect(() => {
    clearError();
  }, [email, password, clearError]);

  const handleLogin = async () => {
    // Validações
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Erro', 'Por favor, insira sua senha');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Erro de Login', result.error || 'Não foi possível fazer login');
    }
  };

  const handleGovBrLogin = () => {
    // Simular login rápido com dados de teste
    setEmail('joao.silva@email.com');
    setPassword('123456');
    setShowSimpleLogin(true);
  };

  const fillTestCredentials = () => {
    setEmail('joao.silva@email.com');
    setPassword('123456');
  };

  if (!showSimpleLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Logo e Título */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="location-city" size={80} color="#2E7D32" />
            </View>
            <Text style={styles.title}>Fiscaliza AI</Text>
            <Text style={styles.subtitle}>
              Transforme sua cidade com sua participação
            </Text>
          </View>

          {/* Ilustração */}
          <View style={styles.illustrationContainer}>
            <View style={styles.cityIllustration}>
              <Icon name="apartment" size={60} color="#4CAF50" />
              <Icon name="business" size={50} color="#66BB6A" />
              <Icon name="domain" size={55} color="#81C784" />
            </View>
            <Text style={styles.illustrationText}>
              Reporte problemas, acompanhe soluções e ganhe pontos!
            </Text>
          </View>

          {/* Botões de Login */}
          <View style={styles.loginSection}>
            <TouchableOpacity 
              style={styles.govBrButton}
              onPress={handleGovBrLogin}
            >
              <View style={styles.govBrContent}>
                <Image 
                  source={{ uri: 'https://www.gov.br/++theme++padrao_govbr/img/govbr-colorido.png' }}
                  style={styles.govBrLogo}
                  resizeMode="contain"
                />
                <Text style={styles.govBrText}>Entrar com Gov.br</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.simpleLoginButton}
              onPress={() => setShowSimpleLogin(true)}
            >
              <Text style={styles.simpleLoginText}>Ou fazer login simples</Text>
            </TouchableOpacity>

            <Text style={styles.loginInfo}>
              Use sua conta Gov.br para acessar o Fiscaliza AI de forma segura
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Icon name="report-problem" size={24} color="#FF9800" />
              <Text style={styles.featureText}>Reporte Problemas</Text>
            </View>
            <View style={styles.feature}>
              <Icon name="track-changes" size={24} color="#2196F3" />
              <Text style={styles.featureText}>Acompanhe Soluções</Text>
            </View>
            <View style={styles.feature}>
              <Icon name="emoji-events" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Ganhe Badges</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header com botão voltar */}
          <View style={styles.loginHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowSimpleLogin(false)}
            >
              <Icon name="arrow-back" size={24} color="#2E7D32" />
            </TouchableOpacity>
            <Text style={styles.loginTitle}>Fazer Login</Text>
          </View>

          {/* Logo */}
          <View style={styles.loginLogoContainer}>
            <Icon name="location-city" size={60} color="#2E7D32" />
            <Text style={styles.appName}>Fiscaliza AI</Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Icon name="error" size={20} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu.email@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Icon 
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de teste */}
            <TouchableOpacity 
              style={styles.testButton}
              onPress={fillTestCredentials}
            >
              <Text style={styles.testButtonText}>
                💡 Preencher com dados de teste
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Credenciais de teste */}
            <View style={styles.testCredentials}>
              <Text style={styles.testCredentialsTitle}>Credenciais de teste:</Text>
              <Text style={styles.testCredentialsText}>Email: joao.silva@email.com</Text>
              <Text style={styles.testCredentialsText}>Senha: 123456</Text>
              <Text style={styles.testCredentialsText}>
                Ou use: maria.santos@email.com / carlos.oliveira@email.com
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 50,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cityIllustration: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  illustrationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loginSection: {
    marginVertical: 20,
  },
  govBrButton: {
    backgroundColor: '#1351B4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  govBrContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  govBrLogo: {
    width: 30,
    height: 20,
    marginRight: 12,
  },
  govBrText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  simpleLoginButton: {
    padding: 12,
    alignItems: 'center',
  },
  simpleLoginText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  // Estilos do formulário de login
  loginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 16,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
  },
  form: {
    paddingHorizontal: 24,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 4,
  },
  testButton: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testCredentials: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  testCredentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  testCredentialsText: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 2,
  },
});