import React, { useMemo } from 'react';
import { LocaleString } from '../../shared/components/LocaleString';
import { CollectionFull } from '../../../types/schemas/collection-full';
import { ManifestFull } from '../../../types/schemas/manifest-full';
import { Link } from 'react-router-dom';
import { Pagination } from '../../shared/components/Pagination';
import { ProjectFull } from '../../../types/schemas/project-full';
import { DisplayBreadcrumbs } from '../../shared/components/Breadcrumbs';
import { ImageStripBox } from '../../shared/atoms/ImageStrip';
import { CroppedImage } from '../../shared/atoms/Images';
import { Heading5 } from '../../shared/atoms/Heading5';
import { ImageGrid } from '../../shared/atoms/ImageGrid';
import { useTranslation } from 'react-i18next';
import { createLink } from '../../shared/utility/create-link';
import { parseUrn } from '../../../utility/parse-urn';
import { CanvasStatus } from '../../shared/atoms/CanvasStatus';
import { Button } from '../../shared/atoms/Button';
import { HrefLink } from '../../shared/utility/href-link';
import { useLocationQuery } from '../../shared/hooks/use-location-query';

export const ViewManifest: React.FC<{
  project?: ProjectFull;
  collection?: CollectionFull['collection'];
  manifest: ManifestFull['manifest'];
  pagination: ManifestFull['pagination'];
  manifestSubjects: ManifestFull['subjects'];
}> = ({ collection, manifest, pagination, project, manifestSubjects }) => {
  const { t } = useTranslation();
  const { filter, page } = useLocationQuery();

  const [subjectMap, showDoneButton] = useMemo(() => {
    if (!manifestSubjects) return [];
    const mapping: { [id: number]: number } = {};
    let showDone = false;
    for (const { subject, status } of manifestSubjects) {
      if (!showDone && status === 3) {
        showDone = true;
      }
      const parsed = parseUrn(subject);
      if (parsed) {
        mapping[parsed.id] = status;
      }
    }
    return [mapping, showDone] as const;
  }, [manifestSubjects]);

  return (
    <>
      <DisplayBreadcrumbs />
      <h1>
        <LocaleString>{manifest.label}</LocaleString>
      </h1>
      {showDoneButton ? (
        <Button
          as={HrefLink}
          href={createLink({
            projectId: project?.slug,
            collectionId: collection?.id,
            manifestId: manifest.id,
            query: { filter: filter ? undefined : 3, page },
          })}
        >
          Hide completed
        </Button>
      ) : null}
      <Pagination
        pageParam={'m'}
        page={pagination ? pagination.page : 1}
        totalPages={pagination ? pagination.totalPages : 1}
        stale={!pagination}
        extraQuery={{ filter }}
      />
      <div>
        <ImageGrid>
          {manifest.items.map((canvas, idx) => (
            <Link
              key={`${canvas.id}_${idx}`}
              to={createLink({
                projectId: project?.slug,
                collectionId: collection?.id,
                manifestId: manifest.id,
                canvasId: canvas.id,
              })}
            >
              <ImageStripBox>
                <CroppedImage>
                  {canvas.thumbnail ? <img alt={t('First image in manifest')} src={canvas.thumbnail} /> : null}
                </CroppedImage>
                {manifestSubjects && subjectMap ? <CanvasStatus status={subjectMap[canvas.id]} /> : null}
                <LocaleString as={Heading5}>{canvas.label}</LocaleString>
              </ImageStripBox>
            </Link>
          ))}
        </ImageGrid>
      </div>
    </>
  );
};
