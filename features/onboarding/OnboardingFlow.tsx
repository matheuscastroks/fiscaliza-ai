import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { spacing, useTheme } from '@/theme';
import { Illustration, type IllustrationKind } from './Illustration';

const slides: {
  id: IllustrationKind;
  title: string;
  description: string;
  imageLabel: string;
  note: string;
}[] = [
  {
    id: 'territory',
    title: 'Conheça o território',
    description:
      'Veja problemas, propostas, consultas e ações do seu município.',
    imageLabel: 'Pessoas planejando e acompanhando um projeto',
    note: 'Seu CEP conecta você ao município onde mora.',
  },
  {
    id: 'report',
    title: 'Registre o que precisa mudar',
    description:
      'Encontrou um problema? Adicione uma foto, conte o que aconteceu e indique o local.',
    imageLabel: 'Mãos registrando informações em uma prancheta',
    note: 'Antes de registrar, confira se alguém já relatou o mesmo problema.',
  },
  {
    id: 'participation',
    title: 'Proponha e participe',
    description:
      'Sugira melhorias, apoie ideias e responda consultas sobre a cidade.',
    imageLabel:
      'Uma proposta representada por um avião de papel chegando ao alvo',
    note: 'Ocorrências pedem atendimento. Propostas apresentam uma melhoria.',
  },
  {
    id: 'results',
    title: 'Acompanhe e avalie',
    description:
      'Veja as respostas da gestão, acompanhe as ações e avalie os serviços concluídos.',
    imageLabel: 'Pessoas avaliando juntas o resultado de um trabalho',
    note: 'Suas contribuições e os registros que você segue ficam em Acompanhar.',
  },
];

export function OnboardingFlow({
  onFinish,
  replay = false,
}: {
  onFinish: () => Promise<unknown> | void;
  replay?: boolean;
}) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const [viewport, setViewport] = useState(Math.min(width, 1200));
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reduced, setReduced] = useState(false);
  const list = useRef<FlatList<(typeof slides)[number]>>(null);
  const wide = viewport >= 850;
  const pageRef = useRef(page);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  // Keep the current slide after rotation or resizing, without resetting progress.
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    list.current?.scrollToOffset({
      offset: pageRef.current * viewport,
      animated: false,
    });
  }, [viewport]);
  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onFinish();
    } finally {
      setBusy(false);
    }
  };
  const next = () => {
    if (page === slides.length - 1) {
      void finish();
      return;
    }
    const target = Math.min(page + 1, slides.length - 1);
    setPage(target);
    list.current?.scrollToOffset({
      offset: target * viewport,
      animated: !reduced,
    });
  };
  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <View
        onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            padding: spacing.contentPadding,
          }}
        >
          <AppText variant="sectionTitle">Fiscaliza aí</AppText>
          <AppButton
            title={replay ? 'Fechar' : 'Pular'}
            variant="secondary"
            disabled={busy}
            onPress={() => {
              void finish();
            }}
          />
        </View>
        <FlatList
          ref={list}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          extraData={{ viewport, page, wide, height }}
          getItemLayout={(_, index) => ({
            length: viewport,
            offset: viewport * index,
            index,
          })}
          onMomentumScrollEnd={(event) =>
            setPage(
              Math.max(
                0,
                Math.min(
                  slides.length - 1,
                  Math.round(event.nativeEvent.contentOffset.x / viewport),
                ),
              ),
            )
          }
          renderItem={({ item, index }) => (
            <ScrollView
              style={{ width: viewport }}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                padding: spacing.contentPadding,
                paddingVertical: spacing.xl,
              }}
              accessibilityElementsHidden={index !== page}
              importantForAccessibility={
                index === page ? 'auto' : 'no-hide-descendants'
              }
              aria-hidden={index !== page}
            >
              <View
                style={{
                  flexDirection: wide ? 'row' : 'column',
                  alignItems: wide ? 'center' : 'stretch',
                  justifyContent: 'center',
                  gap: wide ? spacing.xxxl : spacing.xl,
                }}
              >
                <View style={{ flex: wide ? 1 : undefined }}>
                  <Illustration
                    kind={item.id}
                    height={
                      wide ? 360 : Math.max(140, Math.min(260, height * 0.3))
                    }
                    label={item.imageLabel}
                  />
                </View>
                <View
                  style={{
                    flex: wide ? 1 : undefined,
                    maxWidth: 440,
                    width: '100%',
                    alignSelf: 'center',
                    gap: spacing.md,
                  }}
                >
                  <AppText variant="caption" color="muted">
                    COMO FUNCIONA
                  </AppText>
                  <AppText variant="screenTitle" accessibilityRole="header">
                    {item.title}
                  </AppText>
                  <AppText>{item.description}</AppText>
                  <AppText variant="meta" color="muted">
                    {item.note}
                  </AppText>
                </View>
              </View>
            </ScrollView>
          )}
        />
        <View
          style={{
            padding: spacing.contentPadding,
            gap: spacing.lg,
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{ flexDirection: 'row', gap: spacing.xs }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              aria-hidden
            >
              {slides.map((slide, index) => (
                <View
                  key={slide.id}
                  style={{
                    height: 6,
                    width: index === page ? 24 : 6,
                    borderRadius: 3,
                    backgroundColor:
                      index === page ? colors.ink : colors.border,
                  }}
                />
              ))}
            </View>
            <AppText
              variant="caption"
              color="muted"
              accessibilityLiveRegion="polite"
            >
              {page + 1} de {slides.length}
            </AppText>
          </View>
          <AppButton
            title={
              page === slides.length - 1
                ? replay
                  ? 'Voltar ao app'
                  : 'Começar'
                : 'Próximo'
            }
            loading={busy}
            onPress={next}
            icon={
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.onAccent}
              />
            }
          />
        </View>
      </View>
    </AppScreen>
  );
}
