import React, { useMemo, useState } from 'react';
import { LockIcon } from '../../shared/atoms/LockIcon';
import { CanvasNavigation } from '../../shared/components/CanvasNavigation';
import { LocaleString } from '../../shared/components/LocaleString';
import { CanvasContext, useVaultEffect } from '@hyperion-framework/react-vault';
import { CanvasNormalized } from '@hyperion-framework/types';
import { useApi } from '../../shared/hooks/use-api';
import { useParams, useHistory, Link } from 'react-router-dom';
import { DisplayBreadcrumbs } from '../../shared/components/Breadcrumbs';
import { SimpleAtlasViewer } from '../../shared/components/SimpleAtlasViewer';
import { ProjectListingDescription, ProjectListingItem, ProjectListingTitle } from '../../shared/atoms/ProjectListing';
import { createLink } from '../../shared/utility/create-link';
import { ProjectFull } from '../../../types/schemas/project-full';
import { Heading3 } from '../../shared/atoms/Heading3';
import { HrefLink } from '../../shared/utility/href-link';
import { TableContainer, TableRow, TableRowLabel } from '../../shared/atoms/Table';
import { Status } from '../../shared/atoms/Status';
import { Button } from '../../shared/atoms/Button';
import { CrowdsourcingTask } from '../../../gateway/tasks/crowdsourcing-task';
import { CrowdsourcingReview } from '../../../gateway/tasks/crowdsourcing-review';
import { SuccessMessage } from '../../shared/atoms/SuccessMessage';
import { CanvasLoaderType } from './loaders/canvas-loader';

type ViewCanvasProps = Partial<CanvasLoaderType['data'] & CanvasLoaderType['context']>;

export const ContinueSubmission: React.FC<{
  project: ProjectFull;
  canvasId?: number;
  manifestId?: number;
  collectionId?: number;
  isComplete?: boolean;
  isMax?: boolean;
  isLoading?: boolean;
  canClaimCanvas?: boolean;
  userTasks?: Array<CrowdsourcingTask | CrowdsourcingReview>;
  manifestUserTasks?: Array<CrowdsourcingTask | CrowdsourcingReview>;
  onContribute?: (projectId: string | number) => void;
}> = ({
  project,
  onContribute,
  isLoading,
  isMax,
  canvasId,
  isComplete,
  manifestUserTasks,
  userTasks,
  manifestId,
  collectionId,
  canClaimCanvas,
}) => {
  const api = useApi();
  const { user } = api.getIsServer() ? { user: undefined } : api.getCurrentUser() || {};

  const [continueSubmission, continueCount] = useMemo(() => {
    let totalReady = 0;
    const tasks = userTasks && userTasks.length ? userTasks : manifestUserTasks;
    const allModels =
      tasks && tasks.length
        ? tasks.filter(task => {
            if (user && task.assignee?.id === user.id && task.type === 'crowdsourcing-task') {
              if (task.status !== -1 && task.status !== 3) {
                totalReady++;
              }
              return true;
            }
            return false;
          })
        : null;

    return [allModels, totalReady] as const;
  }, [userTasks, manifestUserTasks, user]);

  const reviews = useMemo(
    () =>
      userTasks
        ? userTasks.filter(task => task.type === 'crowdsourcing-review' && (task.status === 2 || task.status === 1))
        : null,
    [userTasks]
  );

  const reviewComponent =
    reviews && reviews.length ? (
      <div>
        <Heading3>Reviews</Heading3>
        <TableContainer>
          {reviews.map(task => (
            <TableRow key={task.id}>
              <TableRowLabel>
                <Status status={task.status as any} text={task.status_text} />
              </TableRowLabel>
              <TableRowLabel>
                <Link to={`/tasks/${task.id}`}>{task.name}</Link>
              </TableRowLabel>
            </TableRow>
          ))}
        </TableContainer>
      </div>
    ) : null;

  if (isComplete || isMax) {
    return (
      <div>
        <ProjectListingItem key={project.id}>
          <ProjectListingTitle>
            <HrefLink href={`/projects/${project.id}`}>
              <LocaleString>{project.label}</LocaleString>
            </HrefLink>
          </ProjectListingTitle>
          <ProjectListingDescription>
            <LocaleString>{project.summary}</LocaleString>
          </ProjectListingDescription>
        </ProjectListingItem>
        {reviewComponent}
        {isLoading ? null : (
          <SuccessMessage>
            {isComplete ? 'This page is complete' : 'The maximum number of contributions has been reached'}
          </SuccessMessage>
        )}
      </div>
    );
  }

  if (continueSubmission?.length) {
    return (
      <div>
        <ProjectListingItem key={project.id}>
          <ProjectListingTitle>
            <HrefLink href={`/projects/${project.id}`}>
              <LocaleString>{project.label}</LocaleString>
            </HrefLink>
          </ProjectListingTitle>
          <ProjectListingDescription>
            <LocaleString>{project.summary}</LocaleString>
          </ProjectListingDescription>
          {!continueCount ? (
            <ProjectListingDescription>You have already completed this item</ProjectListingDescription>
          ) : null}
          <Button
            as={HrefLink}
            href={createLink({ projectId: project.slug, manifestId, canvasId, collectionId, subRoute: 'model' })}
            style={{ display: 'inline-block' }}
          >
            {continueCount ? `Continue submission (${continueCount})` : 'Add new submission'}
          </Button>
        </ProjectListingItem>
        {reviewComponent}
      </div>
    );
  }

  return (
    <div>
      <ProjectListingItem key={project.id}>
        <ProjectListingTitle>
          <HrefLink href={`/projects/${project.id}`}>
            <LocaleString>{project.label}</LocaleString>
          </HrefLink>
        </ProjectListingTitle>
        <ProjectListingDescription>
          <LocaleString>{project.summary}</LocaleString>
        </ProjectListingDescription>
        {!isLoading ? (
          user && canClaimCanvas ? (
            <Button
              as={HrefLink}
              href={createLink({ projectId: project.slug, manifestId, canvasId, collectionId, subRoute: 'model' })}
              style={{ display: 'inline-block' }}
            >
              Contribute
            </Button>
          ) : null
        ) : canClaimCanvas ? (
          <Button disabled style={{ minWidth: 100 }}>
            ...
          </Button>
        ) : null}
      </ProjectListingItem>
      {reviewComponent}
    </div>
  );
};

export const ViewCanvas: React.FC<ViewCanvasProps> = ({
  project,
  manifestUserTasks,
  canvasTask,
  userTasks,
  canUserSubmit,
  canvas,
  isLoadingTasks,
}) => {
  const { id, manifestId, collectionId } = useParams<{ id: string; manifestId?: string; collectionId?: string }>();
  const [canvasRef, setCanvasRef] = useState<CanvasNormalized>();
  const history = useHistory();

  const canClaimCanvas = project?.config.claimGranularity ? project?.config.claimGranularity === 'canvas' : true;
  const api = useApi();
  const completedAndHide = project?.config.allowSubmissionsWhenCanvasComplete === false && canvasTask?.status === 3;
  const user = api.getIsServer() ? undefined : api.getCurrentUser();
  const bypassCanvasNavigation = user
    ? user.scope.indexOf('site.admin') !== -1 || user.scope.indexOf('models.revision') !== -1
    : manifestUserTasks && manifestUserTasks.length > 0;
  const preventCanvasNavigation = project ? project.config.allowCanvasNavigation === false : false;

  const onContribute = (projectId: number | string) => {
    api
      .createResourceClaim(projectId, {
        collectionId: collectionId ? Number(collectionId) : undefined,
        manifestId: manifestId ? Number(manifestId) : undefined,
        canvasId: Number(id),
      })
      .then(resp => {
        history.push(
          createLink({
            projectId: project?.id,
            taskId: resp.claim.id,
          })
        );
      });
  };

  useVaultEffect(
    vault => {
      if (canvas && canvas.source) {
        vault
          .load(
            canvas.source.id || canvas.source['@id'],
            canvas.source['@id']
              ? {
                  '@context': 'http://iiif.io/api/presentation/2/context.json',
                  ...canvas.source,
                }
              : canvas.source
          )
          .then(c => {
            setCanvasRef(c as any);
          });
      }
    },
    [canvas]
  );

  return (
    <>
      <DisplayBreadcrumbs />
      <LocaleString as="h1">{canvas ? canvas.label : { en: ['...'] }}</LocaleString>
      {project ? (
        <ContinueSubmission
          canClaimCanvas={canClaimCanvas}
          onContribute={onContribute}
          canvasId={Number(id)}
          isLoading={isLoadingTasks}
          manifestUserTasks={manifestUserTasks}
          userTasks={userTasks}
          isComplete={completedAndHide}
          isMax={!canUserSubmit}
          manifestId={manifestId ? Number(manifestId) : undefined}
          collectionId={collectionId ? Number(collectionId) : undefined}
          project={project}
        />
      ) : null}
      {preventCanvasNavigation && !manifestUserTasks?.length ? (
        <div style={{ textAlign: 'center', padding: '2em', marginTop: '1em', marginBottom: '1em', background: '#eee' }}>
          <LockIcon style={{ fontSize: '3em' }} />
          <Heading3>This canvas is not available to browse</Heading3>
        </div>
      ) : null}
      {canvasRef && (!preventCanvasNavigation || bypassCanvasNavigation) ? (
        <CanvasContext canvas={canvasRef.id}>
          <SimpleAtlasViewer style={{ height: project ? '50vh' : '60vh' }} />
        </CanvasContext>
      ) : null}
      {preventCanvasNavigation && !bypassCanvasNavigation ? null : (
        <CanvasNavigation manifestId={manifestId} canvasId={id} collectionId={collectionId} projectId={project?.slug} />
      )}
    </>
  );
};
