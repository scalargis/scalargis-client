import { useEffect, type ComponentType } from 'react';
import merge from 'lodash/merge';
import {
  isDescriptionHidden,
  showAsRequired,
  type ControlProps,
} from '@jsonforms/core';

import { useFocus } from '../util/focus';
import type { MantineCellProps } from '../util/field';

export interface WithInput {
  input: ComponentType<MantineCellProps>;
}

/**
 * The shared control shell. Where the Prime lib rendered label/help text
 * around a bare widget, Mantine inputs own their label, description and
 * error slots — so this wrapper only computes them (plus the visibility
 * and focus behaviour) and hands them to the cell as props. The cell
 * decides placement: Input-shelled widgets spread them as-is, Checkbox
 * puts the label beside the box, Slider wraps in Input.Wrapper.
 *
 * Description/error parity with the Prime lib's two helper lines:
 * description shows while the field is focused (or always, with
 * `showUnfocusedDescription`); the error shows whenever invalid.
 */
export const MantineInputControl = (props: ControlProps & WithInput) => {
  const [focused, onFocus, onBlur] = useFocus();
  const {
    id,
    description,
    path,
    errors,
    label,
    uischema,
    visible,
    required,
    config,
    handleChange,
    input,
  } = props;
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  // Deliberate ScalarGIS deviation carried over from the Prime lib: a control
  // hidden by a rule clears its value, so stale hidden data cannot submit.
  useEffect(() => {
    if (!visible) {
      handleChange(path, undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visibility is the trigger, matching the Prime behaviour
  }, [visible]);

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const InnerComponent = input;

  return (
    <div hidden={!visible} onFocus={onFocus} onBlur={onBlur} id={id}>
      <InnerComponent
        {...props}
        id={id + '-input'}
        isValid={isValid}
        visible={visible}
        label={label}
        description={showDescription ? description : undefined}
        error={isValid ? undefined : errors}
        withAsterisk={showAsRequired(
          required || false,
          appliedUiSchemaOptions.hideRequiredAsterisk
        )}
        // The visual asterisk can be hidden by option; the ARIA fact cannot.
        aria-required={required || undefined}
      />
    </div>
  );
};
