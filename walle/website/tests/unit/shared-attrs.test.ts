import { describe, expect, it } from "vitest";
import { linkAttrs, splitProps, variantAttrs } from "../../src/@walle/components/shared/attrs";

describe("linkAttrs", () => {
  // Mirrors Link.astro's own resolution so the extraction is verified faithful.
  it("external link defaults to _blank with rel=noopener noreferrer", () => {
    expect(linkAttrs({ external: true })).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });

  it("internal link defaults to _self with no rel", () => {
    expect(linkAttrs({ external: false })).toEqual({ target: "_self", rel: undefined });
  });

  it("internal link forced to _blank gets rel=noopener", () => {
    expect(linkAttrs({ target: "_blank", external: false })).toEqual({
      target: "_blank",
      rel: "noopener",
    });
  });

  it("external link keeps rel=noopener noreferrer even when target is forced to _self", () => {
    expect(linkAttrs({ target: "_self", external: true })).toEqual({
      target: "_self",
      rel: "noopener noreferrer",
    });
  });

  it("defaults external to false when omitted", () => {
    expect(linkAttrs({})).toEqual({ target: "_self", rel: undefined });
  });
});

describe("variantAttrs", () => {
  it("defaults to data-variant=primary with no modifiers", () => {
    expect(variantAttrs({})).toEqual({
      "data-variant": "primary",
      "data-outline": undefined,
      "data-filled": undefined,
      "data-muted": undefined,
      "data-inverse": undefined,
    });
  });

  it("uses the given variant", () => {
    expect(variantAttrs({ variant: "alternative" })["data-variant"]).toBe("alternative");
  });

  it("emits a modifier attribute only when its prop is true", () => {
    const attrs = variantAttrs({ outline: true, filled: false, muted: undefined, inverse: true });
    expect(attrs["data-outline"]).toBe("true");
    expect(attrs["data-filled"]).toBeUndefined();
    expect(attrs["data-muted"]).toBeUndefined();
    expect(attrs["data-inverse"]).toBe("true");
  });
});

describe("splitProps", () => {
  it("separates own props from passthrough, losing and duplicating nothing", () => {
    const props = { variant: "primary", outline: true, class: "extra", "data-testid": "x" };
    const { own, rest } = splitProps(props, ["variant", "outline", "class"]);
    expect(own).toEqual({ variant: "primary", outline: true, class: "extra" });
    expect(rest).toEqual({ "data-testid": "x" });
    expect(Object.keys(own).length + Object.keys(rest).length).toBe(Object.keys(props).length);
  });

  it("returns an empty rest when every key is claimed", () => {
    const props = { id: "a" };
    const { own, rest } = splitProps(props, ["id"]);
    expect(own).toEqual({ id: "a" });
    expect(rest).toEqual({});
  });

  it("returns an empty own when the claimed key is absent from this instance", () => {
    // "bar" is a real, valid own-key for this props shape (e.g. an optional prop OWN_KEYS
    // declares) that simply wasn't passed this time — not an arbitrary undeclared key.
    const props: { foo: number; bar?: string } = { foo: 1 };
    const { own, rest } = splitProps(props, ["bar"]);
    expect(own).toEqual({});
    expect(rest).toEqual({ foo: 1 });
  });
});
