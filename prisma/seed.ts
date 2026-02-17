import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const categoriesData = [
  "Eletrônicos",
  "Computadores",
  "Periféricos",
  "Áudio",
  "Gaming",
  "Casa Inteligente",
];

const productsData: { name: string; price: number; stock: number; category: string }[] = [
  // Eletrônicos
  { name: "iPhone 15 Pro Max 256GB", price: 9499.00, stock: 24, category: "Eletrônicos" },
  { name: "Samsung Galaxy S24 Ultra", price: 8499.00, stock: 31, category: "Eletrônicos" },
  { name: "iPad Air M2 11\"", price: 5999.00, stock: 18, category: "Eletrônicos" },
  { name: "Apple Watch Series 9 45mm", price: 3999.00, stock: 42, category: "Eletrônicos" },
  { name: "AirPods Pro 2 USB-C", price: 1899.00, stock: 56, category: "Eletrônicos" },

  // Computadores
  { name: "MacBook Pro M4 14\" 16GB", price: 18999.00, stock: 12, category: "Computadores" },
  { name: "Dell XPS 15 i7 32GB", price: 12499.00, stock: 8, category: "Computadores" },
  { name: "ThinkPad X1 Carbon Gen 12", price: 11299.00, stock: 15, category: "Computadores" },
  { name: "iMac 24\" M3 16GB", price: 14999.00, stock: 6, category: "Computadores" },
  { name: "Mac Mini M4 Pro 24GB", price: 12499.00, stock: 19, category: "Computadores" },

  // Periféricos
  { name: "Logitech MX Master 3S", price: 649.00, stock: 73, category: "Periféricos" },
  { name: "Keychron Q1 Pro Wireless", price: 1299.00, stock: 34, category: "Periféricos" },
  { name: "Monitor LG UltraWide 34\" QHD", price: 3299.00, stock: 11, category: "Periféricos" },
  { name: "Webcam Logitech Brio 4K", price: 899.00, stock: 47, category: "Periféricos" },
  { name: "Hub USB-C Satechi 7 em 1", price: 449.00, stock: 62, category: "Periféricos" },

  // Áudio
  { name: "Sony WH-1000XM5", price: 2299.00, stock: 28, category: "Áudio" },
  { name: "JBL Charge 5 Bluetooth", price: 899.00, stock: 53, category: "Áudio" },
  { name: "Bose QuietComfort Ultra", price: 2799.00, stock: 16, category: "Áudio" },
  { name: "Marshall Stanmore III", price: 3499.00, stock: 9, category: "Áudio" },
  { name: "AirPods Max USB-C", price: 4499.00, stock: 21, category: "Áudio" },

  // Gaming
  { name: "PlayStation 5 Slim 1TB", price: 3799.00, stock: 38, category: "Gaming" },
  { name: "Nintendo Switch OLED", price: 2499.00, stock: 45, category: "Gaming" },
  { name: "Xbox Series X 1TB", price: 3499.00, stock: 22, category: "Gaming" },
  { name: "Steam Deck OLED 512GB", price: 3999.00, stock: 14, category: "Gaming" },
  { name: "Controle DualSense Edge", price: 1299.00, stock: 33, category: "Gaming" },

  // Casa Inteligente
  { name: "Echo Dot 5ª Geração", price: 399.00, stock: 87, category: "Casa Inteligente" },
  { name: "Google Nest Hub 2ª Geração", price: 699.00, stock: 41, category: "Casa Inteligente" },
  { name: "Philips Hue Starter Kit", price: 999.00, stock: 29, category: "Casa Inteligente" },
  { name: "Ring Video Doorbell 4", price: 799.00, stock: 36, category: "Casa Inteligente" },
  { name: "iRobot Roomba j7+", price: 4999.00, stock: 7, category: "Casa Inteligente" },
];

const eventsData = [
  { type: "restock", message: "Reabastecimento de 50 unidades do iPhone 15 Pro Max", product: "iPhone 15 Pro Max 256GB" },
  { type: "price_change", message: "Preço do MacBook Pro M4 reduzido em 10%", product: "MacBook Pro M4 14\" 16GB" },
  { type: "sale", message: "PlayStation 5 Slim vendido — 3 unidades", product: "PlayStation 5 Slim 1TB" },
  { type: "restock", message: "Lote de 30 unidades do Echo Dot recebido", product: "Echo Dot 5ª Geração" },
  { type: "price_change", message: "Promoção relâmpago: Sony WH-1000XM5 com 15% off", product: "Sony WH-1000XM5" },
  { type: "sale", message: "Steam Deck OLED — últimas 14 unidades em estoque", product: "Steam Deck OLED 512GB" },
  { type: "restock", message: "Keychron Q1 Pro — novo lote importado", product: "Keychron Q1 Pro Wireless" },
  { type: "pulse", message: "Monitor LG UltraWide atingiu estoque mínimo", product: "Monitor LG UltraWide 34\" QHD" },
  { type: "sale", message: "Apple Watch Series 9 — 5 vendidos hoje", product: "Apple Watch Series 9 45mm" },
  { type: "price_change", message: "Reajuste do Roomba j7+ para acompanhar dólar", product: "iRobot Roomba j7+" },
  { type: "restock", message: "AirPods Pro 2 — estoque normalizado", product: "AirPods Pro 2 USB-C" },
  { type: "sale", message: "Samsung Galaxy S24 Ultra vendido — 2 unidades", product: "Samsung Galaxy S24 Ultra" },
  { type: "pulse", message: "iMac 24\" com apenas 6 unidades restantes", product: "iMac 24\" M3 16GB" },
  { type: "price_change", message: "JBL Charge 5 em promoção de lançamento", product: "JBL Charge 5 Bluetooth" },
  { type: "restock", message: "Logitech MX Master 3S — 20 unidades adicionadas", product: "Logitech MX Master 3S" },
  { type: "sale", message: "Nintendo Switch OLED — 8 vendidos nesta semana", product: "Nintendo Switch OLED" },
  { type: "pulse", message: "Marshall Stanmore III abaixo do estoque mínimo", product: "Marshall Stanmore III" },
  { type: "restock", message: "Dell XPS 15 — reposição via importação direta", product: "Dell XPS 15 i7 32GB" },
  { type: "sale", message: "Ring Video Doorbell 4 — venda casada com Philips Hue", product: "Ring Video Doorbell 4" },
  { type: "price_change", message: "Bose QuietComfort Ultra — novo preço competitivo", product: "Bose QuietComfort Ultra" },
];

async function main() {
  await prisma.event.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const createdCategories = await Promise.all(
    categoriesData.map((name) => prisma.category.create({ data: { name } })),
  );

  const categoryMap = new Map(createdCategories.map((c) => [c.name, c.id]));

  const products = productsData.map((p) => ({
    name: p.name,
    price: p.price,
    stock: p.stock,
    categoryId: categoryMap.get(p.category)!,
  }));

  await prisma.product.createMany({ data: products });

  const productList = await prisma.product.findMany({ select: { id: true, name: true } });
  const productMap = new Map(productList.map((p) => [p.name, p.id]));

  const events = eventsData.map((e, idx) => ({
    type: e.type,
    message: e.message,
    productId: productMap.get(e.product) ?? null,
    createdAt: new Date(Date.now() - idx * 1000 * 60 * 15),
  }));

  await prisma.event.createMany({ data: events });

  const cacheDefaults = [
    { id: "featured",   label: "Destaques (Home)",   stale: 120, revalidate: 180, expire: 3600 },
    { id: "products",   label: "Lista de Produtos",  stale: 60,  revalidate: 120, expire: 1800 },
    { id: "product",    label: "Detalhe do Produto", stale: 120, revalidate: 300, expire: 3600 },
    { id: "events",     label: "Eventos",            stale: 60,  revalidate: 300, expire: 3600 },
    { id: "categories", label: "Categorias",         stale: 300, revalidate: 300, expire: 86400 },
  ];
  try {
    for (const cfg of cacheDefaults) {
      // Keep seeds deterministic: reset values back to defaults on every run.
      await prisma.cacheConfig.upsert({
        where: { id: cfg.id },
        update: { label: cfg.label, stale: cfg.stale, revalidate: cfg.revalidate, expire: cfg.expire },
        create: cfg,
      });
    }
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2021")) {
      console.warn(
        [
          "WARNING: CacheConfig table does not exist yet, skipping cache defaults seed.",
          "Run: `pnpm exec prisma db push --accept-data-loss` (or apply migrations) and then `pnpm seed` again.",
        ].join("\n"),
      );
    } else {
      throw error;
    }
  }

  console.log(
    `Seeded ${createdCategories.length} categories, ${products.length} products, ${events.length} events.`,
  );
}

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  return "code" in error && (error as { code?: unknown }).code === code;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
