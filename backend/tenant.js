import { auth } from "./auth";
import clientPromise from "./mongodb";
export async function currentUserId() {
  var _a;
  const session = await auth();
  if (!(session === null || session === void 0 ? void 0 : session.user))
    return null;
  if (session.user.id) return session.user.id;
  if (!session.user.email) return null;
  const client = await clientPromise;
  const user = await client
    .db(process.env.MONGODB_DB)
    .collection("users")
    .findOne(
      { email: session.user.email.trim().toLowerCase() },
      { projection: { _id: 1 } },
    );
  return (_a =
    user === null || user === void 0 ? void 0 : user._id.toString()) !== null &&
    _a !== void 0
    ? _a
    : null;
}
