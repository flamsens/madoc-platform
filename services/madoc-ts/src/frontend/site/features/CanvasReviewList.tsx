import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BaseTask } from '../../../gateway/tasks/base-task';
import { Heading3 } from '../../shared/atoms/Heading3';
import { Status } from '../../shared/atoms/Status';
import { TableContainer, TableRow, TableRowLabel } from '../../shared/atoms/Table';
import { apiHooks } from '../../shared/hooks/use-api-query';
import { useRouteContext } from '../hooks/use-route-context';

export const CanvasReviewList: React.FC = () => {
  const { t } = useTranslation();
  const { projectId, canvasId } = useRouteContext();
  const { data: tasks, isLoading: isLoadingTasks } = apiHooks.getSiteProjectCanvasTasks(() =>
    projectId && canvasId ? [projectId, canvasId] : undefined
  );

  const reviews = useMemo(
    () =>
      tasks?.userTasks
        ? tasks.userTasks.filter(
            task => (task as BaseTask).type === 'crowdsourcing-review' && (task.status === 2 || task.status === 1)
          )
        : [],
    [tasks]
  );

  if (!reviews.length || isLoadingTasks) {
    return null;
  }

  return (
    <div>
      <Heading3>{t('Reviews')}</Heading3>
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
  );
};
