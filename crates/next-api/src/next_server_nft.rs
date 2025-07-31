use anyhow::Result;
use either::Either;
use next_core::get_next_package;
use serde_json::json;
use turbo_tasks::{ResolvedVc, TryFlatJoinIterExt, TryJoinIterExt, Vc};
use turbo_tasks_fs::File;
use turbopack::externals_tracing_module_context;
use turbopack_core::{
    asset::AssetContent,
    module::Module,
    output::{OutputAsset, OutputAssets},
    resolve::{ExternalType, origin::PlainResolveOrigin, parse::Request},
    traced_asset::TracedAsset,
    virtual_output::VirtualOutputAsset,
};
use turbopack_ecmascript::resolve::cjs_resolve;

use crate::{nft_json::all_assets_from_entries_filtered, project::Project};

// TODO hardcode these for the page-specific NFTs
//   const routesIgnores = [
//     ...sharedIgnores,
//     // server chunks are provided via next-trace-entrypoints-plugin plugin
//     // as otherwise all chunks are traced here and included for all pages
//     // whether they are needed or not
//     '**/.next/server/chunks/**',
//     '**/next/dist/server/optimize-amp.js',
//     '**/next/dist/server/post-process.js',
//   ].filter(nonNullable)

#[turbo_tasks::function]
pub(crate) async fn next_server_nft_assets(project: Vc<Project>) -> Result<Vc<OutputAssets>> {
    let is_standalone = true;

    let next_dir = get_next_package(project.project_path().owned().await?).await?;

    let asset_context = Vc::upcast(externals_tracing_module_context(ExternalType::CommonJs));

    let next_resolve_origin =
        Vc::upcast(PlainResolveOrigin::new(asset_context, next_dir.join("_")?));

    let resolve_entry = async |path: &str| {
        Ok(cjs_resolve(
            next_resolve_origin,
            Request::parse_string(path.into()),
            None,
            false,
        )
        .primary_modules()
        .await?
        .into_iter()
        .map(|m| **m))
    };

    let shared_entries: Vec<Vc<Box<dyn Module>>> =
        ["styled-jsx", "styled-jsx/style", "styled-jsx/style.js"]
            .into_iter()
            .map(resolve_entry)
            .try_flat_join()
            .await?;

    //   const { cacheHandler } = config
    //   const { cacheHandlers } = config.experimental
    //   // ensure we trace any dependencies needed for custom
    //   // incremental cache handler
    //   if (cacheHandler) {
    //     sharedEntriesSet.push(
    //       require.resolve(
    //         path.isAbsolute(cacheHandler)
    //           ? cacheHandler
    //           : path.join(dir, cacheHandler)
    //       )
    //     )
    //   }
    //   if (cacheHandlers) {
    //     for (const handlerPath of Object.values(cacheHandlers)) {
    //       if (handlerPath) {
    //         sharedEntriesSet.push(
    //           require.resolve(
    //             path.isAbsolute(handlerPath)
    //               ? handlerPath
    //               : path.join(dir, handlerPath)
    //           )
    //         )
    //       }
    //     }
    //   }

    // ...sharedEntriesSet,
    //         ...(isStandalone
    //           ? [
    //               require.resolve('next/dist/server/lib/start-server'),
    //               require.resolve('next/dist/server/next'),
    //               require.resolve('next/dist/server/require-hook'),
    //             ]
    //           : []),
    //         require.resolve('next/dist/server/next-server'),

    let server_entries = shared_entries
        .iter()
        .copied()
        .chain(if is_standalone {
            Either::Left(
                resolve_entry("next/dist/server/lib/start-server")
                    .await?
                    .chain(resolve_entry("next/dist/server/next").await?)
                    .chain(resolve_entry("next/dist/server/require-hook").await?),
            )
        } else {
            Either::Right(std::iter::empty())
        })
        .chain(resolve_entry("next/dist/server/next-server").await?)
        .collect::<Vec<_>>();

    let minimal_server_entries = shared_entries
        .iter()
        .copied()
        .chain(resolve_entry("next/dist/compiled/next-server/server.runtime.prod").await?)
        .collect::<Vec<_>>();

    let server_entries = server_entries
        .into_iter()
        .map(|m| Vc::upcast::<Box<dyn OutputAsset>>(TracedAsset::new(m)).to_resolved())
        .try_join()
        .await?;
    let minimal_server_entries = minimal_server_entries
        .into_iter()
        .map(|m| Vc::upcast::<Box<dyn OutputAsset>>(TracedAsset::new(m)).to_resolved())
        .try_join()
        .await?;

    let mut server_output_assets =
        all_assets_from_entries_filtered(Vc::cell(server_entries), None, None)
            .await?
            .iter()
            .map(|m| m.path())
            .try_join()
            .await?;
    server_output_assets.sort_by_key(|k| k.path.clone());
    let mut minimal_server_output_assets =
        all_assets_from_entries_filtered(Vc::cell(minimal_server_entries), None, None)
            .await?
            .iter()
            .map(|m| m.path())
            .try_join()
            .await?;
    minimal_server_output_assets.sort_by_key(|k| k.path.clone());

    if is_standalone {
        server_output_assets.extend(
            resolve_entry("next/dist/compiled/jest-worker/processChild")
                .await?
                .map(|m| m.ident().path())
                .try_join()
                .await?,
        );
        server_output_assets.extend(
            resolve_entry("next/dist/compiled/jest-worker/threadChild")
                .await?
                .map(|m| m.ident().path())
                .try_join()
                .await?,
        );
    }

    // server_output_assets.extend(
    //     TracedAsset::new(asset_),
    //     "./package.json",
    //     serverTracedFiles,
    // );
    // minimal_server_output_assets.extend(
    //     TracedAsset::new(asset_),
    //     "./package.json",
    //     minimalServerTracedFiles,
    // );

    /*
    hardcoded files (not recursive)


                const moduleTypes = ['app-page', 'pages']

      for (const type of moduleTypes) {
        const modulePath = require.resolve(
          `next/dist/server/route-modules/${type}/module.compiled`
        )
        const relativeModulePath = path.relative(root, modulePath)

        const contextDir = path.join(
          path.dirname(modulePath),
          'vendored',
          'contexts'
        )

        for (const item of await fs.readdir(contextDir)) {
          const itemPath = path.relative(root, path.join(contextDir, item))
          if (!serverIgnoreFn(itemPath)) {
            addToTracedFiles(root, itemPath, serverTracedFiles)
            addToTracedFiles(root, itemPath, minimalServerTracedFiles)
          }
        }
        addToTracedFiles(root, relativeModulePath, serverTracedFiles)
        addToTracedFiles(root, relativeModulePath, minimalServerTracedFiles)
      }
    */

    Ok(Vc::cell(vec![
        ResolvedVc::upcast(
            VirtualOutputAsset::new(
                project
                    .node_root()
                    .await?
                    .join("next-server.turbo.nft.json")?,
                AssetContent::file(
                    File::from(
                        json!({
                            "version": 1,
                            "files": server_output_assets
                        })
                        .to_string(),
                    )
                    .into(),
                ),
            )
            .to_resolved()
            .await?,
        ),
        ResolvedVc::upcast(
            VirtualOutputAsset::new(
                project
                    .node_root()
                    .await?
                    .join("next-minimal-server.turbo.nft.json")?,
                AssetContent::file(
                    File::from(
                        json!({
                            "version": 1,
                            "files": minimal_server_output_assets
                        })
                        .to_string(),
                    )
                    .into(),
                ),
            )
            .to_resolved()
            .await?,
        ),
    ]))
}
