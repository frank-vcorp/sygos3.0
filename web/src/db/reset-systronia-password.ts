import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { users } from "./schema";
import { hashPassword } from "@/server/auth/password";

async function main() {
  const plain = process.env.NEW_ADMIN_PASSWORD;
  if (!plain || plain.length < 10) {
    throw new Error("Define NEW_ADMIN_PASSWORD (mín. 10 caracteres).");
  }

  const db = getDb();
  const passwordHash = await hashPassword(plain);

  const [updated] = await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(users.username, "Systronia"))
    .returning({ id: users.id, username: users.username });

  if (!updated) {
    throw new Error("No existe el usuario Systronia. Ejecuta db:seed primero.");
  }

  console.log("Contraseña de Systronia actualizada (must_change_password=true).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
