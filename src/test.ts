import "dotenv/config";
import { decodeClientId, generateToken } from "./middleware/auth";

const [, , command, token] = process.argv;

if (command === "decode" && token) {
  console.log(decodeClientId(token));
} else if (command === "encode" && token) {
  console.log(generateToken(token));
} else {
  console.error("Usage: bun src/test.ts decode <token> OR bun src/test.ts encode <clientId>");
}