import React from 'react';
import { Progress } from '@mantine/core';

// Mantine's Progress has no indeterminate mode — `value={100} animated` reads as
// "100% / done" for the whole load. Reproduce Prime's indeterminate ProgressBar
// with a narrow section that a CSS keyframe sweeps across the track (the sweep is
// re-stated under prefers-reduced-motion in layout.scss, since a frozen loading
// bar reads as a hang). Progress.Root clips its sections, so the sweep is masked
// at the track edges.
function LoadingScreen(props) {
  return (
    <div className="loadingscreen">
      <div>
        <Progress.Root size="sm" aria-label="loading">
          <Progress.Section value={30} className="loading-indeterminate-bar" />
        </Progress.Root>
      </div>
    </div>
  )
}

export default LoadingScreen;
