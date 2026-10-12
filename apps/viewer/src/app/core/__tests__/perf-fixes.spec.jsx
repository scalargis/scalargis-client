import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import reducers from '../reducers';
import { layers_update_theme, viewer_update_mapcontrol, viewer_update_mapcontrols } from '../actions';
import ErrorBoundary from '../components/ErrorBoundary';

const rootReducer = reducers.root;

vi.mock('../../AppContext', () => ({ core: { getLoggedUser: () => null } }));

const stateWithControls = () => rootReducer({
  viewer: {
    config_json: {
      layers: [],
      map_controls: [
        { id: 'FeatureInfo', exclusive: true, active: true },
        { id: 'Measure', exclusive: true, active: false },
        { id: 'Coordinates', active: true },
      ]
    }
  }
}, { type: '@@INIT' });

describe('map control updates', () => {
  it('replaces one control without a change to the old array', () => {
    const state = stateWithControls();
    const before = state.viewer.config_json.map_controls;
    const next = rootReducer(state, viewer_update_mapcontrol({ id: 'Measure', exclusive: true, active: true }));
    expect(next.viewer.config_json.map_controls).not.toBe(before);
    expect(before[1].active).toBe(false);
    expect(next.viewer.config_json.map_controls[1].active).toBe(true);
  });

  it('replaces several controls in one update and keeps the others', () => {
    const state = stateWithControls();
    const next = rootReducer(state, viewer_update_mapcontrols([
      { id: 'FeatureInfo', exclusive: true, active: false },
      { id: 'Measure', exclusive: true, active: true },
    ]));
    const controls = next.viewer.config_json.map_controls;
    expect(controls.map(c => c.active)).toEqual([false, true, true]);
    expect(controls[2]).toBe(state.viewer.config_json.map_controls[2]);
  });

  it('ignores an unknown control id', () => {
    const state = stateWithControls();
    const next = rootReducer(state, viewer_update_mapcontrol({ id: 'Nope', active: true }));
    expect(next.viewer.config_json.map_controls.map(c => c.id)).toEqual(['FeatureInfo', 'Measure', 'Coordinates']);
  });
});

describe('theme updates', () => {
  it('gives a new layers array so a group layer renders its changed child', () => {
    const state = rootReducer({
      viewer: {
        config_json: {
          layers: [
            { id: 'group', type: 'GROUP', children: ['child'] },
            { id: 'child', type: 'WMS', opacity: 1 },
          ]
        }
      }
    }, { type: '@@INIT' });
    const before = state.viewer.config_json.layers;
    const next = rootReducer(state, layers_update_theme({ id: 'child', type: 'WMS', opacity: 0.5 }));
    expect(next.viewer.config_json.layers).not.toBe(before);
    expect(before[1].opacity).toBe(1);
    expect(next.viewer.config_json.layers[1].opacity).toBe(0.5);
    expect(next.viewer.config_json.layers[0]).toBe(before[0]);
  });
});

describe('ErrorBoundary', () => {
  it('renders the fallback in place of a child that throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken = () => { throw new Error('boom'); };
    render(
      <div>
        <ErrorBoundary name="Broken" fallback={<span>fallback</span>}><Broken /></ErrorBoundary>
        <span>sibling</span>
      </div>
    );
    expect(screen.getByText('fallback')).toBeTruthy();
    expect(screen.getByText('sibling')).toBeTruthy();
    expect(error.mock.calls.some(args => String(args[0]).includes('"Broken"'))).toBe(true);
    error.mockRestore();
  });
});

describe('fetchShared', () => {
  it('sends one request for callers that ask while it is in flight', async () => {
    const { fetchShared } = await import('../service/fetch');
    const fetchMock = vi.fn(() => Promise.resolve({ status: 200, json: () => Promise.resolve({ a: 1 }) }));
    vi.stubGlobal('fetch', fetchMock);
    const [a, b] = await Promise.all([fetchShared('/api/x'), fetchShared('/api/x')]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ status: 200, json: { a: 1 } });
    expect(b).toBe(a);
    await fetchShared('/api/x');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
