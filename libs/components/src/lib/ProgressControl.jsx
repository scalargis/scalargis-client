import React from 'react';
import { Loader } from '@mantine/core';


export default function ProgressControl(props) {

  return (
    <>
      <Loader size={40} />
      <div>{ props.children }</div>
    </>
  );

}
