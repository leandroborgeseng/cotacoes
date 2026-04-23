import { ensureDemoInvite, resetAndSeedFull } from "../src/lib/ensure-demo-invite";
import { prisma } from "../src/lib/prisma";

async function main() {
  if (process.env.SEED_RESET === "true") {
    await resetAndSeedFull();
    console.log("Seed RESET completo.");
  } else {
    await ensureDemoInvite();
    console.log("Seed OK (idempotente).");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
