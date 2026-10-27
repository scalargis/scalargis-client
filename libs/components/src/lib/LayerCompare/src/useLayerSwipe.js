import { useEffect, useRef } from 'react';
import { getRenderPixel } from 'ol/render';

function clipContext(ctx, tl, tr, bl, br) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.closePath();
  ctx.clip();
}

function restoreContext(event) {
  event.context.restore();
}

/** Clips two OpenLayers layers to the sides of a swipe line, or blends them by opacity. */
export default function useLayerSwipe({ map, leftLayer, rightLayer, mode = 'swipe', swipe = 50, opacity = 50, active = true }) {

  const swipeRef = useRef(swipe);

  useEffect(() => {
    swipeRef.current = swipe;
    if (map && active && mode === 'swipe') map.render();
  }, [swipe]);

  useEffect(() => {
    if (!map || !active) return;

    const leftPre = (event) => {
      const mapSize = map.getSize();
      const width = mapSize[0] * (swipeRef.current / 100);
      clipContext(event.context,
        getRenderPixel(event, [0, 0]),
        getRenderPixel(event, [width - 1, 0]),
        getRenderPixel(event, [0, mapSize[1]]),
        getRenderPixel(event, [width - 1, mapSize[1]]));
    };

    const rightPre = (event) => {
      const mapSize = map.getSize();
      const width = mapSize[0] * (swipeRef.current / 100);
      clipContext(event.context,
        getRenderPixel(event, [width + 1, 0]),
        getRenderPixel(event, [mapSize[0], 0]),
        getRenderPixel(event, [width + 1, mapSize[1]]),
        getRenderPixel(event, mapSize));
    };

    const sides = [[leftLayer, leftPre], [rightLayer, rightPre]].filter(([layer]) => !!layer);

    if (mode === 'swipe') {
      sides.forEach(([layer, pre]) => {
        layer.on('prerender', pre);
        layer.on('postrender', restoreContext);
      });
    }
    map.render();

    return () => {
      sides.forEach(([layer, pre]) => {
        layer.un('prerender', pre);
        layer.un('postrender', restoreContext);
        layer.setOpacity(1);
      });
      map.render();
    };
  }, [map, leftLayer, rightLayer, mode, active]);

  useEffect(() => {
    if (!active || mode !== 'opacity') return;
    if (leftLayer) leftLayer.setOpacity(opacity / 100);
    if (rightLayer) rightLayer.setOpacity(1 - opacity / 100);
  }, [leftLayer, rightLayer, mode, opacity, active]);
}
