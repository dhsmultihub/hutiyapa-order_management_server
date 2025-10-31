import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUniqueUserIds() {
    try {
        console.log('🔍 Fetching unique userIds from orders...\n');

        // Get distinct userIds from orders table
        const orders = await prisma.order.findMany({
            select: {
                userId: true,
            },
            distinct: ['userId'],
            orderBy: {
                userId: 'asc',
            },
        });

        const userIds = orders.map((order) => order.userId.toString());
        const uniqueUserIds = [...new Set(userIds)];

        console.log('📊 Unique User IDs in Orders:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (uniqueUserIds.length === 0) {
            console.log('❌ No orders found in database');
        } else {
            console.log(`✅ Total unique users: ${uniqueUserIds.length}\n`);
            console.log('User IDs:');
            uniqueUserIds.forEach((userId, index) => {
                console.log(`  ${index + 1}. ${userId}`);
            });

            // Also get count of orders per user
            console.log('\n📈 Orders count per user:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            const orderCounts = await Promise.all(
                uniqueUserIds.map(async (userId) => {
                    const count = await prisma.order.count({
                        where: {
                            userId: BigInt(userId),
                        },
                    });
                    return { userId, count };
                })
            );

            orderCounts.forEach(({ userId, count }) => {
                console.log(`  User ID ${userId}: ${count} order(s)`);
            });
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 Testing Tips:');
        console.log('  - Use any of these userIds in Testing Panel');
        console.log('  - Try different userIds to verify filtering');
        console.log('  - Example: userId "1" will show all orders for user 1\n');
    } catch (error) {
        console.error('❌ Error fetching userIds:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

getUniqueUserIds();

