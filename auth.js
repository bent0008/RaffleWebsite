import crypto from "crypto";

// Hardcoded salt + hashes
const SALT = "JaxLUG1586!";
const USERNAME_HASH = "246d00e0d3bf10da097f238f124bb3b3c8e3441d64c31abf48cdb0f9cd1760a3";
const PASSWORD_HASH = "5fcfce99c98c2605dcf83a28e1ed2807afa5f6682081244b3825e77628244b97";

function hashWithSalt(input) {
  return crypto
    .createHash("sha256")
    .update(input + SALT)
    .digest("hex");
}

export function validateLogin(username, password) {
  return (
    hashWithSalt(username) === USERNAME_HASH && hashWithSalt(password) === PASSWORD_HASH
  );
}
