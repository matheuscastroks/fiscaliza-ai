import { useAuthStore } from '@/stores/authStore';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    BounceIn,
    FadeIn,
    SlideInRight,
    SlideInUp,
} from 'react-native-reanimated';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  color?: string;
}

const AnimatedSettingCard = ({ 
  item, 
  index 
}: { 
  item: SettingItem; 
  index: number; 
}) => {
  const [switchValue, setSwitchValue] = useState(item.value || false);

  const handleToggle = (value: boolean) => {
    setSwitchValue(value);
    item.onToggle?.(value);
  };

  return (
    <Animated.View 
      entering={SlideInRight.delay(index * 100)}
      style={styles.settingCard}
    >
      <TouchableOpacity
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: (item.color || '#2E7D32') + '20' }]}>
            <Icon name={item.icon as any} size={20} color={item.color || '#2E7D32'} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>

        <View style={styles.settingRight}>
          {item.type === 'toggle' ? (
            <Switch
              value={switchValue}
              onValueChange={handleToggle}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={switchValue ? '#2E7D32' : '#f4f3f4'}
            />
          ) : (
            <Icon name="chevron-right" size={20} color="#666" />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedSectionHeader = ({ 
  title, 
  index 
}: { 
  title: string; 
  index: number; 
}) => (
  <Animated.View 
    entering={FadeIn.delay(index * 200)}
    style={styles.sectionHeader}
  >
    <Text style={styles.sectionTitle}>{title}</Text>
  </Animated.View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/LoginScreen');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Esta ação é irreversível. Todos os seus dados serão perdidos permanentemente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso.');
            logout();
            router.replace('/LoginScreen');
          },
        },
      ]
    );
  };

  const showInfo = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const notificationSettings: SettingItem[] = [
    {
      id: 'push_notifications',
      title: 'Notificações Push',
      subtitle: 'Receba atualizações sobre seus reportes',
      icon: 'notifications',
      type: 'toggle',
      value: true,
      onToggle: (value) => console.log('Push notifications:', value),
    },
    {
      id: 'status_updates',
      title: 'Atualizações de Status',
      subtitle: 'Quando um problema muda de status',
      icon: 'update',
      type: 'toggle',
      value: true,
      onToggle: (value) => console.log('Status updates:', value),
    },
    {
      id: 'community_updates',
      title: 'Atividade da Comunidade',
      subtitle: 'Votos e comentários nos seus reportes',
      icon: 'group',
      type: 'toggle',
      value: false,
      onToggle: (value) => console.log('Community updates:', value),
    },
    {
      id: 'news_updates',
      title: 'Novidades do App',
      subtitle: 'Novas funcionalidades e melhorias',
      icon: 'campaign',
      type: 'toggle',
      value: true,
      onToggle: (value) => console.log('News updates:', value),
    },
  ];

  const privacySettings: SettingItem[] = [
    {
      id: 'location_sharing',
      title: 'Compartilhar Localização',
      subtitle: 'Permitir localização precisa nos reportes',
      icon: 'location-on',
      type: 'toggle',
      value: true,
      onToggle: (value) => console.log('Location sharing:', value),
    },
    {
      id: 'anonymous_reports',
      title: 'Reportes Anônimos',
      subtitle: 'Ocultar seu nome nos reportes públicos',
      icon: 'visibility-off',
      type: 'toggle',
      value: false,
      onToggle: (value) => console.log('Anonymous reports:', value),
    },
    {
      id: 'data_usage',
      title: 'Uso de Dados',
      subtitle: 'Gerenciar como seus dados são utilizados',
      icon: 'data-usage',
      type: 'navigation',
      onPress: () => showInfo(
        'Uso de Dados', 
        'Seus dados são utilizados apenas para melhorar o serviço e resolver problemas urbanos. Não compartilhamos informações pessoais com terceiros.'
      ),
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      id: 'edit_profile',
      title: 'Editar Perfil',
      subtitle: 'Nome, foto e informações pessoais',
      icon: 'edit',
      type: 'navigation',
      onPress: () => showInfo('Em Desenvolvimento', 'Esta funcionalidade estará disponível em breve.'),
    },
    {
      id: 'change_password',
      title: 'Alterar Senha',
      subtitle: 'Mude sua senha de acesso',
      icon: 'lock',
      type: 'navigation',
      onPress: () => showInfo('Em Desenvolvimento', 'Esta funcionalidade estará disponível em breve.'),
    },
    {
      id: 'export_data',
      title: 'Exportar Dados',
      subtitle: 'Baixe uma cópia dos seus dados',
      icon: 'download',
      type: 'navigation',
      onPress: () => showInfo(
        'Exportar Dados', 
        'Seus dados serão preparados e enviados por email em até 48 horas.'
      ),
    },
    {
      id: 'delete_account',
      title: 'Excluir Conta',
      subtitle: 'Remover permanentemente sua conta',
      icon: 'delete-forever',
      type: 'navigation',
      color: '#F44336',
      onPress: handleDeleteAccount,
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help_center',
      title: 'Central de Ajuda',
      subtitle: 'FAQ e tutoriais',
      icon: 'help',
      type: 'navigation',
      onPress: () => showInfo(
        'Central de Ajuda', 
        'Acesse nossa base de conhecimento com tutoriais e perguntas frequentes.'
      ),
    },
    {
      id: 'contact_support',
      title: 'Contatar Suporte',
      subtitle: 'Fale conosco diretamente',
      icon: 'support',
      type: 'navigation',
      onPress: () => showInfo(
        'Suporte', 
        'Entre em contato conosco através do email: suporte@fiscaliza-ai.com.br'
      ),
    },
    {
      id: 'report_bug',
      title: 'Reportar Bug',
      subtitle: 'Encontrou um problema no app?',
      icon: 'bug-report',
      type: 'navigation',
      onPress: () => showInfo(
        'Reportar Bug', 
        'Descreva o problema encontrado e nossa equipe técnica irá investigar.'
      ),
    },
    {
      id: 'rate_app',
      title: 'Avaliar App',
      subtitle: 'Deixe sua avaliação na loja',
      icon: 'star',
      type: 'navigation',
      color: '#FFD700',
      onPress: () => showInfo(
        'Avaliar App', 
        'Sua avaliação nos ajuda a melhorar! Obrigado pelo feedback.'
      ),
    },
  ];

  const aboutSettings: SettingItem[] = [
    {
      id: 'version',
      title: 'Versão do App',
      subtitle: '1.0.0 (Build 2024.01)',
      icon: 'info',
      type: 'action',
    },
    {
      id: 'privacy_policy',
      title: 'Política de Privacidade',
      subtitle: 'Como protegemos seus dados',
      icon: 'privacy-tip',
      type: 'navigation',
      onPress: () => showInfo(
        'Política de Privacidade', 
        'Respeitamos sua privacidade e protegemos seus dados pessoais conforme a LGPD.'
      ),
    },
    {
      id: 'terms_of_service',
      title: 'Termos de Uso',
      subtitle: 'Condições de uso do aplicativo',
      icon: 'description',
      type: 'navigation',
      onPress: () => showInfo(
        'Termos de Uso', 
        'Ao usar o Fiscaliza-AI, você concorda com nossos termos e condições.'
      ),
    },
    {
      id: 'licenses',
      title: 'Licenças de Software',
      subtitle: 'Bibliotecas e componentes utilizados',
      icon: 'code',
      type: 'navigation',
      onPress: () => showInfo(
        'Licenças', 
        'Este app utiliza diversas bibliotecas open source. Agradecemos a toda comunidade de desenvolvedores.'
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        entering={SlideInUp.delay(100)}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Personalize sua experiência</Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <Animated.View 
          entering={FadeIn.delay(200)}
          style={styles.userInfoContainer}
        >
          <View style={styles.userAvatar}>
            <Icon name="person" size={32} color="#2E7D32" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
            <Text style={styles.userLevel}>Nível {user?.level || 1} • {user?.points || 0} pontos</Text>
          </View>
        </Animated.View>

        {/* Notifications */}
        <AnimatedSectionHeader title="Notificações" index={1} />
        {notificationSettings.map((item, index) => (
          <AnimatedSettingCard key={item.id} item={item} index={index} />
        ))}

        {/* Privacy */}
        <AnimatedSectionHeader title="Privacidade" index={2} />
        {privacySettings.map((item, index) => (
          <AnimatedSettingCard key={item.id} item={item} index={index} />
        ))}

        {/* Account */}
        <AnimatedSectionHeader title="Conta" index={3} />
        {accountSettings.map((item, index) => (
          <AnimatedSettingCard key={item.id} item={item} index={index} />
        ))}

        {/* Support */}
        <AnimatedSectionHeader title="Suporte" index={4} />
        {supportSettings.map((item, index) => (
          <AnimatedSettingCard key={item.id} item={item} index={index} />
        ))}

        {/* About */}
        <AnimatedSectionHeader title="Sobre" index={5} />
        {aboutSettings.map((item, index) => (
          <AnimatedSettingCard key={item.id} item={item} index={index} />
        ))}

        {/* Logout Button */}
        <Animated.View 
          entering={BounceIn.delay(1000)}
          style={styles.logoutContainer}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  userInfoContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userLevel: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  logoutContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
}); 