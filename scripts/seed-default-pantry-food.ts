import { storage } from "../server/storage";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function main() {
  console.log("[seed-food-pantry] Starting…");
  const allUsers = await db.select({ id: users.id }).from(users);
  console.log(`[seed-food-pantry] Found ${allUsers.length} users`);
  let seeded = 0;
  for (const user of allUsers) {
    await storage.seedDefaultFoodPantryItems(user.id);
    seeded++;
    if (seeded % 10 === 0) console.log(`[seed-food-pantry] Seeded ${seeded}/${allUsers.length}`);
  }
  console.log(`[seed-food-pantry] Done — seeded all ${allUsers.length} users`);
  process.exit(0);
}

main().catch(e => {
  console.error("[seed-food-pantry] Fatal error:", e);
  process.exit(1);
});
