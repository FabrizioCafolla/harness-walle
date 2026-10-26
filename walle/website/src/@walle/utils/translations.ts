import { getCollection, type CollectionKey } from "astro:content";
import { localeCodes } from "./locale-url";

/** Splits an entry id `<code>/<path>` into its language code and path. */
export function splitLocaleId(id: string): { code: string; path: string } {
  const [code, ...rest] = id.split("/");
  return { code, path: rest.join("/") };
}

/**
 * The language codes in which the entry `id` (`<code>/<path>`) of `collection` exists:
 * the same path under every other language folder. A draft counts as missing, so a page,
 * a switcher entry or an hreflang is never produced for it.
 */
export async function getTranslations(collection: CollectionKey, id: string): Promise<string[]> {
  const { path } = splitLocaleId(id);
  const codes = localeCodes();
  // One collection read: `getEntry` logs a warning for every id that does not exist.
  const found = new Set(
    (
      await getCollection(collection, (entry) => {
        const draft = (entry.data as { draft?: boolean }).draft;
        return !draft && splitLocaleId(entry.id).path === path;
      })
    ).map((entry) => splitLocaleId(entry.id).code)
  );
  return codes.filter((code) => found.has(code));
}
