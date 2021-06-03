import React from 'react';
import { AttributionText } from '../../shared/atoms/AttributionText';
import { LocaleString, useCreateLocaleString } from '../../shared/components/LocaleString';
import { useManifest } from '../hooks/use-manifest';

export const RequiredStatement: React.FC = () => {
  const { data: manifest } = useManifest();
  const createLocaleString = useCreateLocaleString();

  return (
    <>
      {manifest?.manifest?.requiredStatement ? (
        <AttributionText title={createLocaleString(manifest.manifest.requiredStatement.label)}>
          <LocaleString enableDangerouslySetInnerHTML={true}>{manifest.manifest.requiredStatement.value}</LocaleString>
        </AttributionText>
      ) : null}
    </>
  );
};