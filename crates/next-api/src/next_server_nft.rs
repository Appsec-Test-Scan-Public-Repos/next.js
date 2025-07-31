use anyhow::Result;
use next_core::{all_assets_from_entries, next_manifests::NextFontManifest};
use turbo_rcstr::RcStr;
use turbo_tasks::{ResolvedVc, Vc};
use turbo_tasks_fs::{File, FileSystemPath};
use turbopack_core::{
    asset::AssetContent,
    output::{OutputAsset, OutputAssets},
    virtual_output::VirtualOutputAsset,
};

use crate::paths::get_font_paths_from_root;

#[turbo_tasks::function]
pub(crate) async fn next_server_nft_assets() -> Result<Vc<OutputAssets>> {
    /*


          if (isStandalone) {
            addToTracedFiles(
              '',
              require.resolve('next/dist/compiled/jest-worker/processChild'),
              serverTracedFiles
            )
            addToTracedFiles(
              '',
              require.resolve('next/dist/compiled/jest-worker/threadChild'),
              serverTracedFiles
            )
          }

          if (isTurbopack) {
            addToTracedFiles(distDir, './package.json', serverTracedFiles)
            addToTracedFiles(distDir, './package.json', minimalServerTracedFiles)
          }





    */

    Ok(OutputAssets::empty())
}
