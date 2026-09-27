import clientPromise from "../backend/mongodb.js";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("==================================================");
  console.log("🧪 TESTING ADMIN ENHANCEMENTS:");
  console.log("   - Branch player counts in admin panel");
  console.log("   - Custom suspension reason displayed to coach");
  console.log("   - Full cascading permanent deletion of academy");
  console.log("==================================================");

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "coach_db");

  // Helper to extract session cookie from NextAuth signin
  async function login(email, password) {
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfCookies = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get("set-cookie") || ""];
    const cookieHeader = csrfCookies.map((c) => c.split(";")[0]).join("; ");
    const csrfToken = csrfData.csrfToken;

    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken,
        redirectTo: "/",
      }),
      redirect: "manual",
    });

    const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie") || ""];
    const sessionCookie = setCookies.find(
      (c) => c.includes("authjs.session-token") || c.includes("next-auth.session-token")
    );
    if (sessionCookie) {
      return sessionCookie.split(";")[0];
    }
    return setCookies.map((c) => c.split(";")[0]).join("; ");
  }

  // 1. Admin login
  console.log("\n[STEP 1] Logging in as Admin...");
  const adminCookie = await login("mg0447837@gmail.com", "AdminPassword2026!");
  if (!adminCookie) throw new Error("Admin login failed");
  console.log("✓ Admin logged in successfully");

  // 2. Create a test academy with branches and players
  const testEmail = `coach_test_${Date.now()}@example.com`;
  console.log(`\n[STEP 2] Registering test academy (${testEmail})...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "كابتن أحمد سامي",
      academyName: "أكاديمية النجوم للألعاب القتالية",
      email: testEmail,
      password: "Password123!",
      phone: "01011223344",
    }),
  });
  if (!regRes.ok) throw new Error("Failed to register test academy");
  console.log("✓ Academy registered successfully");

  // Log in as coach
  const coachCookie = await login(testEmail, "Password123!");
  if (!coachCookie) throw new Error("Coach login failed");

  // Add Branch 1
  console.log("\n[STEP 3] Adding 2 branches for this coach...");
  const b1Res = await fetch(`${BASE_URL}/api/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coachCookie },
    body: JSON.stringify({ name: "فرع المعادي", days: ["السبت", "الثلاثاء"] }),
  });
  const b1 = await b1Res.json();

  // Add Branch 2
  const b2Res = await fetch(`${BASE_URL}/api/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coachCookie },
    body: JSON.stringify({ name: "فرع التجمع", days: ["الأحد", "الأربعاء"] }),
  });
  const b2 = await b2Res.json();
  console.log(`✓ Branches added: ${b1.name}, ${b2.name}`);

  // Add 2 players to Branch 1, 1 player to Branch 2
  console.log("\n[STEP 4] Adding players to branches...");
  const p1Res = await fetch(`${BASE_URL}/api/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coachCookie },
    body: JSON.stringify({ name: "يوسف عمر", branch: "فرع المعادي", belt: "أصفر", dateOfBirth: "2015-01-01" }),
  });
  if (!p1Res.ok) throw new Error(`Failed to add player 1: ${await p1Res.text()}`);

  const p2Res = await fetch(`${BASE_URL}/api/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coachCookie },
    body: JSON.stringify({ name: "كريم شريف", branch: "فرع المعادي", belt: "أخضر", dateOfBirth: "2014-06-15" }),
  });
  if (!p2Res.ok) throw new Error(`Failed to add player 2: ${await p2Res.text()}`);

  const p3Res = await fetch(`${BASE_URL}/api/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: coachCookie },
    body: JSON.stringify({ name: "مازن طارق", branch: "فرع التجمع", belt: "أزرق", dateOfBirth: "2013-11-20" }),
  });
  if (!p3Res.ok) throw new Error(`Failed to add player 3: ${await p3Res.text()}`);
  console.log("✓ 3 players added across 2 branches");

  // 5. Test GET /api/admin/academies returns branches breakdown
  console.log("\n[STEP 5] Testing GET /api/admin/academies branch player count calculation...");
  const adminAcademiesRes = await fetch(`${BASE_URL}/api/admin/academies?search=${encodeURIComponent(testEmail)}`, {
    headers: { Cookie: adminCookie },
  });
  const adminAcademiesData = await adminAcademiesRes.json();
  const coachData = adminAcademiesData.academies.find((a) => a.email === testEmail);
  if (!coachData) throw new Error("Coach not found in admin academies");

  console.log(`Coach found: ${coachData.academyName}`);
  console.log(`Total Players: ${coachData.playersCount}`);
  console.log(`Total Branches: ${coachData.branchesCount}`);
  console.log("Branches Details:", coachData.branchesDetails);

  if (coachData.playersCount !== 3) throw new Error(`Expected 3 total players, got ${coachData.playersCount}`);
  if (coachData.branchesCount !== 2) throw new Error(`Expected 2 branches, got ${coachData.branchesCount}`);

  const maadiBranch = coachData.branchesDetails.find((b) => b.name === "فرع المعادي");
  const tagammoaBranch = coachData.branchesDetails.find((b) => b.name === "فرع التجمع");

  if (!maadiBranch || maadiBranch.playersCount !== 2) {
    throw new Error(`Expected 2 players in فرع المعادي, got ${maadiBranch?.playersCount}`);
  }
  if (!tagammoaBranch || tagammoaBranch.playersCount !== 1) {
    throw new Error(`Expected 1 player in فرع التجمع, got ${tagammoaBranch?.playersCount}`);
  }
  console.log("✓ PASS: Correct player count per branch returned in /api/admin/academies");

  // 6. Test GET /api/admin/academies/[id]
  console.log("\n[STEP 6] Testing GET /api/admin/academies/[id]...");
  const detailsRes = await fetch(`${BASE_URL}/api/admin/academies/${coachData.id}`, {
    headers: { Cookie: adminCookie },
  });
  const detailsData = await detailsRes.json();
  console.log(`Details API returned ${detailsData.branches.length} branches and ${detailsData.players.length} players`);
  const dMaadi = detailsData.branches.find((b) => b.name === "فرع المعادي");
  if (dMaadi.playersCount !== 2) throw new Error(`Expected 2 players in branch details, got ${dMaadi.playersCount}`);
  console.log("✓ PASS: Correct branch playersCount returned in detailed modal API");

  // 7. Test Suspending with custom reason
  console.log("\n[STEP 7] Suspending academy with custom reason...");
  const customReason = "تأخر في تجديد الاشتراك السنوي ولم يتم إرسال إيصال السداد";
  const suspendRes = await fetch(`${BASE_URL}/api/admin/academies/${coachData.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ action: "suspend", reason: customReason }),
  });
  if (!suspendRes.ok) throw new Error("Failed to suspend academy");

  // Check coach's view
  const coachBlockedRes = await fetch(`${BASE_URL}/api/players`, {
    headers: { Cookie: coachCookie },
  });
  const blockedJson = await coachBlockedRes.json();
  console.log(`Coach blocked response (status ${coachBlockedRes.status}):`, blockedJson);
  if (coachBlockedRes.status !== 403 || blockedJson.message !== customReason) {
    throw new Error(`Expected coach message to be "${customReason}", got "${blockedJson.message}"`);
  }
  console.log("✓ PASS: Custom suspension reason is delivered directly to the coach");

  // 8. Test Cascading Permanent Deletion
  console.log("\n[STEP 8] Testing Permanent Deletion of Academy from Database...");
  const deleteRes = await fetch(`${BASE_URL}/api/admin/academies/${coachData.id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  const deleteJson = await deleteRes.json();
  console.log("Delete response:", deleteJson);
  if (!deleteRes.ok || !deleteJson.success) throw new Error("Delete API failed");

  // Verify DB state
  const deletedUser = await db.collection("users").findOne({ email: testEmail });
  if (deletedUser) throw new Error("User was NOT deleted from DB!");

  const remainingPlayers = await db.collection("players").find({
    ownerId: coachData.id,
  }).toArray();
  if (remainingPlayers.length > 0) throw new Error(`Players were NOT deleted! Remaining: ${remainingPlayers.length}`);

  const remainingBranches = await db.collection("branches").find({
    ownerId: coachData.id,
  }).toArray();
  if (remainingBranches.length > 0) throw new Error(`Branches were NOT deleted! Remaining: ${remainingBranches.length}`);

  console.log("✓ PASS: Permanent cascading deletion verified in DB. User, players, and branches completely removed.");

  console.log("\n==================================================");
  console.log("🎉 ALL ADMIN EXTENSION TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
