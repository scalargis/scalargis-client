/** MapTip contract: pixel placement, the variant and border classes, and style passthrough. */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MapTip } from './MapTip';

describe('MapTip', () => {
  it('places the dark tip at the pointer pixel', () => {
    render(<MapTip pixel={[120, 45]}>NIP: 1</MapTip>);

    const tip = screen.getByText('NIP: 1');
    expect(tip.className).toBe('ads-maptip ads-maptip--dark');
    expect(tip.style.left).toBe('120px');
    expect(tip.style.top).toBe('45px');
  });

  it('adds the light variant, the border and a consumer class', () => {
    render(
      <MapTip pixel={[0, 0]} variant="light" withBorder className="extra">
        Beja
      </MapTip>
    );

    expect(screen.getByText('Beja').className).toBe(
      'ads-maptip ads-maptip--light ads-maptip--bordered extra'
    );
  });

  it('merges a consumer style after the position', () => {
    render(
      <MapTip pixel={[10, 20]} style={{ zIndex: 5 }}>
        x
      </MapTip>
    );

    const tip = screen.getByText('x');
    expect(tip.style.zIndex).toBe('5');
    expect(tip.style.left).toBe('10px');
  });
});
