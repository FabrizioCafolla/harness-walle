import configs from "../../configs";

import { appSchema, footerSchema, navbarSchema, parseConfig } from "./schema";
import type {
  AppConfig,
  FooterConfig,
  LabelsConfig,
  NavbarConfig,
  NavbarLogo,
  NavigationLink,
} from "./schema";

export type { AppConfig, FooterConfig, LabelsConfig, NavbarConfig, NavbarLogo, NavigationLink };

export interface DefaultConfig {
  app: AppConfig;
  navbar: NavbarConfig;
  footer: FooterConfig;
  [key: string]: any;
}

export const config: DefaultConfig = {
  ...configs,
  app: parseConfig(appSchema, configs.app, "app.json"),
  navbar: parseConfig(navbarSchema, configs.navbar, "navbar.json"),
  footer: parseConfig(footerSchema, configs.footer, "footer.json"),
  env: {
    ...import.meta.env,
    IS_PRODUCTION: import.meta.env.NODE_ENV === "production",
  },
};

export default config;

// Build-time Astro config resolver for astro.config.mjs. Inside the site's Vite graph the
// walle-runtime-config plugin (define-config.ts) loads this file without this line, so the
// runtime `config` above never imports astro/config.
export { defineWalleConfig } from "../define-config";
