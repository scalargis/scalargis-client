import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@mantine/core', () => ({
  TextInput: ({ classNames, variant, ...rest }) => <input {...rest} />,
  Paper: ({ children }) => <div>{children}</div>,
  UnstyledButton: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

vi.mock('@scalargis/ui', () => ({
  IconX: () => null,
  IconSearch: () => null,
  IconSpinner: () => <span data-testid="spinner" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => (typeof fallback === 'string' ? fallback : key) }),
}));

// eslint-disable-next-line import/first
import Main from './Main';

const props = {
  core: { API_URL: '/api' },
  config: {
    url: 'https://geonames.test/search?_filter={filter}',
    mainMap: null,
    dispatch: vi.fn(),
    Models: { MapModel: { getGeometryFromWKT: vi.fn() } },
  },
  actions: {},
  utils: { findOlLayer: vi.fn() },
  record: { config_json: { types: { default: { html: '<span>{name} ({admin_level3})</span>' } } } },
};

let pending;

beforeEach(() => {
  pending = {};
  vi.stubGlobal('fetch', vi.fn((url) => new Promise((resolve) => {
    pending[decodeURIComponent(url.split('_filter=')[1])] = (rows) => resolve({ json: () => rows });
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function type(value) {
  fireEvent.change(screen.getByLabelText('Pesquisar'), { target: { value } });
}

describe('PlacesSearch', () => {
  it('keeps the rows of the newest query when an older answer arrives last', async () => {
    render(<Main {...props} />);
    type('Martim');
    type('Martim Longo');

    await act(async () => pending['Martim Longo']([{ name: 'Martim Longo', admin_level3: 'Alcoutim' }]));
    await act(async () => pending['Martim']([{ name: 'Martim', admin_level3: 'Ponte de Lima' }]));

    expect(screen.getByText('Martim Longo (Alcoutim)')).toBeTruthy();
    expect(screen.queryByText('Martim (Ponte de Lima)')).toBeNull();
    expect(screen.queryByTestId('spinner')).toBeNull();
  });

  it('cancels the older request and encodes the query', () => {
    render(<Main {...props} />);
    type('Martim');
    const first = fetch.mock.calls[0][1].signal;
    type('Martim Longo');

    expect(first.aborted).toBe(true);
    expect(fetch.mock.calls[1][0]).toBe('https://geonames.test/search?_filter=Martim%20Longo');
  });

  it('moves the map to the centre of the place extent', async () => {
    const dispatch = vi.fn();
    const geom = { transform: vi.fn(), getExtent: () => [1000, 2000, 3000, 6000] };
    const layer = { getSource: () => ({ clear: vi.fn(), addFeatures: vi.fn() }) };
    const mainMap = { getView: () => ({ getProjection: () => 'EPSG:3857' }) };
    render(<Main {...props}
      config={{ ...props.config, mainMap, dispatch, buffer: 500,
        Models: { MapModel: { getGeometryFromWKT: () => geom } } }}
      record={{ config_json: { ...props.record.config_json, drawGeometry: false } }}
      actions={{ map_set_extent: (center, extent) => ({ center, extent }) }}
      utils={{ findOlLayer: () => layer }} />);
    type('Martim Longo');
    await act(async () => pending['Martim Longo']([{ name: 'Martim Longo', admin_level3: 'Alcoutim', geom_wkt: 'POINT(0 0)' }]));

    fireEvent.click(screen.getByText('Martim Longo (Alcoutim)'));

    expect(dispatch).toHaveBeenCalledWith({ center: [2000, 4000], extent: [500, 1500, 3500, 6500] });
    expect(screen.queryByText('Martim Longo (Alcoutim)')).toBeNull();
  });

  it('lists a place once when two sources give it', async () => {
    render(<Main {...props} />);
    type('Martim');

    await act(async () => pending['Martim']([
      { name: 'Martim Longo', source: 'DGT', type: 'populatedPlace', admin_code: '080203', admin_level3: 'Alcoutim' },
      { name: 'Martim Longo', source: 'INE', type: 'populatedPlace', admin_code: '080203', admin_level3: 'Alcoutim' },
      { name: 'Martim', source: 'INE', type: 'populatedPlace', admin_code: '170701', admin_level3: 'Murça' },
    ]));

    expect(screen.getAllByText('Martim Longo (Alcoutim)')).toHaveLength(1);
    expect(screen.getByText('Martim (Murça)')).toBeTruthy();
  });

  it('ignores an answer that arrives after the field is cleared', async () => {
    render(<Main {...props} />);
    type('Martim');
    type('');

    await act(async () => pending['Martim']([{ name: 'Martim', admin_level3: 'Ponte de Lima' }]));

    expect(screen.queryByText('Martim (Ponte de Lima)')).toBeNull();
  });
});
