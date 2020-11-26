import * as React from 'react';
import { DemoButton } from '../src/frontend/shared/atoms/DemoButton';

export default { title: 'Demo button' };

export const demoButton: React.FC = () => {
  return (
    <div style={{ padding: '2em' }}>
      <DemoButton>Some button</DemoButton>
    </div>
  );
};
