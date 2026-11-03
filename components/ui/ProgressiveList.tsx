import React, { useState, type ReactNode } from 'react';
import { AppButton } from './AppButton';

/** Bounded initial work inside detail scroll views, without nesting vertical lists. */
export function ProgressiveList<T>({ items, renderItem, batchSize = 20 }: {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  batchSize?: number;
}) {
  const [visible, setVisible] = useState(batchSize);
  return <>
    {items.slice(0, visible).map(renderItem)}
    {visible < items.length && <AppButton
      title={`Mostrar mais (${Math.min(visible, items.length)} de ${items.length})`}
      variant="secondary"
      onPress={() => setVisible(count => count + batchSize)}
    />}
  </>;
}
