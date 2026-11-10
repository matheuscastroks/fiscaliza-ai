import { useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
import { createCityStyles } from '@/features/city/CityUI';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { router } from 'expo-router';

const answers: { question: string; answer: string }[] = [
  {
    question: 'Como vejo os chamados perto de mim?',
    answer:
      'Na aba Explorar, toque no nome do lugar no topo. Escolha "Minha localização", um bairro ou um lugar que você salvou. Você não precisa de conta.',
  },
  {
    question: 'Como escolho o bairro que abre primeiro?',
    answer:
      'Em Preferências, escolha o seu bairro. Na aba Explorar você pode ver outros bairros sem mudar essa escolha.',
  },
  {
    question: 'Como vejo escolas, postos de saúde e praças?',
    answer:
      'Na aba Explorar, toque em "Serviços" e escolha o que quer ver. A lista mostra todos, até os que não aparecem no mapa.',
  },
  {
    question: 'Como peço um serviço, como tapar um buraco?',
    answer:
      'Na aba Agir, escolha o canal oficial: telefone 1746, WhatsApp ou portal. O pedido é feito lá, não no Fiscaliza aí. Salvar um chamado aqui não envia nada à Prefeitura.',
  },
  {
    question: 'Como acompanho um chamado?',
    answer:
      'Toque em Salvar no chamado. Ele fica na aba Salvos, neste celular. Arraste a tela para baixo para atualizar. Se estiver sem internet, você continua vendo o que já salvou.',
  },
  {
    question: 'O que quer dizer "encerrado"?',
    answer:
      'É a situação que a Prefeitura informou. Encerrado não garante que o problema foi resolvido. Se continuar, confira o protocolo ou faça um novo pedido pela aba Agir.',
  },
  {
    question: 'Por que não achei chamados na minha rua?',
    answer:
      'Os dados são atualizados de tempos em tempos e nem todo chamado tem local no mapa. Não achar aqui não quer dizer que não exista. Veja também a lista e os canais oficiais.',
  },
  {
    question: 'O app funciona com leitor de tela e letra grande?',
    answer:
      'Sim. Os textos acompanham o tamanho de letra do celular e os botões têm descrição para o TalkBack. Se algo falhar, tente de novo; o resto do app continua funcionando.',
  },
];

export default function HelpScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

  return (
    <AppScreen>
      <AppHeader title="Ajuda" onBack={() => goBack()} />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 20 }}>
          <InsetGroup>
            <ListRow
              icon="book-outline"
              title="Rever a apresentação"
              subtitle="Como o app funciona, em duas telas"
              onPress={() => router.push('/OnboardingScreen')}
            />
          </InsetGroup>
          {answers.map((item) => (
            <View key={item.question} style={{ gap: 6 }}>
              <AppText variant="sectionTitle" accessibilityRole="header">
                {item.question}
              </AppText>
              <AppText>{item.answer}</AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
