import { prisma } from "./prisma";

// Reused demo user ID for Weeks 1–2
export const DEMO_USER_ID = "demo-user-id";

export async function ensureDemoUser() {
  const email = "demo@aitaskplanner.local";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      email,
      name: "Demo User",
    },
  });
}
