import { userWithScope } from '../../../utility/user-with-scope';
import { RouteMiddleware } from '../../../types/route-middleware';
import { api } from '../../../gateway/api.server';
import {
  deleteIiifDerivedResource,
  deleteParentIiifDerivedResourceItems,
  deleteIiifMetadata, deleteIiifResource,
  deleteIiifResourceItem, deleteIiifLinking
} from '../../../database/queries/deletion-queries';
import { removeIiifFromDisk } from '../../../utility/deletion-utils';
import { getResourceLocalSource } from '../../../database/queries/resource-queries';
import { buildCanvasDeletionSummary } from './delete-canvas-summary';
import { DatabasePoolConnectionType, sql } from 'slonik';

export const deleteCanvasEndpoint: RouteMiddleware<{ id: number }> = async context => {
  const { siteId } = userWithScope(context, ['site.admin']);
  const canvasId = context.params.id;

  await deleteCanvas(canvasId, siteId, () => context.connection);

  context.response.status = 200;
};

export async function deleteCanvas(
  canvasId: number,
  siteId: number,
  connection: () => DatabasePoolConnectionType
) {
  const siteApi = api.asUser({ siteId });
  const deletionSummary = await buildCanvasDeletionSummary(canvasId, siteId, connection);

  const captureModels = await siteApi.getAllCaptureModels({
    target_id: String(canvasId),
    target_type: 'canvas',
  });
  captureModels.forEach(captureModel => {
    siteApi.deleteCaptureModel(captureModel.id);
  });

  if (deletionSummary.search.indexed && deletionSummary.search.id) {
    await siteApi.searchDeleteIIIF(deletionSummary.search.id);
  }

  if (deletionSummary.tasks > 0 || deletionSummary.parentTasks > 0) {
    await siteApi.batchDeleteTasks({ resourceId: canvasId, subject: `urn:madoc:canvas:${canvasId}` });
  }

  // Delete metadata
  await connection().any(deleteIiifMetadata(canvasId));
  await connection().any(deleteIiifLinking(canvasId));

  // Delete local IIIF file
  const localSource = await connection().maybeOne(getResourceLocalSource(canvasId));
  if (!!localSource && !!localSource.local_source) {
    removeIiifFromDisk(localSource.local_source);
  }

  // Remove canvas from manifests
  await connection().any(deleteIiifResourceItem(canvasId));
  await connection().any(deleteParentIiifDerivedResourceItems(canvasId));

  // Delete from iiif_derived_resource <- Canvas meta
  await connection().any(deleteIiifDerivedResource(canvasId));

  // Delete from iiif_resource <- Core record
  await connection().any(deleteIiifResource(canvasId));

  await connection().query(sql`select refresh_item_counts()`);
}
