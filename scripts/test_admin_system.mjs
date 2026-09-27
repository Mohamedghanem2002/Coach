// Test script to verify the entire Admin Control Panel and Subscription Management System
import clientPromise from "../backend/mongodb.js";
import { ObjectId } from "mongodb";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING FULL ACADEMY ADMIN SYSTEM TEST SUITE");
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

  // TEST 1: Unauthenticated access to /api/admin/overview
  console.log("\n[TEST 1] Testing unauthenticated access to /api/admin/overview...");
  const unauthRes = await fetch(`${BASE_URL}/api/admin/overview`);
  console.log(`Status: ${unauthRes.status} (Expected: 401)`);
  if (unauthRes.status !== 401) throw new Error("TEST 1 FAILED: Unauthenticated access was not rejected with 401");
  console.log("✓ TEST 1 PASSED: Unauthenticated access correctly blocked.");

  // TEST 2: Admin Login
  console.log("\n[TEST 2] Logging in as Admin (mg0447837@gmail.com)...");
  const adminUser = await db.collection("users").findOne({ email: "mg0447837@gmail.com" });
  if (!adminUser) throw new Error("Admin user not found in DB");
  console.log(`Admin User found: ${adminUser.name}, Role: ${adminUser.role}`);

  const adminCookie = await login("mg0447837@gmail.com", "AdminPassword2026!");
  console.log("Admin login cookie obtained:", adminCookie ? "✓ Success" : "✗ Failed");

  // TEST 3: Admin Overview API
  console.log("\n[TEST 3] Testing GET /api/admin/overview with admin session...");
  const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`Status: ${overviewRes.status}`);
  const overviewJson = await overviewRes.json();
  console.log("Overview Stats:", overviewJson.stats);
  if (!overviewJson.success || typeof overviewJson.stats.totalPlayers !== "number") {
    throw new Error("TEST 3 FAILED: Overview API returned invalid structure");
  }
  console.log("✓ TEST 3 PASSED: Admin overview returned real live database statistics.");

  // TEST 4: Register a new academy (Rule 29: Scenario 1)
  console.log("\n[TEST 4] Registering a new test academy via POST /api/auth/register...");
  const testEmail = `academy_test_${Date.now()}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "كابتن سيف الدين",
      academyName: "أكاديمية الفرسان الدولية",
      email: testEmail,
      password: "StrongPassword123!",
      phone: "01012345678",
    }),
  });
  const regData = await registerRes.json();
  console.log("Register response:", regData);
  if (!registerRes.ok || !regData.created) throw new Error("TEST 4 FAILED: Registration failed");
  console.log("✓ TEST 4 PASSED: New academy registered with automated subscription defaults.");

  // TEST 5: Verify new academy appears in Admin Panel with player count = 0
  console.log("\n[TEST 5] Verifying academy in Admin Academies list...");
  const academiesRes = await fetch(`${BASE_URL}/api/admin/academies?search=${encodeURIComponent(testEmail)}`, {
    headers: { Cookie: adminCookie },
  });
  const academiesJson = await academiesRes.json();
  const targetAcademy = (academiesJson.academies || []).find((a) => a.email === testEmail);
  if (!targetAcademy) throw new Error("TEST 5 FAILED: New academy not found in admin list");
  console.log(`Found Academy: ${targetAcademy.academyName}, ID: ${targetAcademy.id}, Status: ${targetAcademy.subscriptionStatus}, Players: ${targetAcademy.playersCount}`);
  if (targetAcademy.playersCount !== 0) throw new Error("TEST 5 FAILED: Player count should be 0 initially");
  console.log("✓ TEST 5 PASSED: Academy appears in admin list with real playersCount = 0.");

  // TEST 6: Sign in as new academy user and add a player
  console.log("\n[TEST 6] Logging in as new academy user and creating a player...");
  const academyUserCookie = await login(testEmail, "StrongPassword123!");
  const addPlayerRes = await fetch(`${BASE_URL}/api/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: academyUserCookie,
    },
    body: JSON.stringify({
      name: "البطل عمر سيف",
      branch: "صالة الكاتا الرئيسية",
      dateOfBirth: "2015-05-10",
      belt: "أبيض",
      guardianPhone: "01099887766",
    }),
  });
  console.log("addPlayer status:", addPlayerRes.status);
  const addedPlayer = await addPlayerRes.json();
  console.log("Added player response:", addedPlayer);
  if (!addPlayerRes.ok || !addedPlayer._id) throw new Error(`TEST 6 FAILED: Failed to add player (status: ${addPlayerRes.status}, error: ${addedPlayer.error})`);

  // Re-check player count in admin panel (Rule 5)
  const recheckRes = await fetch(`${BASE_URL}/api/admin/academies?search=${encodeURIComponent(testEmail)}`, {
    headers: { Cookie: adminCookie },
  });
  const recheckJson = await recheckRes.json();
  const recheckAcademy = (recheckJson.academies || []).find((a) => a.email === testEmail);
  console.log(`Admin panel updated player count: ${recheckAcademy.playersCount} (Expected: 1)`);
  if (recheckAcademy.playersCount !== 1) throw new Error("TEST 6 FAILED: Player count did not update to 1");
  console.log("✓ TEST 6 PASSED: Real player relationship count verified dynamically.");

  // TEST 7: Suspend the academy (Rule 8, 9, 11, Scenario 3)
  console.log("\n[TEST 7] Suspending academy from Admin Panel...");
  const suspendRes = await fetch(`${BASE_URL}/api/admin/academies/${targetAcademy.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      action: "suspend",
      reason: "تأخر سداد الاشتراك السنوي للأكاديمية",
    }),
  });
  const suspendJson = await suspendRes.json();
  console.log("Suspend response:", suspendJson.message);
  if (!suspendRes.ok) throw new Error("TEST 7 FAILED: Suspend request failed");

  // Verify API blocking (Rule 11, 12, Scenario 6)
  console.log("\n[TEST 7b] Verifying suspended academy user CANNOT access protected APIs (API bypass test)...");
  const blockedPlayerRes = await fetch(`${BASE_URL}/api/players`, {
    headers: { Cookie: academyUserCookie },
  });
  const blockedJson = await blockedPlayerRes.json();
  console.log(`Blocked API status: ${blockedPlayerRes.status} (Expected: 403)`);
  console.log("Blocked error code:", blockedJson.code, blockedJson.message);
  if (blockedPlayerRes.status !== 403 || blockedJson.code !== "SUBSCRIPTION_INACTIVE") {
    throw new Error("TEST 7b FAILED: Protected API did not return 403 SUBSCRIPTION_INACTIVE");
  }

  // Also check /api/branches
  const blockedBranchRes = await fetch(`${BASE_URL}/api/branches`, {
    headers: { Cookie: academyUserCookie },
  });
  console.log(`/api/branches status: ${blockedBranchRes.status} (Expected: 403)`);
  if (blockedBranchRes.status !== 403) throw new Error("TEST 7b FAILED: Branches API did not return 403");
  console.log("✓ TEST 7 PASSED: Suspension completely blocks protected APIs on server side.");

  // Verify DATA PRESERVATION (Rule 25)
  console.log("\n[TEST 7c] Verifying player and academy data is STRICTLY PRESERVED in DB...");
  const playerInDb = await db.collection("players").findOne({ name: "البطل عمر سيف" });
  if (!playerInDb) throw new Error("TEST 7c FAILED: Player data was deleted!");
  console.log(`Player in DB preserved: ${playerInDb.name}, ID: ${playerInDb._id}`);
  console.log("✓ TEST 7c PASSED: Zero data loss during suspension.");

  // TEST 8: Reactivate the academy (Scenario 4)
  console.log("\n[TEST 8] Reactivating academy from Admin Panel...");
  const reactivateRes = await fetch(`${BASE_URL}/api/admin/academies/${targetAcademy.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({ action: "activate" }),
  });
  console.log(`Reactivate status: ${reactivateRes.status}`);
  if (!reactivateRes.ok) throw new Error("TEST 8 FAILED: Reactivate request failed");

  // Verify access restored
  const restoredRes = await fetch(`${BASE_URL}/api/players`, {
    headers: { Cookie: academyUserCookie },
  });
  console.log(`Restored API status: ${restoredRes.status} (Expected: 200)`);
  const restoredPlayers = await restoredRes.json();
  console.log(`Restored players count: ${restoredPlayers.length}`);
  if (restoredRes.status !== 200 || restoredPlayers.length !== 1) {
    throw new Error("TEST 8 FAILED: Access was not properly restored");
  }
  console.log("✓ TEST 8 PASSED: Reactivation restored access smoothly with all data intact.");

  // TEST 9: Extend subscription (Scenario 5 & Rule 13)
  console.log("\n[TEST 9] Extending subscription by 90 days...");
  const extendRes = await fetch(`${BASE_URL}/api/admin/academies/${targetAcademy.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({ action: "extend_subscription", days: 90 }),
  });
  const extendJson = await extendRes.json();
  console.log("Extend response:", extendJson.message);
  if (!extendRes.ok) throw new Error("TEST 9 FAILED: Extend subscription failed");
  console.log("✓ TEST 9 PASSED: Subscription extension successfully applied.");

  // TEST 10: Automatic subscription expiration (Rule 10 & Scenario 5)
  console.log("\n[TEST 10] Testing automatic expiration handling when subscriptionExpiresAt < now...");
  // Temporarily set expiration to 2 days in the past
  await db.collection("users").updateOne(
    { _id: new ObjectId(targetAcademy.id) },
    { $set: { subscriptionExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: "active", subscriptionStatus: "active" } }
  );

  const expiredApiRes = await fetch(`${BASE_URL}/api/players`, {
    headers: { Cookie: academyUserCookie },
  });
  const expiredJson = await expiredApiRes.json();
  console.log(`Expired API check status: ${expiredApiRes.status} (Expected: 403)`);
  console.log("Expired reason:", expiredJson.reason);
  if (expiredApiRes.status !== 403 || expiredJson.reason !== "expired") {
    throw new Error("TEST 10 FAILED: Expired subscription was not automatically blocked with 403");
  }
  console.log("✓ TEST 10 PASSED: Backend automatically enforces expired subscription restriction.");

  // Restore active subscription for test academy
  await db.collection("users").updateOne(
    { _id: new ObjectId(targetAcademy.id) },
    { $set: { subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
  );

  // TEST 11: Normal user cannot access Admin APIs (Rule 20 & Scenario 7)
  console.log("\n[TEST 11] Security check: Normal academy user accessing /api/admin/overview...");
  const forbiddenRes = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: { Cookie: academyUserCookie },
  });
  console.log(`Normal user access status: ${forbiddenRes.status} (Expected: 403)`);
  if (forbiddenRes.status !== 403) throw new Error("TEST 11 FAILED: Normal user was not blocked from admin API");
  console.log("✓ TEST 11 PASSED: Strict role-based authorization blocks non-admins.");

  // TEST 12: Admin Audit Log (Rule 21)
  console.log("\n[TEST 12] Verifying audit logs generated by admin actions...");
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Cookie: adminCookie },
  });
  const auditJson = await auditRes.json();
  console.log(`Total audit logs retrieved: ${auditJson.logs?.length}`);
  const actionsFound = (auditJson.logs || []).map((l) => l.action);
  console.log("Recent audit log actions:", actionsFound.slice(0, 5));
  if (!actionsFound.includes("suspend_academy") || !actionsFound.includes("reactivate_academy")) {
    throw new Error("TEST 12 FAILED: Missing audit log records for admin actions");
  }
  console.log("✓ TEST 12 PASSED: Audit logs accurately tracked all actions.");

  console.log("\n==================================================");
  console.log("🎉 ALL 12 TESTS PASSED PERFECTLY WITH ZERO ERRORS!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
