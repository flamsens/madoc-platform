import { i18n } from 'i18next';
import { makeQueryCache, ReactQueryCacheProvider, ReactQueryConfig, ReactQueryConfigProvider } from 'react-query';
import { dehydrate, Hydrate } from 'react-query/hydration';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';
import { defaultTheme } from '@capture-models/editor';
import { ApiClient } from '../../../gateway/api';
import { StaticRouterContext } from 'react-router';
import { parse } from 'query-string';
import { api } from '../../../gateway/api.server';
import { ListLocalisationsResponse } from '../../../routes/admin/localisation';
import { PublicSite } from '../../../utility/omeka-api';
import { queryConfig } from './query-config';
import { matchUniversalRoutes } from './server-utils';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { StaticRouter } from 'react-router-dom';
import React from 'react';
import { UniversalRoute } from '../../types';
import { Helmet } from 'react-helmet';
import localeCodes from 'locale-codes';

export function createServerRenderer(
  RootApplication: React.FC<{
    api: ApiClient;
    routes: UniversalRoute[];
    site: PublicSite;
    user?: { name: string; id: number; scope: string[] };
    supportedLocales: Array<{ label: string; code: string }>;
    defaultLocale: string;
  }>,
  routes: UniversalRoute[],
  apiGateway: string,
  extraConfig: Partial<ReactQueryConfig> = {}
) {
  return async function render({
    url,
    basename,
    jwt,
    i18next,
    siteSlug,
    site,
    siteLocales,
    user,
  }: {
    url: string;
    basename: string;
    jwt: string;
    i18next: i18n;
    siteSlug?: string;
    site?: PublicSite | Promise<PublicSite | undefined>;
    user?: { name: string; id: number; scope: string[] };
    siteLocales: ListLocalisationsResponse;
  }) {
    const prefetchCache = makeQueryCache();
    const sheet = new ServerStyleSheet(); // <-- creating out stylesheet
    const userApi = new ApiClient({
      gateway: apiGateway,
      jwt,
      publicSiteSlug: siteSlug,
    });
    const context: StaticRouterContext = {};
    const [urlPath, urlQuery] = url.split('?');
    const path = urlPath.slice(urlPath.indexOf(basename) + basename.length);
    const queryString = urlQuery ? parse(urlQuery) : {};
    const matches = matchUniversalRoutes(routes, path);
    const requests = [];
    for (const { match, route } of matches) {
      if (route.component.getKey && route.component.getData) {
        requests.push(
          prefetchCache.prefetchQuery(route.component.getKey(match.params, queryString), (key, vars) =>
            route.component.getData ? route.component.getData(key, vars, userApi) : (undefined as any)
          )
        );
      }
    }

    await Promise.all(requests);
    const omekaSite = await site;
    const dehydratedState = dehydrate(prefetchCache);
    const supportedLocales = siteLocales.localisations.map(ln => {
      const label = localeCodes.getByTag(ln.code).name;
      return { label: label, code: ln.code };
    });

    const routeData = `
      <script type="application/json" id="react-omeka">${JSON.stringify({
        site: omekaSite,
        user,
        locales: supportedLocales,
        defaultLocale: siteLocales.defaultLanguage || 'en',
      })}</script>
      <script type="application/json" id="react-query-cache">${JSON.stringify(dehydratedState)}</script>
    `;

    if (matches.length === 0) {
      return {
        type: 'redirect',
        status: 404,
      };
    }

    const markup = renderToString(
      sheet.collectStyles(
        <ReactQueryConfigProvider config={{ ...extraConfig, ...queryConfig }}>
          <ReactQueryCacheProvider>
            <Hydrate state={dehydratedState}>
              <I18nextProvider i18n={i18next}>
                <StaticRouter basename={basename} location={url} context={context}>
                  <ThemeProvider theme={defaultTheme}>
                    <RootApplication
                      api={api}
                      routes={routes}
                      site={omekaSite as any}
                      user={user}
                      defaultLocale={siteLocales.defaultLanguage || 'en'}
                      supportedLocales={supportedLocales}
                    />
                  </ThemeProvider>
                </StaticRouter>
              </I18nextProvider>
            </Hydrate>
          </ReactQueryCacheProvider>
        </ReactQueryConfigProvider>
      )
    );
    const helmet = Helmet.renderStatic();

    if (context.url) {
      return {
        type: 'redirect',
        status: context.statusCode,
        to: context.url,
      };
    }

    const styles = sheet.getStyleTags(); // <-- getting all the tags from the sheet

    // sheet.seal();

    if (process.env.NODE_ENV === 'production') {
      return {
        type: 'document',
        html: `<!doctype html>
<html ${helmet.htmlAttributes.toString()}>
    <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${styles}
    </head>
    <body ${helmet.bodyAttributes.toString()}>
        <div id="react-component">${markup}</div>
        
        
        <script crossorigin src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.0.0/dist/fetch.umd.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js"></script>
        <script type="application/json" id="react-data">${JSON.stringify({ basename })}</script>
        ${routeData}
    </body>
</html>`,
      };
    }

    return {
      type: 'document',
      html: `<!doctype html>
<html ${helmet.htmlAttributes.toString()}>
    <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${styles}
    </head>
    <body ${helmet.bodyAttributes.toString()}>
        <div id="react-component">${markup}</div>

        <script crossorigin src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.0.0/dist/fetch.umd.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.development.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.development.js"></script>
        <script type="application/json" id="react-data">${JSON.stringify({ basename })}</script>
        ${routeData}
    </body>
</html>`,
    };
  };
}
