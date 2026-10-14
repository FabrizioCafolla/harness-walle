// Type-only fixture: a consumer layout extending BaseLayout Props (which extends
// AbstractLayout's) gets every header/skip-link prop. Includes one expected type error.
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
