import { useApi } from './use-api';
import { Revisions } from '@capture-models/editor';
import { useMutation } from 'react-query';
import { RevisionRequest } from '@capture-models/types';
import { useCallback } from 'react';

export function useViewerSaving(onSave: (req: RevisionRequest, status: string | undefined) => Promise<void> | void) {
  const api = useApi();
  const persistRevision = Revisions.useStoreActions(a => a.persistRevision);

  const [createRevision] = useMutation(
    async ({ req, status }: { req: RevisionRequest; status?: string }): Promise<RevisionRequest> => {
      const response = await api.createCaptureModelRevision(req, status);
      await onSave(response, status);
      return response;
    }
  );
  const [updateRevision] = useMutation(
    async ({ req, status }: { req: RevisionRequest; status?: string }): Promise<RevisionRequest> => {
      const response = await api.updateCaptureModelRevision(req, status);
      await onSave(response, status);
      return response;
    }
  );

  return useCallback(
    (revisionRequest: RevisionRequest, status: string | undefined) => {
      return persistRevision({
        createRevision: (req, s) => {
          return createRevision({ req, status: s });
        },
        updateRevision: (req, s) => {
          return updateRevision({ req, status: s });
        },
        revisionId: revisionRequest.revision.id,
        status,
      });
    },
    [createRevision, persistRevision, updateRevision]
  );
}