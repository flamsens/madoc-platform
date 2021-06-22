import { captureModelShorthand } from '@capture-models/helpers';
import React from 'react';
import { PageBlockDefinition } from '../../../../extensions/page-blocks/extension';

export function blockConfigFor(Component: any, model: any) {
  const definition: PageBlockDefinition<any, any, any> = {
    type: model.type,
    label: model.label,
    model: model.editor
      ? model.editor.type === 'entity'
        ? model.editor
        : captureModelShorthand(model.editor)
      : undefined,
    render: function PageBlock(props: any) {
      return React.createElement(Component, model.mapToProps ? model.mapToProps(props) : props);
    },
    defaultData: model.defaultProps || {},
    renderType: 'react',
    internal: model.internal,
    requiredContext: model.requiredContext,
    anyContext: model.anyContext,
    customEditor: model.customEditor,
  };

  Component[Symbol.for('slot-model')] = definition;

  return definition;
}