// import { PrismaClient, Role, DiscountType, SpecialTag } from '@prisma/client';
// import bcrypt from 'bcryptjs';

declare const process: {
  exit(code?: number): never;
  env: Record<string, string | undefined>;
};

// const prisma = new PrismaClient();

// async function hash(pw: string) {
//   return bcrypt.hash(pw, 12);
// }

// async function main() {
//   console.log('Seeding database...');

//   // ---------------- Restaurant ----------------
//   const existingRestaurant = await prisma.restaurant.findFirst();
//   const restaurant =
//     existingRestaurant ??
//     (await prisma.restaurant.create({
//       data: {
//         name: 'Spice Haven',
//         description: 'Authentic South Indian & multi-cuisine flavors, made fresh every day.',
//         phone: '+91 98765 43210',
//         whatsappNumber: '+919876543210',
//         email: 'hello@spicehaven.example',
//         addressLine: '12 Gandhi Street, RS Puram',
//         city: 'Coimbatore',
//         state: 'Tamil Nadu',
//         pincode: '641002',
//         mapLat: 11.0018,
//         mapLng: 76.9628,
//         openingHours: {
//           mon: '10:00-22:30', tue: '10:00-22:30', wed: '10:00-22:30', thu: '10:00-22:30',
//           fri: '10:00-23:00', sat: '10:00-23:00', sun: '10:00-23:00',
//         },
//         socialLinks: { instagram: 'https://instagram.com/spicehaven', facebook: 'https://facebook.com/spicehaven' },
//         currency: 'INR',
//         currencySymbol: '₹',
//         gstNumber: '33AAAAA0000A1Z5',
//         taxPercent: 5,
//         deliveryCharge: 40,
//         freeDeliveryAbove: 499,
//         minimumOrder: 99,
//         seoTitle: 'Spice Haven — Order Online | Authentic Indian Restaurant',
//         seoDescription: 'Order delicious biryani, South Indian, and multi-cuisine food online from Spice Haven. Fast delivery, pickup and dine-in.',
//         seoKeywords: 'restaurant, biryani, south indian food, online food order, coimbatore restaurant',
//         announcementText: "🎉 Today's Special: Free delivery on orders above ₹499!",
//         heroTitle: 'Flavors That Feel Like Home',
//         heroDescription: 'Freshly prepared biryanis, tandoori delights and comfort food — delivered hot, every time.',
//         aboutContent:
//           'Spice Haven has been serving the neighborhood with authentic, made-from-scratch Indian cuisine. Every dish is prepared with fresh ingredients and time-honored recipes.',
//       },
//     }));

//   // ---------------- Users ----------------
//   const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
//   const managerPassword = process.env.SEED_MANAGER_PASSWORD ?? 'ChangeMe123!';
//   const cashierPassword = process.env.SEED_CASHIER_PASSWORD ?? 'ChangeMe123!';

//   const admin = await prisma.user.upsert({
//     where: { email: 'admin@spicehaven.example' },
//     update: {},
//     create: { name: 'Restaurant Owner', email: 'admin@spicehaven.example', passwordHash: await hash(adminPassword), role: Role.SUPER_ADMIN },
//   });
//   await prisma.user.upsert({
//     where: { email: 'manager@spicehaven.example' },
//     update: {},
//     create: { name: 'Floor Manager', email: 'manager@spicehaven.example', passwordHash: await hash(managerPassword), role: Role.MANAGER },
//   });
//   await prisma.user.upsert({
//     where: { email: 'cashier@spicehaven.example' },
//     update: {},
//     create: { name: 'Counter Cashier', email: 'cashier@spicehaven.example', passwordHash: await hash(cashierPassword), role: Role.CASHIER },
//   });

//   // ---------------- Categories ----------------
//   const categoryDefs = [
//     { name: 'Starters', slug: 'starters', displayOrder: 1 },
//     { name: 'Biryani', slug: 'biryani', displayOrder: 2 },
//     { name: 'Rice', slug: 'rice', displayOrder: 3 },
//     { name: 'Noodles', slug: 'noodles', displayOrder: 4 },
//     { name: 'Main Course', slug: 'main-course', displayOrder: 5 },
//     { name: 'Pizza', slug: 'pizza', displayOrder: 6 },
//     { name: 'Burgers', slug: 'burgers', displayOrder: 7 },
//     { name: 'Snacks', slug: 'snacks', displayOrder: 8 },
//     { name: 'Desserts', slug: 'desserts', displayOrder: 9 },
//     { name: 'Beverages', slug: 'beverages', displayOrder: 10 },
//   ];
//   const categories: Record<string, string> = {};
//   for (const c of categoryDefs) {
//     const created = await prisma.category.upsert({
//       where: { slug: c.slug },
//       update: {},
//       create: { ...c, description: `${c.name} made fresh to order.`, isActive: true },
//     });
//     categories[c.slug] = created.id;
//   }

//   // ---------------- Products (25+) ----------------
//   const productDefs = [
//     { name: 'Chicken 65', slug: 'chicken-65', category: 'starters', price: 220, veg: false, tags: ['spicy', 'popular'], bestseller: true },
//     { name: 'Paneer Tikka', slug: 'paneer-tikka', category: 'starters', price: 200, veg: true, tags: ['tandoori'] },
//     { name: 'Gobi Manchurian', slug: 'gobi-manchurian', category: 'starters', price: 180, veg: true, tags: ['indo-chinese'] },
//     { name: 'Chicken Lollipop', slug: 'chicken-lollipop', category: 'starters', price: 240, veg: false, tags: ['spicy'] },
//     { name: 'Chicken Biryani', slug: 'chicken-biryani', category: 'biryani', price: 260, discountPrice: 240, veg: false, bestseller: true, special: SpecialTag.BESTSELLER, tags: ['signature'] },
//     { name: 'Mutton Biryani', slug: 'mutton-biryani', category: 'biryani', price: 320, veg: false, special: SpecialTag.CHEF_SPECIAL, tags: ['signature'] },
//     { name: 'Veg Biryani', slug: 'veg-biryani', category: 'biryani', price: 200, veg: true, tags: ['comfort-food'] },
//     { name: 'Egg Biryani', slug: 'egg-biryani', category: 'biryani', price: 210, veg: false },
//     { name: 'Fried Rice', slug: 'fried-rice', category: 'rice', price: 170, veg: true, tags: ['indo-chinese'] },
//     { name: 'Schezwan Fried Rice', slug: 'schezwan-fried-rice', category: 'rice', price: 190, veg: true, tags: ['spicy'] },
//     { name: 'Jeera Rice', slug: 'jeera-rice', category: 'rice', price: 140, veg: true },
//     { name: 'Hakka Noodles', slug: 'hakka-noodles', category: 'noodles', price: 180, veg: true },
//     { name: 'Chicken Noodles', slug: 'chicken-noodles', category: 'noodles', price: 210, veg: false },
//     { name: 'Paneer Butter Masala', slug: 'paneer-butter-masala', category: 'main-course', price: 240, veg: true, bestseller: true, tags: ['creamy'] },
//     { name: 'Butter Chicken', slug: 'butter-chicken', category: 'main-course', price: 280, veg: false, special: SpecialTag.TODAYS_SPECIAL },
//     { name: 'Dal Tadka', slug: 'dal-tadka', category: 'main-course', price: 160, veg: true },
//     { name: 'Kadai Chicken', slug: 'kadai-chicken', category: 'main-course', price: 270, veg: false },
//     { name: 'Dosa', slug: 'dosa', category: 'main-course', price: 90, veg: true, tags: ['south-indian', 'breakfast'] },
//     { name: 'Parotta (2 pcs)', slug: 'parotta', category: 'main-course', price: 60, veg: true, tags: ['south-indian'] },
//     { name: 'Margherita Pizza', slug: 'margherita-pizza', category: 'pizza', price: 250, veg: true },
//     { name: 'Chicken Tikka Pizza', slug: 'chicken-tikka-pizza', category: 'pizza', price: 320, veg: false },
//     { name: 'Classic Veg Burger', slug: 'classic-veg-burger', category: 'burgers', price: 130, veg: true },
//     { name: 'Crispy Chicken Burger', slug: 'crispy-chicken-burger', category: 'burgers', price: 170, veg: false, bestseller: true },
//     { name: 'French Fries', slug: 'french-fries', category: 'snacks', price: 110, veg: true, tags: ['sides'] },
//     { name: 'Spring Rolls', slug: 'spring-rolls', category: 'snacks', price: 150, veg: true },
//     { name: 'Gulab Jamun (2 pcs)', slug: 'gulab-jamun', category: 'desserts', price: 80, veg: true, special: SpecialTag.WEEKEND_SPECIAL },
//     { name: 'Chocolate Brownie', slug: 'chocolate-brownie', category: 'desserts', price: 120, veg: true },
//     { name: 'Fresh Lime Soda', slug: 'fresh-lime-soda', category: 'beverages', price: 70, veg: true },
//     { name: 'Mango Lassi', slug: 'mango-lassi', category: 'beverages', price: 90, veg: true, tags: ['seasonal'] },
//     { name: 'Masala Chai', slug: 'masala-chai', category: 'beverages', price: 40, veg: true },
//   ];

//   const createdProducts: Record<string, string> = {};
//   for (const p of productDefs) {
//     const product = await prisma.product.upsert({
//       where: { slug: p.slug },
//       update: {},
//       create: {
//         name: p.name,
//         slug: p.slug,
//         description: `Delicious ${p.name.toLowerCase()}, prepared fresh with quality ingredients.`,
//         categoryId: categories[p.category],
//         price: p.price,
//         discountPrice: (p as any).discountPrice ?? null,
//         isVeg: p.veg,
//         isBestseller: Boolean((p as any).bestseller),
//         specialTag: (p as any).special ?? null,
//         tags: p.tags ?? [],
//         prepTimeMinutes: 20,
//         images: { create: [{ url: `https://picsum.photos/seed/${p.slug}/600/400`, altText: p.name, sortOrder: 0 }] },
//         inventory: { create: { currentStock: 100, minStock: 10, status: 'IN_STOCK' } },
//       },
//     });
//     createdProducts[p.slug] = product.id;
//   }

//   // Add-ons for a couple of products
//   await prisma.addon.createMany({
//     data: [
//       { productId: createdProducts['chicken-biryani'], name: 'Extra Raita', price: 20 },
//       { productId: createdProducts['chicken-biryani'], name: 'Extra Gravy', price: 30 },
//       { productId: createdProducts['margherita-pizza'], name: 'Extra Cheese', price: 40 },
//       { productId: createdProducts['crispy-chicken-burger'], name: 'Add Cheese Slice', price: 20 },
//     ],
//     skipDuplicates: true,
//   });

//   // ---------------- Combos ----------------
//   const existingCombo = await prisma.combo.findUnique({ where: { slug: 'biryani-feast-combo' } });
//   if (!existingCombo) {
//     await prisma.combo.create({
//       data: {
//         name: 'Biryani Feast Combo',
//         slug: 'biryani-feast-combo',
//         description: 'Chicken Biryani + Chicken 65 + Fresh Lime Soda',
//         imageUrl: 'https://picsum.photos/seed/biryani-feast/600/400',
//         originalPrice: 260 + 220 + 70,
//         comboPrice: 449,
//         isFeatured: true,
//         items: {
//           create: [
//             { productId: createdProducts['chicken-biryani'], quantity: 1 },
//             { productId: createdProducts['chicken-65'], quantity: 1 },
//             { productId: createdProducts['fresh-lime-soda'], quantity: 1 },
//           ],
//         },
//       },
//     });
//   }

//   const existingCombo2 = await prisma.combo.findUnique({ where: { slug: 'burger-fries-combo' } });
//   if (!existingCombo2) {
//     await prisma.combo.create({
//       data: {
//         name: 'Burger & Fries Combo',
//         slug: 'burger-fries-combo',
//         description: 'Crispy Chicken Burger + French Fries + Masala Chai',
//         imageUrl: 'https://picsum.photos/seed/burger-combo/600/400',
//         originalPrice: 170 + 110 + 40,
//         comboPrice: 269,
//         isFeatured: true,
//         items: {
//           create: [
//             { productId: createdProducts['crispy-chicken-burger'], quantity: 1 },
//             { productId: createdProducts['french-fries'], quantity: 1 },
//             { productId: createdProducts['masala-chai'], quantity: 1 },
//           ],
//         },
//       },
//     });
//   }

//   // ---------------- Offers ----------------
//   await prisma.offer.createMany({
//     data: [
//       {
//         title: '10% off on Biryani orders above ₹300',
//         discountType: DiscountType.PERCENTAGE,
//         discountValue: 10,
//         minOrderAmount: 300,
//         maxDiscountAmount: 100,
//         scopeCategoryId: categories['biryani'],
//         isActive: true,
//       },
//       {
//         title: 'Flat ₹50 off on your first pizza order',
//         discountType: DiscountType.FIXED,
//         discountValue: 50,
//         minOrderAmount: 200,
//         scopeCategoryId: categories['pizza'],
//         isActive: true,
//       },
//     ],
//     skipDuplicates: true,
//   });

//   // ---------------- Coupons ----------------
//   await prisma.coupon.upsert({
//     where: { code: 'WELCOME50' },
//     update: {},
//     create: {
//       code: 'WELCOME50',
//       discountType: DiscountType.FIXED,
//       discountValue: 50,
//       minOrderAmount: 250,
//       usageLimit: 500,
//       perCustomerLimit: 1,
//       isActive: true,
//     },
//   });
//   await prisma.coupon.upsert({
//     where: { code: 'SPICE20' },
//     update: {},
//     create: {
//       code: 'SPICE20',
//       discountType: DiscountType.PERCENTAGE,
//       discountValue: 20,
//       minOrderAmount: 400,
//       maxDiscountAmount: 150,
//       usageLimit: 1000,
//       perCustomerLimit: 2,
//       isActive: true,
//     },
//   });

//   // ---------------- Gallery ----------------
//   await prisma.gallery.createMany({
//     data: [
//       { imageUrl: 'https://picsum.photos/seed/gallery1/800/600', caption: 'Our cozy dining hall', sortOrder: 1, isFeatured: true },
//       { imageUrl: 'https://picsum.photos/seed/gallery2/800/600', caption: 'Fresh biryani, straight from the pot', sortOrder: 2 },
//       { imageUrl: 'https://picsum.photos/seed/gallery3/800/600', caption: 'Chef at work', sortOrder: 3 },
//       { imageUrl: 'https://picsum.photos/seed/gallery4/800/600', caption: 'Weekend crowd favorites', sortOrder: 4 },
//     ],
//     skipDuplicates: true,
//   });

//   // ---------------- Reviews ----------------
//   await prisma.review.createMany({
//     data: [
//       { name: 'Priya S.', rating: 5, comment: 'Best biryani in town, hands down!', isApproved: true, isFeatured: true },
//       { name: 'Arjun K.', rating: 4, comment: 'Great taste, delivery was a bit late.', isApproved: true },
//       { name: 'Meena R.', rating: 5, comment: 'The combo meals are great value.', isApproved: true },
//     ],
//     skipDuplicates: true,
//   });

//   console.log('Seed complete.');
//   console.log('---------------------------------------------');
//   console.log('Demo admin credentials (change immediately):');
//   console.log(`  SUPER_ADMIN: admin@spicehaven.example / ${adminPassword}`);
//   console.log(`  MANAGER:     manager@spicehaven.example / ${managerPassword}`);
//   console.log(`  CASHIER:     cashier@spicehaven.example / ${cashierPassword}`);
//   console.log('---------------------------------------------');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
import { PrismaClient, Role, DiscountType, SpecialTag } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  console.log('Seeding database...');

  // ---------------- Restaurant ----------------
  const existingRestaurant = await prisma.restaurant.findFirst();
  const restaurant =
    existingRestaurant ??
    (await prisma.restaurant.create({
      data: {
        name: 'Spice Haven',
        description: 'Authentic South Indian & multi-cuisine flavors, made fresh every day.',
        phone: '+91 98765 43210',
        whatsappNumber: '+919876543210',
        email: 'hello@spicehaven.example',
        addressLine: '12 Gandhi Street, RS Puram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641002',
        mapLat: 11.0018,
        mapLng: 76.9628,
        openingHours: {
          mon: '10:00-22:30', tue: '10:00-22:30', wed: '10:00-22:30', thu: '10:00-22:30',
          fri: '10:00-23:00', sat: '10:00-23:00', sun: '10:00-23:00',
        },
        socialLinks: { instagram: 'https://instagram.com/spicehaven', facebook: 'https://facebook.com/spicehaven' },
        currency: 'INR',
        currencySymbol: '₹',
        gstNumber: '33AAAAA0000A1Z5',
        taxPercent: 5,
        deliveryCharge: 40,
        freeDeliveryAbove: 499,
        minimumOrder: 99,
        seoTitle: 'Spice Haven — Order Online | Authentic Indian Restaurant',
        seoDescription: 'Order delicious biryani, South Indian, and multi-cuisine food online from Spice Haven. Fast delivery, pickup and dine-in.',
        seoKeywords: 'restaurant, biryani, south indian food, online food order, coimbatore restaurant',
        announcementText: "🎉 Today's Special: Free delivery on orders above ₹499!",
        heroTitle: 'Flavors That Feel Like Home',
        heroDescription: 'Freshly prepared biryanis, tandoori delights and comfort food — delivered hot, every time.',
        aboutContent:
          'Spice Haven has been serving the neighborhood with authentic, made-from-scratch Indian cuisine. Every dish is prepared with fresh ingredients and time-honored recipes.',
      },
    }));

  // ---------------- Users ----------------
  // Treat an unset OR blank env var (e.g. `SEED_ADMIN_PASSWORD=` left empty
  // in .env, copied from .env.example) as "not provided" — `??` alone does
  // NOT catch this, since an empty string is not null/undefined, and would
  // silently hash an empty password.
  const envOrDefault = (value: string | undefined, fallback: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
  };
  const adminPassword = envOrDefault(process.env.SEED_ADMIN_PASSWORD, 'ChangeMe123!');
  const managerPassword = envOrDefault(process.env.SEED_MANAGER_PASSWORD, 'ChangeMe123!');
  const cashierPassword = envOrDefault(process.env.SEED_CASHIER_PASSWORD, 'ChangeMe123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@spicehaven.example' },
    update: { passwordHash: await hash(adminPassword), role: Role.SUPER_ADMIN, isActive: true },
    create: { name: 'Restaurant Owner', email: 'admin@spicehaven.example', passwordHash: await hash(adminPassword), role: Role.SUPER_ADMIN },
  });
  await prisma.user.upsert({
    where: { email: 'manager@spicehaven.example' },
    update: { passwordHash: await hash(managerPassword), role: Role.MANAGER, isActive: true },
    create: { name: 'Floor Manager', email: 'manager@spicehaven.example', passwordHash: await hash(managerPassword), role: Role.MANAGER },
  });
  await prisma.user.upsert({
    where: { email: 'cashier@spicehaven.example' },
    update: { passwordHash: await hash(cashierPassword), role: Role.CASHIER, isActive: true },
    create: { name: 'Counter Cashier', email: 'cashier@spicehaven.example', passwordHash: await hash(cashierPassword), role: Role.CASHIER },
  });

  // ---------------- Categories ----------------
  const categoryDefs = [
    { name: 'Starters', slug: 'starters', displayOrder: 1 },
    { name: 'Biryani', slug: 'biryani', displayOrder: 2 },
    { name: 'Rice', slug: 'rice', displayOrder: 3 },
    { name: 'Noodles', slug: 'noodles', displayOrder: 4 },
    { name: 'Main Course', slug: 'main-course', displayOrder: 5 },
    { name: 'Pizza', slug: 'pizza', displayOrder: 6 },
    { name: 'Burgers', slug: 'burgers', displayOrder: 7 },
    { name: 'Snacks', slug: 'snacks', displayOrder: 8 },
    { name: 'Desserts', slug: 'desserts', displayOrder: 9 },
    { name: 'Beverages', slug: 'beverages', displayOrder: 10 },
  ];
  const categories: Record<string, string> = {};
  for (const c of categoryDefs) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, description: `${c.name} made fresh to order.`, isActive: true },
    });
    categories[c.slug] = created.id;
  }

  // ---------------- Products (25+) ----------------
  const productDefs = [
    { name: 'Chicken 65', slug: 'chicken-65', category: 'starters', price: 220, veg: false, tags: ['spicy', 'popular'], bestseller: true },
    { name: 'Paneer Tikka', slug: 'paneer-tikka', category: 'starters', price: 200, veg: true, tags: ['tandoori'] },
    { name: 'Gobi Manchurian', slug: 'gobi-manchurian', category: 'starters', price: 180, veg: true, tags: ['indo-chinese'] },
    { name: 'Chicken Lollipop', slug: 'chicken-lollipop', category: 'starters', price: 240, veg: false, tags: ['spicy'] },
    { name: 'Chicken Biryani', slug: 'chicken-biryani', category: 'biryani', price: 260, discountPrice: 240, veg: false, bestseller: true, special: SpecialTag.BESTSELLER, tags: ['signature'] },
    { name: 'Mutton Biryani', slug: 'mutton-biryani', category: 'biryani', price: 320, veg: false, special: SpecialTag.CHEF_SPECIAL, tags: ['signature'] },
    { name: 'Veg Biryani', slug: 'veg-biryani', category: 'biryani', price: 200, veg: true, tags: ['comfort-food'] },
    { name: 'Egg Biryani', slug: 'egg-biryani', category: 'biryani', price: 210, veg: false },
    { name: 'Fried Rice', slug: 'fried-rice', category: 'rice', price: 170, veg: true, tags: ['indo-chinese'] },
    { name: 'Schezwan Fried Rice', slug: 'schezwan-fried-rice', category: 'rice', price: 190, veg: true, tags: ['spicy'] },
    { name: 'Jeera Rice', slug: 'jeera-rice', category: 'rice', price: 140, veg: true },
    { name: 'Hakka Noodles', slug: 'hakka-noodles', category: 'noodles', price: 180, veg: true },
    { name: 'Chicken Noodles', slug: 'chicken-noodles', category: 'noodles', price: 210, veg: false },
    { name: 'Paneer Butter Masala', slug: 'paneer-butter-masala', category: 'main-course', price: 240, veg: true, bestseller: true, tags: ['creamy'] },
    { name: 'Butter Chicken', slug: 'butter-chicken', category: 'main-course', price: 280, veg: false, special: SpecialTag.TODAYS_SPECIAL },
    { name: 'Dal Tadka', slug: 'dal-tadka', category: 'main-course', price: 160, veg: true },
    { name: 'Kadai Chicken', slug: 'kadai-chicken', category: 'main-course', price: 270, veg: false },
    { name: 'Dosa', slug: 'dosa', category: 'main-course', price: 90, veg: true, tags: ['south-indian', 'breakfast'] },
    { name: 'Parotta (2 pcs)', slug: 'parotta', category: 'main-course', price: 60, veg: true, tags: ['south-indian'] },
    { name: 'Margherita Pizza', slug: 'margherita-pizza', category: 'pizza', price: 250, veg: true },
    { name: 'Chicken Tikka Pizza', slug: 'chicken-tikka-pizza', category: 'pizza', price: 320, veg: false },
    { name: 'Classic Veg Burger', slug: 'classic-veg-burger', category: 'burgers', price: 130, veg: true },
    { name: 'Crispy Chicken Burger', slug: 'crispy-chicken-burger', category: 'burgers', price: 170, veg: false, bestseller: true },
    { name: 'French Fries', slug: 'french-fries', category: 'snacks', price: 110, veg: true, tags: ['sides'] },
    { name: 'Spring Rolls', slug: 'spring-rolls', category: 'snacks', price: 150, veg: true },
    { name: 'Gulab Jamun (2 pcs)', slug: 'gulab-jamun', category: 'desserts', price: 80, veg: true, special: SpecialTag.WEEKEND_SPECIAL },
    { name: 'Chocolate Brownie', slug: 'chocolate-brownie', category: 'desserts', price: 120, veg: true },
    { name: 'Fresh Lime Soda', slug: 'fresh-lime-soda', category: 'beverages', price: 70, veg: true },
    { name: 'Mango Lassi', slug: 'mango-lassi', category: 'beverages', price: 90, veg: true, tags: ['seasonal'] },
    { name: 'Masala Chai', slug: 'masala-chai', category: 'beverages', price: 40, veg: true },
  ];

  const createdProducts: Record<string, string> = {};
  for (const p of productDefs) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: `Delicious ${p.name.toLowerCase()}, prepared fresh with quality ingredients.`,
        categoryId: categories[p.category],
        price: p.price,
        discountPrice: (p as any).discountPrice ?? null,
        isVeg: p.veg,
        isBestseller: Boolean((p as any).bestseller),
        specialTag: (p as any).special ?? null,
        tags: p.tags ?? [],
        prepTimeMinutes: 20,
        images: { create: [{ url: `https://picsum.photos/seed/${p.slug}/600/400`, altText: p.name, sortOrder: 0 }] },
        inventory: { create: { currentStock: 100, minStock: 10, status: 'IN_STOCK' } },
      },
    });
    createdProducts[p.slug] = product.id;
  }

  // Add-ons for a couple of products
  await prisma.addon.createMany({
    data: [
      { productId: createdProducts['chicken-biryani'], name: 'Extra Raita', price: 20 },
      { productId: createdProducts['chicken-biryani'], name: 'Extra Gravy', price: 30 },
      { productId: createdProducts['margherita-pizza'], name: 'Extra Cheese', price: 40 },
      { productId: createdProducts['crispy-chicken-burger'], name: 'Add Cheese Slice', price: 20 },
    ],
    skipDuplicates: true,
  });

  // ---------------- Combos ----------------
  const existingCombo = await prisma.combo.findUnique({ where: { slug: 'biryani-feast-combo' } });
  if (!existingCombo) {
    await prisma.combo.create({
      data: {
        name: 'Biryani Feast Combo',
        slug: 'biryani-feast-combo',
        description: 'Chicken Biryani + Chicken 65 + Fresh Lime Soda',
        imageUrl: 'https://picsum.photos/seed/biryani-feast/600/400',
        originalPrice: 260 + 220 + 70,
        comboPrice: 449,
        isFeatured: true,
        items: {
          create: [
            { productId: createdProducts['chicken-biryani'], quantity: 1 },
            { productId: createdProducts['chicken-65'], quantity: 1 },
            { productId: createdProducts['fresh-lime-soda'], quantity: 1 },
          ],
        },
      },
    });
  }

  const existingCombo2 = await prisma.combo.findUnique({ where: { slug: 'burger-fries-combo' } });
  if (!existingCombo2) {
    await prisma.combo.create({
      data: {
        name: 'Burger & Fries Combo',
        slug: 'burger-fries-combo',
        description: 'Crispy Chicken Burger + French Fries + Masala Chai',
        imageUrl: 'https://picsum.photos/seed/burger-combo/600/400',
        originalPrice: 170 + 110 + 40,
        comboPrice: 269,
        isFeatured: true,
        items: {
          create: [
            { productId: createdProducts['crispy-chicken-burger'], quantity: 1 },
            { productId: createdProducts['french-fries'], quantity: 1 },
            { productId: createdProducts['masala-chai'], quantity: 1 },
          ],
        },
      },
    });
  }

  // ---------------- Offers ----------------
  await prisma.offer.createMany({
    data: [
      {
        title: '10% off on Biryani orders above ₹300',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minOrderAmount: 300,
        maxDiscountAmount: 100,
        scopeCategoryId: categories['biryani'],
        isActive: true,
      },
      {
        title: 'Flat ₹50 off on your first pizza order',
        discountType: DiscountType.FIXED,
        discountValue: 50,
        minOrderAmount: 200,
        scopeCategoryId: categories['pizza'],
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // ---------------- Coupons ----------------
  await prisma.coupon.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      discountType: DiscountType.FIXED,
      discountValue: 50,
      minOrderAmount: 250,
      usageLimit: 500,
      perCustomerLimit: 1,
      isActive: true,
    },
  });
  await prisma.coupon.upsert({
    where: { code: 'SPICE20' },
    update: {},
    create: {
      code: 'SPICE20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minOrderAmount: 400,
      maxDiscountAmount: 150,
      usageLimit: 1000,
      perCustomerLimit: 2,
      isActive: true,
    },
  });

  // ---------------- Gallery ----------------
  await prisma.gallery.createMany({
    data: [
      { imageUrl: 'https://picsum.photos/seed/gallery1/800/600', caption: 'Our cozy dining hall', sortOrder: 1, isFeatured: true },
      { imageUrl: 'https://picsum.photos/seed/gallery2/800/600', caption: 'Fresh biryani, straight from the pot', sortOrder: 2 },
      { imageUrl: 'https://picsum.photos/seed/gallery3/800/600', caption: 'Chef at work', sortOrder: 3 },
      { imageUrl: 'https://picsum.photos/seed/gallery4/800/600', caption: 'Weekend crowd favorites', sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // ---------------- Reviews ----------------
  await prisma.review.createMany({
    data: [
      { name: 'Priya S.', rating: 5, comment: 'Best biryani in town, hands down!', isApproved: true, isFeatured: true },
      { name: 'Arjun K.', rating: 4, comment: 'Great taste, delivery was a bit late.', isApproved: true },
      { name: 'Meena R.', rating: 5, comment: 'The combo meals are great value.', isApproved: true },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
  console.log('---------------------------------------------');
  console.log('Demo admin credentials (change immediately):');
  console.log(`  SUPER_ADMIN: admin@spicehaven.example / ${adminPassword}`);
  console.log(`  MANAGER:     manager@spicehaven.example / ${managerPassword}`);
  console.log(`  CASHIER:     cashier@spicehaven.example / ${cashierPassword}`);
  console.log('---------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });