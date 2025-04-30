const cron = require("node-cron");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require("../logger");

const lowStockAlertTask = cron.schedule("0 0 * * *", async () => {
  logger.info("Iniciando tarea: Verificar alertas de bajo stock");

  try {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: 2 },
        is_active: true,
      },
    });

    for (const product of lowStockProducts) {
      const alertExists = await prisma.alert.findFirst({
        where: {
          type: "low_stock",
          product_id: product.id,
          user_id: product.user_id,
        },
      });

      if (!alertExists) {
        await prisma.alert.create({
          data: {
            message: `El producto "${product.name}" tiene un stock bajo (${product.stock}).`,
            type: "low_stock",
            user_id: product.user_id,
            product_id: product.id,
            priority: "LOW",
          },
        });
        logger.info(`Alerta creada para el producto: ${product.name}`);
      }
    }

    logger.info("Tarea completada: Verificar alertas de bajo stock");
  } catch (error) {
    logger.error(`Error en tarea de bajo stock: ${error.message}`);
  }
});

module.exports = lowStockAlertTask;
