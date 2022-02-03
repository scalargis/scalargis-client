/// <reference types="react" />
import { ControlProps, ControlState } from '@jsonforms/core';
import { Control } from '@jsonforms/react';
export interface WithInput {
    input: any;
}
export declare abstract class PrimereactInputControl extends Control<ControlProps & WithInput, ControlState> {
    render(): JSX.Element;
}
