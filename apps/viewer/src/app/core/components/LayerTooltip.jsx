import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import OlVectorLayer from 'ol/layer/Vector';
import { MapTip } from '@scalargis/ui';

/** Returns the tooltip text of a feature for a layer `tooltip.field`, or null when the value is empty. */
function tooltipText(feature, field) {
  const value = feature.get(field);
  if (value === null || typeof value === 'undefined' || typeof value === 'object') return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

/** Shows the `tooltip.field` value of the top vector feature under the pointer, with no network request. */
const LayerTooltip = ({ olMap }) => {
  const [tip, setTip] = useState(null);

  useEffect(() => {
    if (!olMap) return;
    const viewport = olMap.getViewport();

    function onPointerMove(evt) {
      if (evt.dragging) {
        setTip(null);
        return;
      }
      let found = null;
      olMap.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => {
          found = { feature, field: layer.get('tooltip').field };
          return true;
        },
        { layerFilter: layer => layer instanceof OlVectorLayer && !!layer.get('tooltip')?.field }
      );
      const text = found ? tooltipText(found.feature, found.field) : null;
      setTip(text ? { text, pixel: evt.pixel } : null);
    }

    function onLeave() {
      setTip(null);
    }

    olMap.on('pointermove', onPointerMove);
    viewport.addEventListener('pointerleave', onLeave);
    return () => {
      olMap.un('pointermove', onPointerMove);
      viewport.removeEventListener('pointerleave', onLeave);
    };
  }, [olMap]);

  if (!olMap || !tip) return null;
  return createPortal(<MapTip pixel={tip.pixel} variant="dark">{tip.text}</MapTip>, olMap.getViewport());
};

export default LayerTooltip;
