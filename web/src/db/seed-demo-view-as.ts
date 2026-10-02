import { ensureDemoViewAsUsers } from "@/server/setup/demo-view-as-users";

async function main() {
  const password =
    process.env.QA_VIEW_AS_PASSWORD ??
    process.env.ADMIN_INITIAL_PASSWORD ??
    process.env.DEMO_USERS_PASSWORD;
  if (!password || password.length < 10) {
    throw new Error(
      "Define QA_VIEW_AS_PASSWORD o ADMIN_INITIAL_PASSWORD (mín. 10 caracteres).",
    );
  }
  const result = await ensureDemoViewAsUsers(password);
  console.log("Usuarios QA Ver como:");
  for (const u of result.users) {
    console.log(`  ${u.username} — ${u.roleLabel} (${u.scope})`);
  }
  if (result.created.length) {
    console.log("Creados:", result.created.join(", "));
  }
  if (result.updated.length) {
    console.log("Actualizados:", result.updated.join(", "));
  }
  console.log(
    "\nInicia sesión como Systronia (ADMIN) y usa «Ver como» en el header.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
