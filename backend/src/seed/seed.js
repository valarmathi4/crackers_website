import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import bcrypt from "bcryptjs";

async function run() {
  await connectDb();

  // Clear existing
  await User.deleteMany({});
  await Product.deleteMany({});

  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@crackerstore.local";

  const admin = await User.create({
    name: "Admin",
    email: adminEmail,
    isAdmin: true,
    passwordHash: await bcrypt.hash(adminPassword, 10),
  });

  const products = [
    // Sparklers (7)
    {
      name: "Festival Sparkler Pack",
      description: "Long-burning sparklers ideal for evening celebrations.",
      category: "Sparklers",
      price: 79,
      stock: 120,
      featured: true,
      imageUrl: "https://placehold.co/400x300/ff7f50/ffffff?text=Festival+Sparklers",
    },
    {
      name: "Color Twister Sparklers",
      description: "Multi-color sparklers that shift hues while burning.",
      category: "Sparklers",
      price: 89,
      stock: 100,
      featured: false,
      imageUrl: "https://placehold.co/400x300/ff7f50/ffffff?text=Color+Twister",
    },
    {
      name: "Gold Rain Sparklers",
      description: "Golden shower effect with low smoke output.",
      category: "Sparklers",
      price: 99,
      stock: 90,
      featured: true,
      imageUrl: "https://placehold.co/400x300/ff7f50/ffffff?text=Gold+Rain",
    },
    {
      name: "Mini Kids Sparklers",
      description: "Short-length sparklers designed especially for kids.",
      category: "Sparklers",
      price: 59,
      stock: 150,
      featured: false,
      imageUrl: "https://placehold.co/400x300/ff7f50/ffffff?text=Kids+Sparklers",
    },
    {
      name: "Neon Sparkler Sticks",
      description: "Bright neon colors that glow vividly at night.",
      category: "Sparklers",
      price: 129,
      stock: 80,
      featured: false,
      imageUrl: "https://placehold.co/400x300/ff7f50/ffffff?text=Neon+Sparklers",
    },
    {
      name: "Royal Sparkle Combo",
      description: "Premium pack with assorted sparkler sizes and colors.",
      category: "Sparklers",
      price: 149,
      stock: 60,
      featured: true,
      imageUrl: "https://placehold.co/400x300/ff7f50/ffffff?text=Royal+Sparkle",
    },
    {
      name: "Sparkler Delight Pack",
      description: "Colorful sparklers perfect for kids and family celebrations.",
      category: "Sparklers",
      price: 99,
      stock: 100,
      featured: true,
      imageUrl: "https://placehold.co/400x300/ff7f50/ffffff?text=Sparkler+Delight",
    },

    // Rockets (7)
    {
      name: "Sky Rocket Combo",
      description: "High-flying rockets with vibrant bursts in the night sky.",
      category: "Rockets",
      price: 399,
      stock: 50,
      featured: true,
      imageUrl: "https://placehold.co/400x300/4169e1/ffffff?text=Sky+Rocket+Combo",
    },
    {
      name: "Galaxy Trail Rockets",
      description: "Leave a sparkling trail before exploding into stars.",
      category: "Rockets",
      price: 449,
      stock: 40,
      featured: false,
      imageUrl: "https://placehold.co/400x300/4169e1/ffffff?text=Galaxy+Trail",
    },
    {
      name: "Thunder Flash Rockets",
      description: "Loud burst with bright white flash at high altitude.",
      category: "Rockets",
      price: 429,
      stock: 45,
      featured: false,
      imageUrl: "https://placehold.co/400x300/4169e1/ffffff?text=Thunder+Flash",
    },
    {
      name: "Color Burst Rockets",
      description: "Multi-color breaks with star and peony effects.",
      category: "Rockets",
      price: 469,
      stock: 35,
      featured: true,
      imageUrl: "https://placehold.co/400x300/4169e1/ffffff?text=Color+Burst",
    },
    {
      name: "Mini Garden Rockets",
      description: "Compact rockets suited for small spaces and terraces.",
      category: "Rockets",
      price: 259,
      stock: 70,
      featured: false,
      imageUrl: "https://placehold.co/400x300/4169e1/ffffff?text=Mini+Rockets",
    },
    {
      name: "Starry Night Rockets",
      description: "Creates a star-filled sky with long-lasting sparkles.",
      category: "Rockets",
      price: 499,
      stock: 30,
      featured: true,
      imageUrl: "https://placehold.co/400x300/4169e1/ffffff?text=Starry+Night",
    },
    {
      name: "Festival Rocket Assortment",
      description: "Mixed pack of rockets with varied heights and colors.",
      category: "Rockets",
      price: 519,
      stock: 40,
      featured: false,
      imageUrl: "https://placehold.co/400x300/4169e1/ffffff?text=Rocket+Assortment",
    },

    // Flower Pots (7)
    {
      name: "Floral Pots Mega Pack",
      description: "Beautiful flower pots with colorful fountain effects.",
      category: "Flower Pots",
      price: 249,
      stock: 60,
      featured: true,
      imageUrl: "https://placehold.co/400x300/32cd32/ffffff?text=Floral+Mega+Pack",
    },
    {
      name: "Silver Fountain Pots",
      description: "Tall silver fountains with graceful sparks.",
      category: "Flower Pots",
      price: 219,
      stock: 70,
      featured: false,
      imageUrl: "https://placehold.co/400x300/32cd32/ffffff?text=Silver+Fountain",
    },
    {
      name: "Rainbow Flower Pots",
      description: "Multi-color changing flames with crackling sound.",
      category: "Flower Pots",
      price: 279,
      stock: 55,
      featured: false,
      imageUrl: "https://placehold.co/400x300/32cd32/ffffff?text=Rainbow+Pots",
    },
    {
      name: "Garden Fountain Pack",
      description: "Assorted low-noise fountains for family gatherings.",
      category: "Flower Pots",
      price: 199,
      stock: 80,
      featured: false,
      imageUrl: "https://placehold.co/400x300/32cd32/ffffff?text=Garden+Fountain",
    },
    {
      name: "Golden Cone Pots",
      description: "Cone-shaped pots with tall golden plumes.",
      category: "Flower Pots",
      price: 299,
      stock: 45,
      featured: true,
      imageUrl: "https://placehold.co/400x300/32cd32/ffffff?text=Golden+Cone",
    },
    {
      name: "Glitter Breeze Pots",
      description: "Soft glittering showers with minimal smoke.",
      category: "Flower Pots",
      price: 229,
      stock: 65,
      featured: false,
      imageUrl: "https://placehold.co/400x300/32cd32/ffffff?text=Glitter+Breeze",
    },
    {
      name: "Color Storm Fountains",
      description: "High-intensity color storm effects for big nights.",
      category: "Flower Pots",
      price: 329,
      stock: 35,
      featured: true,
      imageUrl: "https://placehold.co/400x300/32cd32/ffffff?text=Color+Storm",
    },

    // Bombs (7)
    {
      name: "Thunder Bomb Box",
      description: "Powerful sound crackers for a thrilling experience.",
      category: "Bombs",
      price: 199,
      stock: 80,
      featured: false,
      imageUrl: "https://placehold.co/400x300/dc143c/ffffff?text=Thunder+Bomb",
    },
    {
      name: "Super Sonic Bombs",
      description: "High-decibel bombs for loud celebrations.",
      category: "Bombs",
      price: 229,
      stock: 70,
      featured: true,
      imageUrl: "https://placehold.co/400x300/dc143c/ffffff?text=Super+Sonic",
    },
    {
      name: "Color Crackle Bombs",
      description: "Sound bombs with crackling color bursts.",
      category: "Bombs",
      price: 249,
      stock: 65,
      featured: false,
      imageUrl: "https://placehold.co/400x300/dc143c/ffffff?text=Color+Crackle",
    },
    {
      name: "Mini Bullet Bombs",
      description: "Compact size bombs with strong sound effect.",
      category: "Bombs",
      price: 149,
      stock: 90,
      featured: false,
      imageUrl: "https://placehold.co/400x300/dc143c/ffffff?text=Mini+Bombs",
    },
    {
      name: "King Size Bombs",
      description: "Large, heavy-sound crackers for open grounds.",
      category: "Bombs",
      price: 299,
      stock: 40,
      featured: true,
      imageUrl: "https://placehold.co/400x300/dc143c/ffffff?text=King+Bombs",
    },
    {
      name: "Twister Chain Bombs",
      description: "Chain-linked bombs that fire in quick sequence.",
      category: "Bombs",
      price: 269,
      stock: 50,
      featured: false,
      imageUrl: "https://placehold.co/400x300/dc143c/ffffff?text=Chain+Bombs",
    },
    {
      name: "Festival Sound Mix",
      description: "Assorted set of bombs with varied intensities.",
      category: "Bombs",
      price: 319,
      stock: 45,
      featured: true,
      imageUrl: "https://placehold.co/400x300/dc143c/ffffff?text=Sound+Mix",
    },

    // Gift Boxes (7)
    {
      name: "Festive Gift Box",
      description: "Curated mix of sparklers, flower pots, and rockets.",
      category: "Gift Boxes",
      price: 799,
      stock: 40,
      featured: true,
      imageUrl: "https://placehold.co/400x300/b8860b/ffffff?text=Festive+Gift+Box",
    },
    {
      name: "Family Celebration Box",
      description: "Balanced mix for small family gatherings.",
      category: "Gift Boxes",
      price: 999,
      stock: 35,
      featured: false,
      imageUrl: "https://placehold.co/400x300/b8860b/ffffff?text=Family+Box",
    },
    {
      name: "Kids Joy Combo",
      description: "Child-friendly crackers with low noise and high color.",
      category: "Gift Boxes",
      price: 699,
      stock: 50,
      featured: true,
      imageUrl: "https://placehold.co/400x300/b8860b/ffffff?text=Kids+Joy",
    },
    {
      name: "Royal Festival Hamper",
      description: "Premium hamper for gifting and large parties.",
      category: "Gift Boxes",
      price: 1499,
      stock: 25,
      featured: true,
      imageUrl: "https://placehold.co/400x300/b8860b/ffffff?text=Royal+Hamper",
    },
    {
      name: "Budget Delight Box",
      description: "Value pack with all essentials for diwali night.",
      category: "Gift Boxes",
      price: 599,
      stock: 60,
      featured: false,
      imageUrl: "https://placehold.co/400x300/b8860b/ffffff?text=Budget+Delight",
    },
    {
      name: "Premium Celebration Chest",
      description: "Large selection of rockets, pots, bombs and sparklers.",
      category: "Gift Boxes",
      price: 1999,
      stock: 20,
      featured: true,
      imageUrl: "https://placehold.co/400x300/b8860b/ffffff?text=Premium+Chest",
    },
    {
      name: "Office Party Combo",
      description: "Designed for office and community celebrations.",
      category: "Gift Boxes",
      price: 1299,
      stock: 30,
      featured: false,
      imageUrl: "https://placehold.co/400x300/b8860b/ffffff?text=Office+Combo",
    },
  ];

  await Product.insertMany(products);

  // eslint-disable-next-line no-console
  console.log("Seed completed. Admin user:", admin.email);
  await mongoose.connection.close();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

