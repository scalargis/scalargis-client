import React from 'react';
import { Center, Loader } from '@mantine/core';

function LoadingScreen() {
  return (
    <Center className="loadingscreen" h="100vh">
      <Loader size="lg" />
    </Center>
  )
}

export default LoadingScreen;
