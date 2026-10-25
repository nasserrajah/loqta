# 3D Models — Loqta

## Current setup

Real GLTF bundles are extracted under `public/models/<folder>/` and mapped to
demo products in `src/data/modelRegistry.ts`:

| Product | Model folder |
| --- | --- |
| ASUS ROG Gaming Laptop | `gaming_laptop` |
| iPhone | `iphone_14_pro` |
| Samsung Galaxy | `samsung_galaxy_s22_ultra` |
| Sony WH-1000XM5 | `headphone` |
| Samsung Odyssey Monitor | `screen` |
| LG UltraWide Monitor | `tv_screen` |
| Sony Alpha Camera | `camera` |
| PlayStation 5 | `playstation_5` |

Storefront-only models (not tied to a catalog product):

| Use | Model folder |
| --- | --- |
| Home hero basket | `cover_basket` (`loqta-cart-1.gltf`) |
| "Up to 70% off" — Galaxy S21 Ultra | `samsung_galaxy_s21_ultra` |
| "Up to 70% off" — PlayStation 5 | `playstation_ps5` |
| "Up to 70% off" — Rotom Game Boy | `rotom_game_boy` |
| "Up to 70% off" — DJI FPV drone | `camers1` |

All ten reference products that ship with a 3D model are shown in the catalog;
anything without a model is not listed (see `src/data/demoProducts.ts`).

## Folder structure (important)

Each bundle must keep its original structure. The `.gltf` references its
textures by relative path, so the images **must stay inside `textures/`**:

```
public/models/iphone_14_pro/
├─ scene.gltf
├─ scene.bin
├─ license.txt
└─ textures/
   ├─ Material_baseColor.png
   ├─ Material_metallicRoughness.png
   ├─ Material_normal.png
   └─ Material_emissive.jpeg
```

If you re-extract a bundle and the images land next to `scene.gltf`, move them
back into `textures/` — otherwise the model renders untextured (white/black).

## Adding a model for a product that has none

**Option A — GLB (single file, recommended)**

Drop the file in `src/assets/models/<slug>.glb`, e.g.:

```
src/assets/models/macbook-pro.glb
src/assets/models/airpods-pro.glb
```

The slug is the product name lowercased with dashes. No code change needed:
`import.meta.glob` discovers it automatically.

**Option B — GLTF bundle**

1. Unzip into `public/models/<any-name>/`.
2. Map the product in `MODEL_OVERRIDES` (`src/data/modelRegistry.ts`):

```ts
'macbook-pro': '/models/my-macbook/scene.gltf',
```

## Performance notes

- Textures larger than 2048 px were downscaled to 2048 px to keep pages light.
- Keep total bundle size per product under ~10 MB.
- Every model is auto-centered and auto-scaled by the viewer, so different
  units (cm / m / mm) and origins are fine.
- `license.txt` files from the original assets are kept next to the models.
