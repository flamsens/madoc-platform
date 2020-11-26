import React from 'react';
import { DemoButton as AtomButton } from '../../../frontend/shared/atoms/DemoButton';

export type Props = {
  children: string;
  /** @default false */
  subtitle?: boolean;
};

/**
 * @uxpincomponent
 */
function DemoButton(props: Props) {
  return <AtomButton {...props} />;
}

export default DemoButton;
