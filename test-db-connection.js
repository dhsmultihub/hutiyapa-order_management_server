const { Client } = require('pg');
const fs = require('fs');

// Database connection string
const connectionString = 'postgresql://neondb_owner:npg_UkBtG9i4SwcN@ep-lingering-grass-a1z1dhav-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testDatabaseConnection() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    console.log('🔌 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test basic query
    console.log('\n📊 Testing basic query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Database version:', result.rows[0].version);

    // Check existing tables
    console.log('\n📋 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Existing tables:');
      tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    } else {
      console.log('📋 No tables found in public schema');
    }

    // Check if our schema already exists
    const orderTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      )
    `);

    if (orderTableExists.rows[0].exists) {
      console.log('\n⚠️  Order management schema already exists!');
      console.log('📊 Current order count:', (await client.query('SELECT COUNT(*) FROM orders')).rows[0].count);
    } else {
      console.log('\n🚀 Order management schema not found. Ready to create!');
    }

    // Test JSON functionality
    console.log('\n🧪 Testing JSON functionality...');
    const jsonTest = await client.query(`
      SELECT '{"test": "value"}'::jsonb as test_json
    `);
    console.log('✅ JSON support confirmed:', jsonTest.rows[0].test_json);

    console.log('\n🎉 Database connection test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run the database_setup.sql file in your PostgreSQL editor');
    console.log('2. Or use: npm run db:push (if Prisma is set up)');
    console.log('3. Or run: npm run db:migrate');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your internet connection');
    console.error('2. Verify the connection string');
    console.error('3. Check if the database is accessible');
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
