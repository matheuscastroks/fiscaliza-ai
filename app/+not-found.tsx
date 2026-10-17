import { MaterialIcons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  BounceIn,
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Animação do ícone
    iconScale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
    
    iconRotation.value = withSequence(
      withDelay(300, withSpring(10, { damping: 12 })),
      withSpring(-10, { damping: 12 }),
      withSpring(0, { damping: 15 })
    );

    // Animação do conteúdo
    contentOpacity.value = withDelay(200, withSpring(1, {
      damping: 20,
      stiffness: 100,
    }));
  }, [iconScale, iconRotation, contentOpacity]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` }
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Decorative background circles */}
        <Animated.View 
          entering={FadeIn.delay(400).duration(1000)}
          style={styles.backgroundCircle1} 
        />
        <Animated.View 
          entering={FadeIn.delay(600).duration(1000)}
          style={styles.backgroundCircle2} 
        />

        <View style={styles.content}>
          {/* Animated Icon */}
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <MaterialIcons name="search-off" size={120} color="#2E7D32" />
          </Animated.View>

          {/* Error Code */}
          <Animated.Text 
            entering={BounceIn.delay(300).duration(800)}
            style={styles.errorCode}
          >
            404
          </Animated.Text>

          {/* Main Message */}
          <Animated.View 
            entering={SlideInDown.delay(500).duration(600)}
            style={contentAnimatedStyle}
          >
            <Text style={styles.title}>Página não encontrada</Text>
            <Text style={styles.subtitle}>
              Ops! A página que você está procurando não existe ou foi movida.
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View 
            entering={SlideInDown.delay(700).duration(600)}
            style={styles.buttonsContainer}
          >
            <Link href="/" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <MaterialIcons name="home" size={24} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Voltar ao Início</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/(tabs)/ReportScreen" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <MaterialIcons name="add-circle-outline" size={24} color="#2E7D32" />
                <Text style={styles.secondaryButtonText}>Reportar Problema</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>

          {/* Help Text */}
          <Animated.View 
            entering={FadeIn.delay(900).duration(600)}
            style={styles.helpContainer}
          >
            <MaterialIcons name="info-outline" size={20} color="#757575" />
            <Text style={styles.helpText}>
              Se você acredita que isso é um erro, entre em contato conosco.
            </Text>
          </Animated.View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  backgroundCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E8F5E8',
    opacity: 0.6,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E8F5E8',
    opacity: 0.4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: '#E8F5E8',
    padding: 30,
    borderRadius: 80,
    elevation: 5,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 10,
    textShadowColor: 'rgba(46, 125, 50, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    flexShrink: 1,
  },
});
