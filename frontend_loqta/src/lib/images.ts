/**
 * Helpers for deciding whether a product image can be shown.
 *
 * The catalog must only display images that really exist. Generated
 * placeholder services (placehold.co, dummyimage, …) are treated as "no
 * image": showing them next to a real 3D model looks broken and pretends the
 * photo belongs to the product.
 */

const PLACEHOLDER_HOSTS = [
  'placehold.co',
  'placehold.it',
  'via.placeholder.com',
  'placeholder.com',
  'dummyimage.com',
  'picsum.photos',
  'loremflickr.com',
  'example.com',
];

export function isDisplayableImage(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  if (/^data:image\//i.test(trimmed)) return true;
  // Root-relative paths (bundled assets, /models/...) are always ours.
  if (trimmed.startsWith('/')) return true;

  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return !PLACEHOLDER_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
}
