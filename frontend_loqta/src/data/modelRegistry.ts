/**
 * Model registry — the single place that decides which 3D file a product uses.
 *
 * Two ways to add a real 3D model:
 *
 *  A) GLB file (recommended — one self-contained file)
 *     1. Put the file at:  src/assets/models/<slug>.glb
 *        where <slug> is the product name lowercased with dashes, e.g.
 *        "MacBook Pro"      -> src/assets/models/macbook-pro.glb
 *        "PlayStation 5"    -> src/assets/models/playstation-5.glb
 *     2. Nothing else to do. The file is discovered automatically below.
 *
 *  B) GLTF bundle (.gltf + .bin + textures — must stay together)
 *     1. Unzip the whole bundle into: public/models/<folder>/
 *        e.g. public/models/iphone_14_pro/scene.gltf, scene.bin, textures/...
 *     2. Map the product slug to the .gltf path in MODEL_OVERRIDES below.
 *
 * If a product has no local model, the backend-provided modelUrl is used; if
 * that is also missing the viewer shows the product image and clearly states
 * that the 3D view is unavailable (it never pretends an image is rotatable).
 */

/** GLB files are picked up automatically from src/assets/models. */
const GLB_MODULES = import.meta.glob('../assets/models/*.glb', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Product slug -> GLTF bundle path (files extracted under public/models/).
 * The .gltf file must keep its .bin and textures next to it (same folder).
 * Also keep the license.txt files that ship with each model.
 */
export const MODEL_OVERRIDES: Record<string, string> = {
  'asus-rog-gaming-laptop': '/models/gaming_laptop/scene.gltf',
  iphone: '/models/iphone_14_pro/scene.gltf',
  'samsung-galaxy': '/models/samsung_galaxy_s22_ultra/scene.gltf',
  'sony-wh-1000xm5': '/models/headphone/scene.gltf',
  'samsung-odyssey-monitor': '/models/screen/scene.gltf',
  'lg-ultrawide-monitor': '/models/tv_screen/scene.gltf',
  'sony-alpha-camera': '/models/camera/scene.gltf',
  'playstation-5': '/models/playstation_5/scene.gltf',
};

/** "MacBook Pro" -> "macbook-pro" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Backend products do not store a model path, so real catalog names are
 * matched to the bundles available under public/models/.
 * Keep this list tight: only add a rule when the model really represents the
 * product (e.g. the S22 model stands in for the Galaxy S line).
 */
const NAME_RULES: Array<{ pattern: RegExp; model: string }> = [
  { pattern: /1000xm5|\bxm5\b/i, model: '/models/headphone/scene.gltf' },
  { pattern: /playstation\s*5|\bps5\b/i, model: '/models/playstation_5/scene.gltf' },
  { pattern: /odyssey/i, model: '/models/screen/scene.gltf' },
  { pattern: /ultragear|ultrawide/i, model: '/models/tv_screen/scene.gltf' },
  { pattern: /alpha\s*(7|a7)\b/i, model: '/models/camera/scene.gltf' },
  { pattern: /iphone/i, model: '/models/iphone_14_pro/scene.gltf' },
  { pattern: /galaxy\s*s\d/i, model: '/models/samsung_galaxy_s22_ultra/scene.gltf' },
];

function findByNameRule(name: string): string | undefined {
  const rule = NAME_RULES.find((entry) => entry.pattern.test(name));
  return rule?.model;
}

function findLocalGlb(slug: string): string | undefined {
  const fileName = `${slug}.glb`;
  const entry = Object.entries(GLB_MODULES).find(
    ([path]) => path.split('/').pop()?.toLowerCase() === fileName,
  );
  return entry?.[1];
}

/**
 * Resolves the model URL for a product:
 *   1. explicit backend URL (modelUrl from the API), then
 *   2. manual GLTF override (demo products), then
 *   3. auto-discovered local GLB file, then
 *   4. keyword match for real catalog product names.
 */
export function resolveModelUrl(productName: string, explicitUrl?: string | null): string | undefined {
  if (explicitUrl && explicitUrl.trim().length > 0) return explicitUrl;
  const slug = slugify(productName);
  return MODEL_OVERRIDES[slug] ?? findLocalGlb(slug) ?? findByNameRule(productName);
}
