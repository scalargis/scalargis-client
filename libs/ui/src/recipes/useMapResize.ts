/** Dock-panel map-resize seam: dispatch map_add_class / map_remove_class so
 *  #map shrinks while a dock panel is open, and returns to full width on
 *  close or unmount. Presentation stays in @scalargis/ui; the consumer owns
 *  the Redux dispatch and actions. */

import { useEffect } from 'react';

export interface MapResizeActions {
  map_add_class: (className: string) => unknown;
  map_remove_class: (className: string) => unknown;
}

export interface MapResizeDeps {
  dispatch: (action: unknown) => void;
  actions: MapResizeActions;
}

export function useMapResize(
  opened: boolean,
  className: string,
  { dispatch, actions }: MapResizeDeps
): void {
  useEffect(() => {
    if (opened) {
      dispatch(actions.map_add_class(className));
    } else {
      dispatch(actions.map_remove_class(className));
    }
    return () => {
      dispatch(actions.map_remove_class(className));
    };
  }, [opened, className, dispatch, actions]);
}
