import { eslintWalleConfigs } from "./src/@walle/eslint.preset.js";

export default [
  // Repo-internal ignores: e2e sandboxes are generated/git-ignored, and walle/template/ is
  // scaffold content (its @walle paths only exist once synced into a consumer; verified by
  // the e2e build).
  { ignores: ["tests/e2e/.sandbox/**", "walle/template/**"] },
  ...eslintWalleConfigs,
];
