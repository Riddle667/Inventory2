const cron = require('node-cron'); // Importa node-cron
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// Programa una tarea para ejecutarse todos los días a las 2:00 AM
const deleteObsoleteAlerts = cron.schedule('0 2 * * *', async () => {
    logger.info("Iniciando tarea: Verificar alertas de bajo stock");

  try {
    // Eliminar alertas de bajo stock para productos con stock suficiente
    await prisma.alert.deleteMany({
      where: {
        type: 'low_stock',
        product: {
          stock: { gt: 10 }, // Elimina alertas si el stock es mayor al umbral (10 en este caso)
        },
      },
    });

    // Eliminar alertas de deuda para clientes sin deudas
    await prisma.alert.deleteMany({
      where: {
        type: 'debt_reminder',
        client: {
          debt: 0, // Elimina alertas si el cliente no tiene deuda
        },
      },
    });

    
    logger.info(`Alertas de bajo stock y deuda innecesarias eliminadas.`);

  } catch (error) {
    logger.error(`Error en tarea de limpieza de alertas: ${error.message}`);
  }
});


module.exports = deleteObsoleteAlerts; // Exporta la tarea de limpieza de alertas innecesarias