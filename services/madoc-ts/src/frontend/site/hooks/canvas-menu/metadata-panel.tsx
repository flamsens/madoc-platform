import React from 'react';
import { useTranslation } from 'react-i18next';
import { MetaDataDisplay } from '../../../shared/components/MetaDataDisplay';
import { useData, usePaginatedData } from '../../../shared/hooks/use-data';
import { InfoIcon } from '../../../shared/icons/InfoIcon';
import { ManifestMetadata } from '../../features/ManifestMetadata';
import { CanvasLoader } from '../../pages/loaders/canvas-loader';
import { ManifestLoader } from '../../pages/loaders/manifest-loader';
import { useRouteContext } from '../use-route-context';
import { CanvasMenuHook } from './types';

export function useMetadataMenu(): CanvasMenuHook {
  const { data } = useData(CanvasLoader, []);
  const { manifestId } = useRouteContext();
  const { resolvedData: manifestData } = usePaginatedData(ManifestLoader, undefined, { enabled: !!manifestId });
  const { t } = useTranslation();
  const canvas = data?.canvas;

  const content = (
    <>
      {canvas && canvas.metadata ? <MetaDataDisplay variation="list" metadata={canvas.metadata} /> : null}
      <ManifestMetadata compact showEmptyMessage />
    </>
  );

  return {
    id: 'metadata',
    label: t('Metadata'),
    icon: <InfoIcon />,
    isLoaded: !!canvas,
    isHidden: canvas && manifestData && !canvas.metadata && !manifestData.manifest.metadata,
    content,
  };
}