import assert from 'node:assert/strict';
import {
  ONLINE_TIMEOUT_MS,
  getAppDateString,
  computeCaptainActivityStats,
  formatRelativeArabicTime,
  formatTimestampArabic,
  recordCaptainGenuineActivity,
  updateCaptainHeartbeat,
} from '../backend/activity-tracking.js';
import { getLocalDbClient } from '../backend/localdb.js';

console.log('--- 1. Testing Online Timeout (120s) ---');
assert.equal(ONLINE_TIMEOUT_MS, 120000, 'Online timeout must be 120,000 ms (120 seconds)');

const now = new Date();
const recentSeen = new Date(now.getTime() - 60 * 1000).toISOString(); // 60s ago
const staleSeen = new Date(now.getTime() - 130 * 1000).toISOString(); // 130s ago
const noSeen = null;

const statsRecent = computeCaptainActivityStats({ lastSeenAt: recentSeen, activeDays: [] }, {}, now);
assert.equal(statsRecent.isOnline, true, '60s ago should be online');
assert.equal(statsRecent.onlineStatus, 'online');
assert.equal(statsRecent.lastSeenFormatted, 'متصل الآن 🟢');

const statsStale = computeCaptainActivityStats({ lastSeenAt: staleSeen, activeDays: [] }, {}, now);
assert.equal(statsStale.isOnline, false, '130s ago should be offline');
assert.equal(statsStale.onlineStatus, 'offline');
assert.ok(statsStale.lastSeenFormatted.includes('دقيقتين'), 'Should display formatted relative time');

const statsNoSeen = computeCaptainActivityStats({ lastSeenAt: noSeen, activeDays: [] }, {}, now);
assert.equal(statsNoSeen.isOnline, false, 'null lastSeenAt should be offline');
assert.equal(statsNoSeen.lastSeenFormatted, 'لم ينشط بعد');
console.log('✓ Online timeout 120s logic verified.');

console.log('--- 2. Testing Date Strings & Cairo Timezone Windows ---');
const todayStr = getAppDateString(now);
assert.match(todayStr, /^\d{4}-\d{2}-\d{2}$/, 'App date should match YYYY-MM-DD');

function getRelativeDateStr(daysAgo) {
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return getAppDateString(d);
}

const daysAgo3 = getRelativeDateStr(3);
const daysAgo15 = getRelativeDateStr(15);
const daysAgo40 = getRelativeDateStr(40);
console.log(`Today: ${todayStr}, 3d ago: ${daysAgo3}, 15d ago: ${daysAgo15}, 40d ago: ${daysAgo40}`);

console.log('--- 3. Testing Classification Rules ---');
// Frequent: activeDays30 >= 10 || activeDays7 >= 4
const frequentA = computeCaptainActivityStats({
  activeDays: [
    getRelativeDateStr(1),
    getRelativeDateStr(2),
    getRelativeDateStr(3),
    getRelativeDateStr(4),
  ]
}, {}, now);
assert.equal(frequentA.activeDays7, 4);
assert.equal(frequentA.activityClassification, 'frequent');
assert.ok(frequentA.activityClassificationLabel.includes('متكرر'));

// Frequent via 30 days
const daysList10 = Array.from({ length: 10 }, (_, i) => getRelativeDateStr(i + 10));
const frequentB = computeCaptainActivityStats({ activeDays: daysList10 }, {}, now);
assert.equal(frequentB.activeDays30, 10);
assert.equal(frequentB.activeDays7, 0);
assert.equal(frequentB.activityClassification, 'frequent');

// Occasional: activeDays30 >= 4 || activeDays7 >= 2 (and not frequent)
const occasionalA = computeCaptainActivityStats({
  activeDays: [getRelativeDateStr(2), getRelativeDateStr(5)]
}, {}, now);
assert.equal(occasionalA.activeDays7, 2);
assert.equal(occasionalA.activityClassification, 'occasional');

// Low activity: activeDays30 >= 1 || activeDays7 >= 1
const lowActivityA = computeCaptainActivityStats({
  activeDays: [getRelativeDateStr(20)]
}, {}, now);
assert.equal(lowActivityA.activeDays30, 1);
assert.equal(lowActivityA.activeDays7, 0);
assert.equal(lowActivityA.activityClassification, 'low_activity');

// Insufficient Data: 0 active days
const insufficientA = computeCaptainActivityStats({ activeDays: [] }, {}, now);
assert.equal(insufficientA.activeDays7, 0);
assert.equal(insufficientA.activeDays30, 0);
assert.equal(insufficientA.activityClassification, 'insufficient_data');
console.log('✓ All 4 classification tiers verified: Frequent, Occasional, Low Activity, Insufficient Data.');

console.log('--- 4. Testing Historical Genuine Activity Integration ---');
// Should incorporate attendance, payments, and mutations
const historicalData = {
  attendanceDates: [getRelativeDateStr(2), getRelativeDateStr(12)],
  paymentDates: [getRelativeDateStr(5), getRelativeDateStr(22)],
  mutationDates: [getRelativeDateStr(6)]
};

const statsWithHistorical = computeCaptainActivityStats(
  { activeDays: [getRelativeDateStr(1)] },
  historicalData,
  now
);
assert.equal(statsWithHistorical.activeDays7, 4, '1 stored + 2 attendance + 5 payment + 6 mutation = 4 in last 7 days');
assert.equal(statsWithHistorical.activeDays30, 6, 'All 6 dates fall in 30 days window');
assert.equal(statsWithHistorical.activityClassification, 'frequent');
console.log('✓ Historical genuine activity correctly merged and calculated.');

console.log('--- 5. Testing Database $addToSet Support & Mutation Logic ---');
const client = getLocalDbClient();
const usersColl = client.db().collection('users');

const testUserId = 'test_captain_activity_unit_123';
await usersColl.insertOne({
  _id: testUserId,
  email: 'test_cap@example.com',
  name: 'Captain Test',
  role: 'captain',
  activeDays: [getRelativeDateStr(10)],
  lastActiveAt: new Date(Date.now() - 10000).toISOString(),
  lastSeenAt: new Date(Date.now() - 10000).toISOString(),
});

// Test Heartbeat does NOT add active day
await updateCaptainHeartbeat(testUserId);
const afterHeartbeat = await usersColl.findOne({ _id: testUserId });
assert.equal(afterHeartbeat.activeDays.length, 1, 'Heartbeat MUST NOT add active days');
assert.ok(new Date(afterHeartbeat.lastSeenAt).getTime() >= now.getTime() - 5000, 'Heartbeat should update lastSeenAt');

// Test Genuine Activity adds active day
await recordCaptainGenuineActivity(testUserId);
const afterGenuine = await usersColl.findOne({ _id: testUserId });
assert.ok(afterGenuine.activeDays.includes(todayStr), 'Genuine activity MUST add today to activeDays');
assert.equal(afterGenuine.activeDays.length, 2, 'Should now have 2 active days');

// Verify cleanup
await usersColl.deleteOne({ _id: testUserId });
console.log('✓ Heartbeat isolation, genuine activity $addToSet, and DB interactions verified.');

console.log('--- 6. Testing Relative Last Login Formatting & Candidate Fallback ---');
// Test exact relative format
const d1Day = new Date(now.getTime() - 25 * 3600 * 1000);
assert.equal(formatRelativeArabicTime(d1Day, now), 'منذ يوم', '25h ago should be "منذ يوم"');

const d2Days = new Date(now.getTime() - 50 * 3600 * 1000);
assert.equal(formatRelativeArabicTime(d2Days, now), 'منذ يومين', '50h ago should be "منذ يومين"');

const d5Days = new Date(now.getTime() - 5 * 24 * 3600 * 1000);
assert.equal(formatRelativeArabicTime(d5Days, now), 'منذ 5 أيام', '5d ago should be "منذ 5 أيام"');

const d18Days = new Date(now.getTime() - 18 * 24 * 3600 * 1000);
assert.equal(formatRelativeArabicTime(d18Days, now), 'منذ 18 يوماً', '18d ago should be "منذ 18 يوماً"');

// Test account with undefined lastLoginAt falling back to createdAt / updatedAt
const mockLegacyUser = {
  _id: 'legacy_captain_1',
  name: 'كابتن قديم',
  email: 'legacy@example.com',
  lastLoginAt: undefined,
  lastSeenAt: undefined,
  updatedAt: d2Days.toISOString(),
  createdAt: d18Days.toISOString(),
};

const legacyStats = computeCaptainActivityStats(mockLegacyUser, {}, now);
assert.equal(legacyStats.lastLoginFormatted, 'منذ يومين', 'Legacy account without lastLoginAt must fallback to updatedAt');
assert.ok(legacyStats.lastLoginExact.length > 5, 'Exact timestamp should be populated');

console.log('✓ Relative last login formatting and candidate timestamp fallback verified.');

console.log('\n========================================');
console.log('ALL ACTIVITY TRACKING TESTS PASSED (100%)');
console.log('========================================\n');
