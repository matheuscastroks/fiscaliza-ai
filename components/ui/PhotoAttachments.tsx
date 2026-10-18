import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { assetUrl } from '@/services/http';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

export function PhotoAttachments({
  images,
  onChange,
  disabled = false,
  onPreparingChange,
  cameraRequest,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  onPreparingChange?: (preparing: boolean) => void;
  cameraRequest?: string;
}) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const captured = useRef<string | undefined>(undefined);
  const pick = useCallback(
    async (camera = false) => {
      if (picking || disabled || images.length >= 3) return;
      setPicking(true);
      onPreparingChange?.(true);
      setError('');
      try {
        if (
          Platform.OS !== 'web' &&
          !(
            await (camera
              ? ImagePicker.requestCameraPermissionsAsync()
              : ImagePicker.requestMediaLibraryPermissionsAsync())
          ).granted
        ) {
          setError(
            camera
              ? 'Autorize a câmera para fotografar a melhoria.'
              : 'Autorize o acesso às fotos ou continue sem anexos.',
          );
          return;
        }
        const result = await (
          camera
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync
        )({
          mediaTypes: ['images'],
          quality: 0.75,
          base64: Platform.OS === 'web',
        });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        if ((asset.fileSize || 0) > 5 * 1024 * 1024) {
          setError('Escolha uma imagem com até 5 MB.');
          return;
        }
        let uri = asset.uri;
        if (Platform.OS === 'web' && asset.base64)
          uri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
        else if (FileSystem.documentDirectory) {
          const folder = FileSystem.documentDirectory + 'drafts/';
          await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
          uri = folder + Date.now() + '-' + (asset.fileName || 'foto.jpg');
          await FileSystem.copyAsync({ from: asset.uri, to: uri });
        }
        onChange([...images, uri]);
      } catch {
        setError('Não foi possível adicionar a foto. Tente novamente.');
      } finally {
        setPicking(false);
        onPreparingChange?.(false);
      }
    },
    [picking, disabled, images, onChange, onPreparingChange],
  );
  useEffect(() => {
    if (cameraRequest && captured.current !== cameraRequest && !disabled) {
      captured.current = cameraRequest;
      void pick(true);
    }
  }, [cameraRequest, disabled, pick]);
  return (
    <View style={styles.section}>
      <AppText variant="label">Fotos da melhoria</AppText>
      <AppText variant="meta" color="muted">
        Até 3 fotos, com até 5 MB cada.
      </AppText>
      <View style={styles.photos}>
        {images.map((uri, index) => (
          <View key={uri + index} style={styles.photo}>
            <Image
              source={{ uri: assetUrl(uri) }}
              style={styles.image}
              contentFit="cover"
              accessibilityLabel={`Foto da proposta ${index + 1}`}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover foto ${index + 1}`}
              disabled={disabled || picking}
              onPress={() => onChange(images.filter((_, i) => i !== index))}
              style={styles.remove}
            >
              <Ionicons name="close" size={22} color={colors.white} />
            </Pressable>
          </View>
        ))}
      </View>
      {images.length < 3 && (
        <AppButton
          title="Adicionar foto"
          variant="secondary"
          loading={picking}
          disabled={disabled}
          icon={<Ionicons name="camera-outline" size={22} color={colors.ink} />}
          onPress={() => {
            void pick();
          }}
        />
      )}
      {error !== '' && (
        <AppText color="risk" accessibilityRole="alert">
          {error}
        </AppText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: {
    width: 144,
    height: 160,
    borderRadius: layout.radius.panel,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
