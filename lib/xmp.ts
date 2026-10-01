import type { Mark } from './store';

/**
 * XMP sidecar that Lightroom Classic, Bridge and Capture One read when it
 * sits next to the RAW file with the same base name.
 * Ratings map to xmp:Rating; picks and rejects ride on the color label.
 */
export function xmpSidecar(mark: Mark): string {
  const attrs: string[] = [];
  if (mark.rating > 0) attrs.push(`xmp:Rating="${mark.rating}"`);
  if (mark.flag === 'pick') attrs.push(`xmp:Label="Green"`);
  if (mark.flag === 'reject') {
    attrs.push(`xmp:Label="Red"`);
    if (mark.rating === 0) attrs.push(`xmp:Rating="-1"`);
  }
  return `<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Lightsift">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    ${attrs.join('\n    ')}/>
 </rdf:RDF>
</x:xmpmeta>
`;
}

/** name.CR2 -> name.xmp (the convention every catalog app expects). */
export function sidecarName(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return (i === -1 ? fileName : fileName.slice(0, i)) + '.xmp';
}
