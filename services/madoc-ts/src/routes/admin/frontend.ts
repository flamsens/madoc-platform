import { render as renderAdmin } from '../../frontend/admin/server';
import { render as renderSite } from '../../frontend/site/server';
import { RouteMiddleware } from '../../types/route-middleware';
import { NotFound } from '../../utility/errors/not-found';
import { userWithScope } from '../../utility/user-with-scope';

export const adminFrontend: RouteMiddleware = context => {
  try {
    userWithScope(context, ['site.admin']);
  } catch (e) {
    if (e instanceof NotFound) {
      context.response.status = 307;
      context.response.redirect(`/s/${context.params.slug}`);
      return;
    }
  }
  const bundle = context.routes.url('assets-bundles', { slug: context.params.slug, bundleId: 'admin' });
  context.omekaMinimal = true;
  context.omekaPage = async token => {
    const result = await renderAdmin({
      url: context.req.url || '',
      jwt: token,
      basename: `/s/${context.params.slug}/madoc/admin`,
      i18next: context.i18next.cloneInstance({ initImmediate: false }),
      site: context.omeka.getSiteIdBySlug(context.params.slug),
      user:
        context.state.jwt && context.state.jwt.user && context.state.jwt.user.id
          ? {
              name: context.state.jwt.user.name,
              id: context.state.jwt.user.id,
              scope: context.state.jwt.scope,
            }
          : undefined,
    });

    if (result.type === 'redirect') {
      if (result.to) {
        context.response.status = result.status || 307;
        context.response.redirect(result.to);
      } else {
        context.response.status = 404;
      }

      return;
    }

    return `
      ${result.html}
      <script type="application/javascript" src="${bundle}"></script>
    `;
  };
};

export const siteFrontend: RouteMiddleware = context => {
  const bundle = context.routes.url('assets-bundles', { slug: context.params.slug, bundleId: 'site' });
  context.omekaMinimal = true;

  context.omekaPage = async token => {
    const result = await renderSite({
      url: context.req.url || '',
      jwt: token,
      basename: `/s/${context.params.slug}/madoc`,
      i18next: context.i18next.cloneInstance({ initImmediate: false }),
      siteSlug: context.params.slug,
      site: context.omeka.getSiteIdBySlug(context.params.slug),
      user:
        context.state.jwt && context.state.jwt.user && context.state.jwt.user.id
          ? {
              name: context.state.jwt.user.name,
              id: context.state.jwt.user.id,
              scope: context.state.jwt.scope,
            }
          : undefined,
    });

    if (result.type === 'redirect') {
      if (result.to) {
        context.response.status = result.status || 307;
        context.response.redirect(result.to);
      } else {
        context.response.status = 404;
      }

      return;
    }

    return `
      ${result.html}
      <script type="application/javascript" src="${bundle}"></script>
    `;
  };
};
