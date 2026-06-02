import type sharp from "sharp";

type MetadataWithCopyright = sharp.Metadata & { copyright?: string };

export function hasExistingCopyright(meta: sharp.Metadata): boolean {
  const copyright = (meta as MetadataWithCopyright).copyright;
  return Boolean(copyright?.trim());
}
