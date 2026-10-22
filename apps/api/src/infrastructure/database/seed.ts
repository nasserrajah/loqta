import type { DatabaseClient } from './connection/index.js';
import type { PasswordHasher } from '../security/index.js';
import { nowIso } from '../../shared/utils/date.js';

interface SeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  imageUrl: string;
}

interface SeedBrand {
  id: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
}

interface SeedProduct {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  brandSlug: string;
  priceCents: number;
  stockQuantity: number;
  sku: string;
  featured?: boolean;
  description: string;
  specifications: Record<string, string>;
}

const CATEGORIES: SeedCategory[] = [
  {
    id: 'seed-category-smartphones',
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Flagship and everyday smartphones from leading brands.',
    sortOrder: 1,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Smartphones',
  },
  {
    id: 'seed-category-headphones-audio',
    name: 'Headphones & Audio',
    slug: 'headphones-audio',
    description: 'Wireless headphones, earbuds, and personal audio.',
    sortOrder: 2,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Audio',
  },
  {
    id: 'seed-category-computers',
    name: 'Computers',
    slug: 'computers',
    description: 'Laptops and desktops for work, study, and creation.',
    sortOrder: 3,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Computers',
  },
  {
    id: 'seed-category-monitors',
    name: 'Monitors',
    slug: 'monitors',
    description: 'High-resolution displays for productivity and gaming.',
    sortOrder: 4,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Monitors',
  },
  {
    id: 'seed-category-cameras-photography',
    name: 'Cameras & Photography',
    slug: 'cameras-photography',
    description: 'Mirrorless cameras and lenses for every level.',
    sortOrder: 5,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Cameras',
  },
  {
    id: 'seed-category-computer-accessories',
    name: 'Computer Accessories',
    slug: 'computer-accessories',
    description: 'Keyboards, mice, docks, and power accessories.',
    sortOrder: 6,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Computer+Accessories',
  },
  {
    id: 'seed-category-mobile-accessories',
    name: 'Mobile Accessories',
    slug: 'mobile-accessories',
    description: 'Chargers, cables, and cases for mobile devices.',
    sortOrder: 7,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Mobile+Accessories',
  },
  {
    id: 'seed-category-gaming-entertainment',
    name: 'Gaming & Entertainment',
    slug: 'gaming-entertainment',
    description: 'Consoles, gaming headsets, and entertainment gear.',
    sortOrder: 8,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Gaming',
  },
  {
    id: 'seed-category-smart-devices',
    name: 'Smart Devices',
    slug: 'smart-devices',
    description: 'Smartwatches and connected home devices.',
    sortOrder: 9,
    imageUrl: 'https://placehold.co/800x600/1e293b/ffffff?text=Smart+Devices',
  },
];

const BRANDS: SeedBrand[] = [
  {
    id: 'seed-brand-apple',
    name: 'Apple',
    slug: 'apple',
    description: 'Consumer electronics and software.',
    websiteUrl: 'https://www.apple.com',
  },
  {
    id: 'seed-brand-samsung',
    name: 'Samsung',
    slug: 'samsung',
    description: 'Phones, displays, and home electronics.',
    websiteUrl: 'https://www.samsung.com',
  },
  {
    id: 'seed-brand-sony',
    name: 'Sony',
    slug: 'sony',
    description: 'Audio, cameras, and gaming.',
    websiteUrl: 'https://www.sony.com',
  },
  {
    id: 'seed-brand-google',
    name: 'Google',
    slug: 'google',
    description: 'Pixel devices and smart home products.',
    websiteUrl: 'https://store.google.com',
  },
  {
    id: 'seed-brand-bose',
    name: 'Bose',
    slug: 'bose',
    description: 'Premium audio products.',
    websiteUrl: 'https://www.bose.com',
  },
  {
    id: 'seed-brand-dell',
    name: 'Dell',
    slug: 'dell',
    description: 'Laptops, desktops, and monitors.',
    websiteUrl: 'https://www.dell.com',
  },
  {
    id: 'seed-brand-hp',
    name: 'HP',
    slug: 'hp',
    description: 'Personal computers and printers.',
    websiteUrl: 'https://www.hp.com',
  },
  {
    id: 'seed-brand-lg',
    name: 'LG',
    slug: 'lg',
    description: 'Displays and home entertainment.',
    websiteUrl: 'https://www.lg.com',
  },
  {
    id: 'seed-brand-canon',
    name: 'Canon',
    slug: 'canon',
    description: 'Cameras and imaging products.',
    websiteUrl: 'https://www.canon.com',
  },
  {
    id: 'seed-brand-nikon',
    name: 'Nikon',
    slug: 'nikon',
    description: 'Cameras and optics.',
    websiteUrl: 'https://www.nikon.com',
  },
  {
    id: 'seed-brand-logitech',
    name: 'Logitech',
    slug: 'logitech',
    description: 'Computer peripherals and accessories.',
    websiteUrl: 'https://www.logitech.com',
  },
  {
    id: 'seed-brand-anker',
    name: 'Anker',
    slug: 'anker',
    description: 'Charging and mobile accessories.',
    websiteUrl: 'https://www.anker.com',
  },
  {
    id: 'seed-brand-microsoft',
    name: 'Microsoft',
    slug: 'microsoft',
    description: 'Software, consoles, and devices.',
    websiteUrl: 'https://www.microsoft.com',
  },
  {
    id: 'seed-brand-razer',
    name: 'Razer',
    slug: 'razer',
    description: 'Gaming hardware and accessories.',
    websiteUrl: 'https://www.razer.com',
  },
];

const PRODUCTS: SeedProduct[] = [
  {
    id: 'seed-product-iphone-15-pro',
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    categorySlug: 'smartphones',
    brandSlug: 'apple',
    priceCents: 99_900,
    stockQuantity: 18,
    sku: 'APL-IP15P-256',
    featured: true,
    description: 'Titanium iPhone with A17 Pro, a 48MP camera system, and USB-C.',
    specifications: {
      Display: '6.1-inch Super Retina XDR',
      Storage: '256GB',
      Chip: 'A17 Pro',
      Camera: '48MP main camera',
    },
  },
  {
    id: 'seed-product-galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra',
    slug: 'galaxy-s24-ultra',
    categorySlug: 'smartphones',
    brandSlug: 'samsung',
    priceCents: 119_900,
    stockQuantity: 12,
    sku: 'SAM-S24U-256',
    featured: true,
    description: 'Flagship Galaxy with S Pen, Galaxy AI, and a 200MP camera.',
    specifications: {
      Display: '6.8-inch Dynamic AMOLED 2X',
      Storage: '256GB',
      Camera: '200MP main camera',
      Battery: '5000mAh',
    },
  },
  {
    id: 'seed-product-pixel-8',
    name: 'Pixel 8',
    slug: 'pixel-8',
    categorySlug: 'smartphones',
    brandSlug: 'google',
    priceCents: 69_900,
    stockQuantity: 25,
    sku: 'GOO-PX8-128',
    description: 'Compact Pixel phone with Tensor G3 and seven years of updates.',
    specifications: {
      Display: '6.2-inch OLED',
      Storage: '128GB',
      Chip: 'Google Tensor G3',
      Camera: '50MP main camera',
    },
  },
  {
    id: 'seed-product-wh-1000xm5',
    name: 'WH-1000XM5 Wireless Headphones',
    slug: 'wh-1000xm5-wireless-headphones',
    categorySlug: 'headphones-audio',
    brandSlug: 'sony',
    priceCents: 39_900,
    stockQuantity: 30,
    sku: 'SNY-XM5-BLK',
    featured: true,
    description: 'Industry-leading noise cancellation with exceptional call quality.',
    specifications: {
      Type: 'Over-ear',
      Battery: 'Up to 30 hours',
      Connectivity: 'Bluetooth 5.2',
      Features: 'Adaptive noise cancellation',
    },
  },
  {
    id: 'seed-product-airpods-pro-2',
    name: 'AirPods Pro (2nd generation)',
    slug: 'airpods-pro-2nd-generation',
    categorySlug: 'headphones-audio',
    brandSlug: 'apple',
    priceCents: 24_900,
    stockQuantity: 35,
    sku: 'APL-APP2-USBC',
    description: 'Active noise cancellation, adaptive audio, and USB-C charging.',
    specifications: {
      Type: 'In-ear',
      Battery: 'Up to 6 hours',
      Chip: 'H2',
      Charging: 'USB-C and MagSafe',
    },
  },
  {
    id: 'seed-product-qc-ultra',
    name: 'QuietComfort Ultra Headphones',
    slug: 'quietcomfort-ultra-headphones',
    categorySlug: 'headphones-audio',
    brandSlug: 'bose',
    priceCents: 42_900,
    stockQuantity: 20,
    sku: 'BOS-QCU-BLK',
    description: 'Immersive spatial audio with world-class noise cancellation.',
    specifications: {
      Type: 'Over-ear',
      Battery: 'Up to 24 hours',
      Audio: 'Bose Immersive Audio',
      Connectivity: 'Bluetooth 5.3',
    },
  },
  {
    id: 'seed-product-macbook-air-m3',
    name: 'MacBook Air 13-inch (M3)',
    slug: 'macbook-air-13-m3',
    categorySlug: 'computers',
    brandSlug: 'apple',
    priceCents: 109_900,
    stockQuantity: 15,
    sku: 'APL-MBA13-M3-256',
    featured: true,
    description: 'Thin and light laptop powered by the Apple M3 chip.',
    specifications: {
      Processor: 'Apple M3',
      Memory: '8GB unified memory',
      Storage: '256GB SSD',
      Display: '13.6-inch Liquid Retina',
    },
  },
  {
    id: 'seed-product-xps-13',
    name: 'XPS 13 Laptop',
    slug: 'xps-13-laptop',
    categorySlug: 'computers',
    brandSlug: 'dell',
    priceCents: 124_900,
    stockQuantity: 10,
    sku: 'DEL-XPS13-I7',
    description: 'Premium ultrabook with a vivid InfinityEdge display.',
    specifications: {
      Processor: 'Intel Core i7',
      Memory: '16GB LPDDR5',
      Storage: '512GB SSD',
      Display: '13.4-inch FHD+',
    },
  },
  {
    id: 'seed-product-spectre-x360',
    name: 'Spectre x360 14',
    slug: 'spectre-x360-14',
    categorySlug: 'computers',
    brandSlug: 'hp',
    priceCents: 139_900,
    stockQuantity: 8,
    sku: 'HP-SPX360-14',
    description: 'Convertible laptop with OLED display and long battery life.',
    specifications: {
      Processor: 'Intel Core Ultra 7',
      Memory: '16GB',
      Storage: '1TB SSD',
      Display: '14-inch OLED touch',
    },
  },
  {
    id: 'seed-product-ultrasharp-27-4k',
    name: 'UltraSharp 27-inch 4K Monitor',
    slug: 'ultrasharp-27-4k-monitor',
    categorySlug: 'monitors',
    brandSlug: 'dell',
    priceCents: 57_900,
    stockQuantity: 22,
    sku: 'DEL-U2723QE',
    description: 'Color-accurate 4K USB-C monitor for creative work.',
    specifications: {
      Size: '27-inch',
      Resolution: '3840 x 2160',
      Panel: 'IPS',
      Ports: 'USB-C, HDMI, DisplayPort',
    },
  },
  {
    id: 'seed-product-ultragear-27',
    name: 'UltraGear 27-inch Gaming Monitor',
    slug: 'ultragear-27-gaming-monitor',
    categorySlug: 'monitors',
    brandSlug: 'lg',
    priceCents: 39_900,
    stockQuantity: 18,
    sku: 'LG-27GR95QE',
    featured: true,
    description: '240Hz OLED gaming monitor with near-instant response times.',
    specifications: {
      Size: '27-inch',
      Resolution: '2560 x 1440',
      RefreshRate: '240Hz',
      Panel: 'OLED',
    },
  },
  {
    id: 'seed-product-odyssey-g5',
    name: 'Odyssey G5 32-inch Monitor',
    slug: 'odyssey-g5-32-monitor',
    categorySlug: 'monitors',
    brandSlug: 'samsung',
    priceCents: 34_900,
    stockQuantity: 20,
    sku: 'SAM-LS32CG55',
    description: 'Curved QHD gaming display with a 165Hz refresh rate.',
    specifications: {
      Size: '32-inch',
      Resolution: '2560 x 1440',
      RefreshRate: '165Hz',
      Panel: 'VA curved',
    },
  },
  {
    id: 'seed-product-alpha-7-iv',
    name: 'Alpha 7 IV Mirrorless Camera',
    slug: 'alpha-7-iv-mirrorless-camera',
    categorySlug: 'cameras-photography',
    brandSlug: 'sony',
    priceCents: 249_900,
    stockQuantity: 6,
    sku: 'SNY-A7IV-BODY',
    featured: true,
    description: 'Full-frame hybrid camera with 33MP stills and 4K video.',
    specifications: {
      Sensor: '33MP full-frame',
      Video: '4K 60p',
      Autofocus: '759-point phase detection',
      Mount: 'Sony E-mount',
    },
  },
  {
    id: 'seed-product-eos-r8',
    name: 'EOS R8 Mirrorless Camera',
    slug: 'eos-r8-mirrorless-camera',
    categorySlug: 'cameras-photography',
    brandSlug: 'canon',
    priceCents: 149_900,
    stockQuantity: 7,
    sku: 'CAN-EOSR8-BODY',
    description: 'Lightweight full-frame camera with advanced subject detection.',
    specifications: {
      Sensor: '24.2MP full-frame',
      Video: '4K 60p',
      Autofocus: 'Dual Pixel CMOS AF II',
      Mount: 'Canon RF',
    },
  },
  {
    id: 'seed-product-nikon-z6-ii',
    name: 'Z6 II Mirrorless Camera',
    slug: 'z6-ii-mirrorless-camera',
    categorySlug: 'cameras-photography',
    brandSlug: 'nikon',
    priceCents: 199_900,
    stockQuantity: 5,
    sku: 'NIK-Z6II-BODY',
    description: 'Versatile full-frame camera with dual card slots.',
    specifications: {
      Sensor: '24.5MP full-frame',
      Video: '4K 30p',
      Stabilization: '5-axis VR',
      Mount: 'Nikon Z',
    },
  },
  {
    id: 'seed-product-mx-master-3s',
    name: 'MX Master 3S Wireless Mouse',
    slug: 'mx-master-3s-wireless-mouse',
    categorySlug: 'computer-accessories',
    brandSlug: 'logitech',
    priceCents: 9_900,
    stockQuantity: 45,
    sku: 'LOG-MXM3S-GRY',
    featured: true,
    description: 'Ergonomic productivity mouse with quiet clicks and fast scrolling.',
    specifications: {
      Connectivity: 'Bluetooth and Logi Bolt',
      Sensor: '8000 DPI',
      Battery: 'Up to 70 days',
      Buttons: '7 programmable buttons',
    },
  },
  {
    id: 'seed-product-mx-keys-s',
    name: 'MX Keys S Wireless Keyboard',
    slug: 'mx-keys-s-wireless-keyboard',
    categorySlug: 'computer-accessories',
    brandSlug: 'logitech',
    priceCents: 10_900,
    stockQuantity: 38,
    sku: 'LOG-MXKS-GRY',
    description: 'Low-profile wireless keyboard with smart backlighting.',
    specifications: {
      Connectivity: 'Bluetooth and Logi Bolt',
      Layout: 'Full-size',
      Battery: 'Up to 10 days with backlight',
      Compatibility: 'Windows, macOS, Linux',
    },
  },
  {
    id: 'seed-product-anker-737',
    name: '737 Power Bank 24000mAh',
    slug: '737-power-bank-24000mah',
    categorySlug: 'computer-accessories',
    brandSlug: 'anker',
    priceCents: 14_900,
    stockQuantity: 50,
    sku: 'ANK-A1289',
    description: 'High-capacity power bank with 140W fast charging.',
    specifications: {
      Capacity: '24000mAh',
      Output: '140W max',
      Ports: '2 USB-C, 1 USB-A',
      Display: 'Smart digital display',
    },
  },
  {
    id: 'seed-product-maggo-charger',
    name: 'MagGo Wireless Charger',
    slug: 'maggo-wireless-charger',
    categorySlug: 'mobile-accessories',
    brandSlug: 'anker',
    priceCents: 3_900,
    stockQuantity: 80,
    sku: 'ANK-MAGGO-15W',
    description: 'Magnetic 15W wireless charger for compatible phones.',
    specifications: {
      Power: '15W',
      Type: 'Magnetic wireless',
      Cable: '1.5m USB-C',
      Compatibility: 'MagSafe-compatible devices',
    },
  },
  {
    id: 'seed-product-samsung-45w-charger',
    name: '45W USB-C Super Fast Charger',
    slug: '45w-usb-c-super-fast-charger',
    categorySlug: 'mobile-accessories',
    brandSlug: 'samsung',
    priceCents: 4_900,
    stockQuantity: 65,
    sku: 'SAM-EP-T4510',
    description: 'Compact 45W charger for phones, tablets, and laptops.',
    specifications: {
      Power: '45W',
      Ports: 'USB-C',
      Protocol: 'USB PD 3.0',
      Compatibility: 'Universal USB-C devices',
    },
  },
  {
    id: 'seed-product-anker-cable',
    name: '20W USB-C Cable 2-Pack',
    slug: '20w-usb-c-cable-2-pack',
    categorySlug: 'mobile-accessories',
    brandSlug: 'anker',
    priceCents: 1_900,
    stockQuantity: 120,
    sku: 'ANK-CABLE-2PK',
    description: 'Durable USB-C cables for everyday charging.',
    specifications: {
      Length: '1m',
      Power: '20W',
      Pack: '2 cables',
      Connector: 'USB-C to USB-C',
    },
  },
  {
    id: 'seed-product-ps5-slim',
    name: 'PlayStation 5 Slim Console',
    slug: 'playstation-5-slim-console',
    categorySlug: 'gaming-entertainment',
    brandSlug: 'sony',
    priceCents: 49_900,
    stockQuantity: 11,
    sku: 'SNY-PS5-SLIM',
    featured: true,
    description: 'Compact PS5 console with 1TB storage and a disc drive.',
    specifications: {
      Storage: '1TB SSD',
      Resolution: 'Up to 4K 120Hz',
      Drive: 'Blu-ray disc drive',
      Controller: 'DualSense included',
    },
  },
  {
    id: 'seed-product-xbox-series-x',
    name: 'Xbox Series X Console',
    slug: 'xbox-series-x-console',
    categorySlug: 'gaming-entertainment',
    brandSlug: 'microsoft',
    priceCents: 49_900,
    stockQuantity: 9,
    sku: 'MS-XSX-1TB',
    description: 'Powerful 4K console with 1TB SSD and Quick Resume.',
    specifications: {
      Storage: '1TB SSD',
      Resolution: 'Up to 4K 120Hz',
      Drive: '4K UHD Blu-ray',
      Controller: 'Xbox Wireless Controller included',
    },
  },
  {
    id: 'seed-product-blackshark-v2-pro',
    name: 'BlackShark V2 Pro Gaming Headset',
    slug: 'blackshark-v2-pro-gaming-headset',
    categorySlug: 'gaming-entertainment',
    brandSlug: 'razer',
    priceCents: 19_900,
    stockQuantity: 24,
    sku: 'RAZ-BSV2P-BLK',
    description: 'Wireless esports headset with a detachable noise-cancelling mic.',
    specifications: {
      Type: 'Over-ear wireless',
      Battery: 'Up to 70 hours',
      Microphone: 'Detachable Super Wideband',
      Connectivity: '2.4GHz wireless',
    },
  },
  {
    id: 'seed-product-apple-watch-s9',
    name: 'Apple Watch Series 9',
    slug: 'apple-watch-series-9',
    categorySlug: 'smart-devices',
    brandSlug: 'apple',
    priceCents: 39_900,
    stockQuantity: 27,
    sku: 'APL-AWS9-41',
    featured: true,
    description: 'Advanced health sensors, bright display, and double tap gesture.',
    specifications: {
      Size: '41mm',
      Chip: 'S9 SiP',
      Display: 'Always-On Retina',
      Health: 'ECG and blood oxygen',
    },
  },
  {
    id: 'seed-product-galaxy-watch-6',
    name: 'Galaxy Watch 6',
    slug: 'galaxy-watch-6',
    categorySlug: 'smart-devices',
    brandSlug: 'samsung',
    priceCents: 29_900,
    stockQuantity: 22,
    sku: 'SAM-GW6-40',
    description: 'Sleek smartwatch with advanced sleep coaching and fitness tracking.',
    specifications: {
      Size: '40mm',
      Display: 'Super AMOLED',
      Battery: 'Up to 40 hours',
      Health: 'Sleep coaching and heart rate',
    },
  },
  {
    id: 'seed-product-nest-hub',
    name: 'Nest Hub (2nd generation)',
    slug: 'nest-hub-2nd-generation',
    categorySlug: 'smart-devices',
    brandSlug: 'google',
    priceCents: 9_900,
    stockQuantity: 33,
    sku: 'GOO-NESTHUB2',
    description: 'Smart display with sleep sensing and Google Assistant.',
    specifications: {
      Display: '7-inch touchscreen',
      Assistant: 'Google Assistant',
      Sensors: 'Soli sleep sensing',
      Connectivity: 'Wi-Fi and Bluetooth',
    },
  },
];

function placeholderImage(text: string, background: string): string {
  return `https://placehold.co/800x600/${background}/ffffff?text=${encodeURIComponent(text)}`;
}

export interface SeedResult {
  users: number;
  categories: number;
  brands: number;
  products: number;
  images: number;
}

export async function seedDemoData(
  db: DatabaseClient,
  passwordHasher: PasswordHasher,
): Promise<SeedResult> {
  const timestamp = nowIso();

  const demoUsers = [
    {
      id: 'seed-user-admin',
      email: 'admin@loqta.dev',
      password: 'Admin123!',
      fullName: 'Loqta Admin',
      role: 'Admin' as const,
    },
    {
      id: 'seed-user-demo',
      email: 'user@loqta.dev',
      password: 'User123!',
      fullName: 'Demo Customer',
      role: 'User' as const,
    },
  ];

  for (const user of demoUsers) {
    const existing = await db.get<{ id: string }>('SELECT id FROM users WHERE email = ?', [
      user.email,
    ]);

    if (!existing) {
      const passwordHash = await passwordHasher.hash(user.password);
      await db.run(
        `INSERT INTO users (id, email, password_hash, full_name, role)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.email, passwordHash, user.fullName, user.role],
      );
    } else if (user.role === 'Admin') {
      // Keep the documented demo administrator usable after role experiments.
      await db.run("UPDATE users SET role = 'Admin', is_active = 1 WHERE id = ?", [existing.id]);
    }
  }

  for (const category of CATEGORIES) {
    await db.run(
      `INSERT INTO categories
        (id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT (slug) DO NOTHING`,
      [
        category.id,
        category.name,
        category.slug,
        category.description,
        category.imageUrl,
        category.sortOrder,
        timestamp,
        timestamp,
      ],
    );
  }

  for (const brand of BRANDS) {
    await db.run(
      `INSERT INTO brands
        (id, name, slug, description, logo_url, website_url, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
       ON CONFLICT (slug) DO NOTHING`,
      [
        brand.id,
        brand.name,
        brand.slug,
        brand.description,
        placeholderImage(brand.name, '0f172a'),
        brand.websiteUrl,
        timestamp,
        timestamp,
      ],
    );
  }

  const categoryRows = await db.all<{ id: string; slug: string }>(
    'SELECT id, slug FROM categories',
  );
  const brandRows = await db.all<{ id: string; slug: string }>('SELECT id, slug FROM brands');
  const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]));
  const brandIdBySlug = new Map(brandRows.map((row) => [row.slug, row.id]));

  let productCount = 0;
  let imageCount = 0;

  for (const product of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    const brandId = brandIdBySlug.get(product.brandSlug);
    if (!categoryId || !brandId) {
      throw new Error(`Seed product ${product.slug} references an unknown category or brand`);
    }

    await db.run(
      `INSERT INTO products
        (id, category_id, brand_id, name, slug, description, specifications, price_cents,
         currency, stock_quantity, sku, is_active, is_featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, 1, ?, ?, ?)
       ON CONFLICT (slug) DO NOTHING`,
      [
        product.id,
        categoryId,
        brandId,
        product.name,
        product.slug,
        product.description,
        JSON.stringify(product.specifications),
        product.priceCents,
        product.stockQuantity,
        product.sku,
        product.featured ? 1 : 0,
        timestamp,
        timestamp,
      ],
    );

    const persisted = await db.get<{ id: string }>('SELECT id FROM products WHERE id = ?', [
      product.id,
    ]);
    if (!persisted) continue;

    productCount += 1;
    const images = [
      {
        id: `${product.id}-image-primary`,
        url: placeholderImage(product.name, '1e293b'),
        altText: `${product.name} primary image`,
        sortOrder: 0,
        isPrimary: 1,
      },
      {
        id: `${product.id}-image-alt`,
        url: placeholderImage(`${product.name} detail`, '334155'),
        altText: `${product.name} detail image`,
        sortOrder: 1,
        isPrimary: 0,
      },
    ];

    for (const image of images) {
      const result = await db.run(
        `INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
        [
          image.id,
          product.id,
          image.url,
          image.altText,
          image.sortOrder,
          image.isPrimary,
          timestamp,
        ],
      );
      imageCount += result.changes;
    }
  }

  return {
    users: demoUsers.length,
    categories: CATEGORIES.length,
    brands: BRANDS.length,
    products: productCount,
    images: imageCount,
  };
}
