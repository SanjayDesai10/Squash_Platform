// Promote (or demote) an existing user. This is the only way to create
// an admin: there is deliberately no HTTP endpoint for it.
//
//   npm run make-admin -- user@example.com
//   npm run make-admin -- user@example.com --revoke
//
// The user must register through the API first. Role changes take
// effect on the user's next request, because `authenticate` reads the
// role from the database rather than from the JWT.
import { db } from "../prisma/db.js";

async function main() {
    const args = process.argv.slice(2);
    const revoke = args.includes("--revoke");
    const email = args.find(arg => !arg.startsWith("--"));

    if (!email) {
        console.error("usage: npm run make-admin -- <email> [--revoke]");
        return 1;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const role = revoke ? "user" : "admin";

    const user = await db.orm.public.User
        .where({ email: normalizedEmail })
        .update({ role });

    if (!user) {
        console.error(`no user found with email ${normalizedEmail}`);
        return 1;
    }

    console.log(`${user.email} (id ${user.id}) now has role "${user.role}"`);
    return 0;
}

main()
    .then(code => process.exit(code))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
