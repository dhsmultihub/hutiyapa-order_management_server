/**
 * Load Testing Script for Order Management Service
 * 
 * Usage: node scripts/load-test.js
 * 
 * Requirements: npm install -g autocannon
 * Install: npm install autocannon
 */

const autocannon = require('autocannon');
const { promisify } = require('util');

const run = promisify(autocannon);

const BASE_URL = process.env.API_URL || 'http://localhost:8001';
const DURATION = parseInt(process.env.DURATION || '30'); // seconds
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '10');
const PIPELINING = parseInt(process.env.PIPELINING || '1');

async function runLoadTest(name, url, options = {}) {
    console.log(`\n🚀 Running load test: ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Duration: ${DURATION}s`);
    console.log(`   Connections: ${CONNECTIONS}`);
    console.log(`   Pipelining: ${PIPELINING}\n`);

    try {
        const result = await run({
            url,
            connections: CONNECTIONS,
            pipelining: PIPELINING,
            duration: DURATION,
            ...options,
        });

        console.log(`\n📊 Results for ${name}:`);
        console.log(`   Requests: ${result.requests.total}`);
        console.log(`   Throughput: ${result.throughput.total} bytes`);
        console.log(`   Latency:`);
        console.log(`     Average: ${result.latency.mean}ms`);
        console.log(`     P50: ${result.latency.p50}ms`);
        console.log(`     P95: ${result.latency.p95}ms`);
        console.log(`     P99: ${result.latency.p99}ms`);
        console.log(`   Errors: ${result.errors}`);
        console.log(`   Timeouts: ${result.timeouts}`);
        console.log(`   Non-2xx responses: ${result.non2xx}`);

        return result;
    } catch (error) {
        console.error(`❌ Error running load test for ${name}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('🔥 Order Management Service - Load Testing Suite');
    console.log('================================================\n');

    const tests = [
        {
            name: 'Health Check Endpoint',
            url: `${BASE_URL}/api/v1/health`,
        },
        {
            name: 'Readiness Probe',
            url: `${BASE_URL}/api/v1/health/ready`,
        },
        {
            name: 'Liveness Probe',
            url: `${BASE_URL}/api/v1/health/live`,
        },
        {
            name: 'Prometheus Metrics',
            url: `${BASE_URL}/api/v1/monitoring/metrics`,
        },
        {
            name: 'Get Orders (requires auth)',
            url: `${BASE_URL}/api/v1/orders`,
            options: {
                headers: {
                    'Authorization': 'Bearer test-token',
                },
            },
        },
    ];

    const results = [];

    for (const test of tests) {
        const result = await runLoadTest(test.name, test.url, test.options);
        if (result) {
            results.push({
                name: test.name,
                requestsPerSecond: result.requests.mean,
                latencyAvg: result.latency.mean,
                latencyP95: result.latency.p95,
                errors: result.errors,
            });
        }
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n\n📈 Summary of All Load Tests');
    console.log('============================\n');
    console.table(results);

    console.log('\n✅ Load testing completed!');
    console.log('\n💡 Tips:');
    console.log('   - Increase CONNECTIONS for higher load');
    console.log('   - Increase DURATION for longer tests');
    console.log('   - Monitor system resources during tests');
    console.log('   - Check metrics at /api/v1/monitoring/metrics\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runLoadTest };

