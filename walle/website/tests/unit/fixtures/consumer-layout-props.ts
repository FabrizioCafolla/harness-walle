// Type-only fixture: a consumer's own layout extends walle's BaseLayout Props,
// which in turn extends AbstractLayout's, so every header/skip-link knob stays available all
// the way up the chain without the consumer having to redeclare any of it. Also exercises a
// real violation, to prove this check actually fails when the types are wrong.
//
// Run with: yarn tsc --noEmit -p tests/unit/fixtures/tsconfig.type-test.json

import type { BaseLayoutProps, DetailLayoutProps } from "../../../src/@walle/layouts/types";

interface ConsumerLayoutProps extends BaseLayoutProps {
  showPromoBar?: boolean;
}

const props: ConsumerLayoutProps = {
  headerTitle: "Consumer page",
  headerDescription: "A page on a site built with walle",
  headerLanguage: "en",
  skipLinkLabel: "Skip to content",
  showPromoBar: true,
};

const badDetailProps: DetailLayoutProps = {
  title: "Bad",
  // @ts-expect-error badgesAlign only accepts "start" | "center" | "end"
  badgesAlign: "middle",
};

export type { ConsumerLayoutProps };
export { props, badDetailProps };
