import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

/** Photo-first contribution card. Never substitutes a stock photo for evidence. */
export function RecordCard({
  title,
  label,
  meta,
  summary,
  image,
  onPress,
  children,
  action = 'Ver detalhes',
}: {
  title: string;
  label: string;
  meta: string;
  summary?: string;
  image?: string;
  onPress: () => void;
  children?: React.ReactNode;
  action?: string;
}) {
  const [failedImage, setFailedImage] = useState<string>();
  const photo = Boolean(image && failedImage !== image);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${label}, ${meta}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
    >
      {photo && (
        <Image
          source={{ uri: image }}
          contentFit="cover"
          style={styles.photo}
          onError={() => setFailedImage(image)}
          accessibilityLabel={`Foto de ${title}`}
        />
      )}
      {photo && <View style={styles.photoSpace} />}
      <View style={styles.content}>
        {photo && (
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(15,18,20,0)',
              'rgba(15,18,20,0.78)',
              'rgba(15,18,20,0.96)',
            ]}
            locations={[0, 0.32, 1]}
            style={styles.scrim}
          />
        )}
        <AppText variant="meta" color={photo ? 'white' : 'muted'}>
          {label}
        </AppText>
        <AppText
          variant="sectionTitle"
          color={photo ? 'white' : 'ink'}
          numberOfLines={3}
        >
          {title}
        </AppText>
        {summary && !photo && (
          <AppText color="muted" numberOfLines={3}>
            {summary}
          </AppText>
        )}
        <AppText
          variant="meta"
          color={photo ? 'white' : 'muted'}
          numberOfLines={2}
        >
          {meta}
        </AppText>
        {!photo && children}
        <View style={[styles.action, photo && styles.photoAction]}>
          <AppText variant="label" color={photo ? 'white' : 'ink'}>
            {action}
          </AppText>
          <View style={[styles.arrow, photo && styles.photoArrow]}>
            <Ionicons
              name="arrow-forward"
              size={22}
              color={photo ? colors.ink : colors.white}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.radius.card,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  photo: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  photoSpace: { height: 148 },
  content: { padding: spacing.lg, gap: spacing.xs },
  scrim: { position: 'absolute', left: 0, right: 0, top: -100, bottom: 0 },
  action: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  photoAction: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: layout.radius.pill,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  arrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoArrow: { backgroundColor: colors.white },
});
