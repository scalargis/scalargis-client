/**
 * MapToolButton: the shared map-chrome ActionIcon wiring. The ~8 existing
 * adopters (MapControls, Basemaps, StreetView, ...) never pass size/variant/
 * color/radius, so the "chrome mode" defaults below must stay byte-identical
 * for them; passing any of the four opts a caller into "plain mode" — the
 * a11y wiring without the forced map-chrome look (B-09).
 *
 * `@mantine/core` is mocked to a bare <button> that echoes every prop it
 * receives as data-* attributes: this isolates MapToolButton's own prop/
 * class/style logic from Mantine's ActionIcon internals (which expose no
 * DOM-visible variant/color/radius signal of their own), and needs no
 * MantineProvider/matchMedia shim.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@mantine/core', () => {
  const ActionIcon = ({
    children,
    title,
    onClick,
    className,
    style,
    variant,
    color,
    radius,
    size,
    ...rest
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={className}
      style={style}
      data-variant={variant}
      data-color={color}
      data-radius={radius}
      data-size={size}
      {...rest}
    >
      {children}
    </button>
  );
  ActionIcon.Group = ({ children, ...rest }) => (
    <div data-testid="action-icon-group" {...rest}>
      {children}
    </div>
  );
  return { ActionIcon };
});

// eslint-disable-next-line import/first
import MapToolButton from './MapToolButton';

describe('MapToolButton — chrome mode (defaults, no new props)', () => {
  it('applies the map-chrome class, filled variant, xl radius and the size CSS var', () => {
    render(<MapToolButton icon="stub-icon" title="Mapas de base" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'Mapas de base' });

    expect(button.className).toContain('map-tool-btn');
    expect(button.getAttribute('data-variant')).toBe('filled');
    expect(button.getAttribute('data-radius')).toBe('xl');
    expect(button.style.getPropertyValue('--ai-size')).toBe('var(--map-control-size, var(--ai-size-lg))');
  });

  it('adds the active class and aria-pressed=true when active, omits aria-pressed when active is unset', () => {
    const { rerender } = render(<MapToolButton icon="x" title="Toggle" active onClick={() => {}} />);
    let button = screen.getByRole('button', { name: 'Toggle' });
    expect(button.className).toContain('active');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    rerender(<MapToolButton icon="x" title="Toggle" onClick={() => {}} />);
    button = screen.getByRole('button', { name: 'Toggle' });
    expect(button.getAttribute('aria-pressed')).toBeNull();
  });

  it('fires onClick and merges a caller className', () => {
    const onClick = vi.fn();
    render(<MapToolButton icon="x" title="Click me" className="extra" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button.className).toContain('extra');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a className-string icon as an <i>, a rendered icon element as-is, and a custom child when given one', () => {
    const { container, rerender } = render(<MapToolButton icon="stub-icon" title="Zoom" onClick={() => {}} />);
    expect(container.querySelector('i.stub-icon')).not.toBeNull();

    // The @scalargis/ui recipe icons are passed as rendered elements, not class strings.
    rerender(<MapToolButton icon={<span data-testid="icon-node" />} title="Zoom" onClick={() => {}} />);
    expect(screen.getByTestId('icon-node')).toBeTruthy();

    rerender(<MapToolButton icon="stub-icon" title="Zoom" onClick={() => {}}><span>Custom</span></MapToolButton>);
    expect(screen.getByText('Custom')).toBeTruthy();
  });
});

describe('MapToolButton — plain mode (size/variant/color/radius opted in)', () => {
  it('drops the map-chrome class and the size CSS var once any of the four is passed', () => {
    render(<MapToolButton icon="stub-icon" title="Apagar" size="md" variant="default" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'Apagar' });

    expect(button.className).not.toContain('map-tool-btn');
    expect(button.style.getPropertyValue('--ai-size')).toBe('');
    expect(button.getAttribute('data-variant')).toBe('default');
    // radius wasn't passed either, and plain mode does not default it to xl.
    expect(button.getAttribute('data-radius')).toBeNull();
  });

  it('forwards size/variant/color/radius straight to the ActionIcon', () => {
    render(
      <MapToolButton
        icon="stub-icon"
        title="Eliminar"
        size="md"
        variant="filled"
        color="danger"
        radius="xl"
        onClick={() => {}}
      />
    );
    const button = screen.getByRole('button', { name: 'Eliminar' });
    expect(button.getAttribute('data-variant')).toBe('filled');
    expect(button.getAttribute('data-color')).toBe('danger');
    expect(button.getAttribute('data-size')).toBe('md');
    expect(button.getAttribute('data-radius')).toBe('xl');
  });

  it('still wires title/aria-label/aria-pressed in plain mode', () => {
    render(
      <MapToolButton icon="stub-icon" title="Ferramenta" size="md" variant="default" active onClick={() => {}} />
    );
    const button = screen.getByRole('button', { name: 'Ferramenta' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    // Plain mode never adds the chrome's own .active class.
    expect(button.className).not.toContain('active');
  });
});

describe('MapToolButton.Group', () => {
  it('wraps its children in an ActionIcon.Group', () => {
    render(
      <MapToolButton.Group>
        <MapToolButton icon="stub-icon" title="Anterior" size="lg" variant="filled" onClick={() => {}} />
        <MapToolButton icon="stub-icon" title="Seguinte" size="lg" variant="filled" onClick={() => {}} />
      </MapToolButton.Group>
    );

    const group = screen.getByTestId('action-icon-group');
    expect(group.querySelectorAll('button')).toHaveLength(2);
  });
});
