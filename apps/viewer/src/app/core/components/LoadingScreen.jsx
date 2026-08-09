import React from 'react';
import { Progress } from '@mantine/core';

function LoadingScreen(props) {
  return (
    <div className="loadingscreen">
      <div>
        <Progress value={100} animated size="sm" aria-label="loading" />
      </div>
    </div>
  )
}

export default LoadingScreen;