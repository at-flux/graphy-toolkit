import sharp from "sharp";

/** Metadata after auto-orient (pixel dimensions match display). */
export async function readMetadataAfterRotate(
  sourceFilePath: string,
): Promise<sharp.Metadata> {
  return sharp(sourceFilePath).rotate().metadata();
}

/**
 * Sharp 0.34+ `withMetadata({ exif })` expects IFD objects, not raw buffers.
 */
export function mergeOutputExif(
  input: sharp.Sharp,
  outputWidth: number,
  outputHeight: number,
  hasCopyright: boolean,
  copyright: string,
): sharp.Sharp {
  const out = input.keepMetadata();
  const merge: Record<string, Record<string, string>> = {
    IFD0: { Orientation: "1" },
    ExifIFD: {
      PixelXDimension: String(outputWidth),
      PixelYDimension: String(outputHeight),
    },
  };
  if (!hasCopyright && copyright.trim()) {
    merge.IFD0.Copyright = copyright;
    merge.IFD0.Artist = copyright;
  }
  return out.withExifMerge(merge);
}
