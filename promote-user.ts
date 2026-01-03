import { promoteToSystemAdmin } from "./serverside/services/permission/requestService";

const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address.");
  process.exit(1);
}

promoteToSystemAdmin(email)
  .then(() => {
    console.log(`Successfully promoted ${email} to System Admin.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
