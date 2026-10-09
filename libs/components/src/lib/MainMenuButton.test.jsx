import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@mantine/core', () => {
  const ActionIcon = React.forwardRef(({ children, variant, ...rest }, ref) => (
    <button ref={ref} data-variant={variant} {...rest}>
      {children}
    </button>
  ));
  return { ActionIcon };
});

// eslint-disable-next-line import/first
import MainMenuButton from './MainMenuButton';

const SELECTED = 'p-button-raised p-button-rounded';
const IDLE = 'p-button-raised p-button-rounded p-button-outlined';

function variantOf(props) {
  render(<MainMenuButton title="Tool" icon="fas fa-ruler" {...props} />);
  return screen.getByTitle('Tool').getAttribute('data-variant');
}

describe('MainMenuButton', () => {
  it('is filled when the shell marks it selected', () => {
    expect(variantOf({ className: SELECTED })).toBe('filled');
  });

  it('is outline when the shell marks it unselected', () => {
    expect(variantOf({ className: IDLE })).toBe('outline');
  });

  it('is light when selected and inactive', () => {
    expect(variantOf({ className: SELECTED, inactive: true })).toBe('light');
  });

  it('stays outline when inactive but unselected', () => {
    expect(variantOf({ className: IDLE, inactive: true })).toBe('outline');
  });

  it('lets the active prop win over the class list', () => {
    expect(variantOf({ className: IDLE, active: true })).toBe('filled');
  });

  it('keeps the selected state in aria-pressed while inactive', () => {
    render(<MainMenuButton title="Tool" className={SELECTED} inactive />);
    expect(screen.getByTitle('Tool').getAttribute('aria-pressed')).toBe('true');
  });

  it('drops the p-button classes and keeps the others', () => {
    render(<MainMenuButton title="Tool" className={`${SELECTED} main-menu-btn-image`} />);
    expect(screen.getByTitle('Tool').className).toBe('main-menu-btn-image');
  });
});
