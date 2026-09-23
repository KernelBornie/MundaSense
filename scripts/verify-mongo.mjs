import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'mundasense';

if (!uri) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await client.connect();
  console.log('✅ Connected successfully');

  const db = client.db(dbName);
  console.log(`📦 Database: ${dbName}`);

  // List all collections
  const collections = await db.listCollections().toArray();
  console.log(`\n📋 Found ${collections.length} collections:\n`);

  const expected = [
    'users', 'farms', 'listings', 'orders', 'advisories',
    'sms_log', 'sensor_hubs', 'sensor_readings', 'storage_units',
    'transport_requests', 'transport_bids', 'crop_health_reports',
    'ussd_sessions', 'depots'
  ];

  const actual = collections.map(c => c.name).sort();
  const missing = expected.filter(e => !actual.includes(e));
  const extra = actual.filter(a => !expected.includes(a));

  for (const name of actual) {
    const count = await db.collection(name).countDocuments();
    const status = expected.includes(name) ? '✅' : '⚠️ ';
    console.log(`  ${status} ${name.padEnd(28)} ${String(count).padStart(6)} docs`);
  }

  if (missing.length > 0) {
    console.log(`\n❌ MISSING collections: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.log(`\n⚠️  EXTRA collections: ${extra.join(', ')}`);
  }

  // Detailed verification per collection
  console.log('\n════════════════════════════════════════');
  console.log('DETAILED VERIFICATION');
  console.log('════════════════════════════════════════\n');

  // Users
  const userCount = await db.collection('users').countDocuments();
  const userRoles = await db.collection('users').aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();
  console.log(`👥 Users: ${userCount}`);
  for (const r of userRoles) console.log(`   - ${r._id}: ${r.count}`);

  // Farms
  const farmCount = await db.collection('farms').countDocuments();
  const provinceCount = (await db.collection('farms').distinct('province')).length;
  const districtCount = (await db.collection('farms').distinct('district')).length;
  const provinces = await db.collection('farms').aggregate([
    { $group: { _id: '$province', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  console.log(`\n🌾 Farms: ${farmCount}`);
  console.log(`   Provinces: ${provinceCount}`);
  console.log(`   Districts: ${districtCount}`);
  console.log('   By province:');
  for (const p of provinces) console.log(`     ${p._id}: ${p.count}`);

  // Listings
  const listingCount = await db.collection('listings').countDocuments();
  const listingWithContact = await db.collection('listings').countDocuments({
    seller_phone: { $exists: true, $ne: null }
  });
  console.log(`\n🛒 Listings: ${listingCount}`);
  console.log(`   With seller_phone: ${listingWithContact}`);

  // Sensor hubs
  const hubCount = await db.collection('sensor_hubs').countDocuments();
  console.log(`\n📡 Sensor Hubs: ${hubCount}`);

  // Storage units
  const siloCount = await db.collection('storage_units').countDocuments();
  console.log(`\n🏭 Storage Silos: ${siloCount}`);

  // Depots
  const depotCount = await db.collection('depots').countDocuments();
  const depotTypes = await db.collection('depots').aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  const lukuluCount = await db.collection('depots').countDocuments({ district: 'Lukulu' });
  console.log(`\n🏪 Depots: ${depotCount}`);
  console.log('   By type:');
  for (const t of depotTypes) console.log(`     ${t._id}: ${t.count}`);
  console.log(`   Lukulu district: ${lukuluCount}`);

  // Indexes
  console.log('\n📇 INDEXES');
  for (const name of ['users', 'farms', 'listings', 'sms_log', 'crop_health_reports']) {
    const indexes = await db.collection(name).indexes();
    console.log(`   ${name}: ${indexes.map(i => i.name).join(', ')}`);
  }

  console.log('\n════════════════════════════════════════');
  console.log('VERIFICATION COMPLETE');
  console.log('════════════════════════════════════════');

} catch (e) {
  console.error('❌ Connection error:', e.message);
  process.exit(1);
} finally {
  await client.close();
}
