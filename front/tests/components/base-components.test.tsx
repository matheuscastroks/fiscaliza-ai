import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { StatusBadge } from '@/components/ui/StatusBadge';

describe('componentes base', () => {
  it('Chip mostra o estado selecionado e responde ao toque', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Abertos" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Abertos' });
    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('IconButton tem nome acessível e responde ao toque', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="menu" accessibilityLabel="Abrir menu" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('StatusBadge sempre mostra a situação em texto', async () => {
    await render(<StatusBadge label="Em andamento" tone="progress" />);
    expect(screen.getByText('Em andamento')).toBeTruthy();
  });

  it('ListRow só vira botão quando tem ação', async () => {
    const onPress = jest.fn();
    await render(
      <InsetGroup>
        <ListRow title="Preferências" subtitle="Tema, bairro e avisos" onPress={onPress} />
        <ListRow title="Somente leitura" />
      </InsetGroup>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Preferências. Tema, bairro e avisos' }));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByText('Somente leitura')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Somente leitura/ })).toBeNull();
  });
});
