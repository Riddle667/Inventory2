const cron = require("node-cron");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require("../logger");

// Programar tarea diaria a las 6:00 AM
const debtReminderTask = cron.schedule("0 6 * * *", async () => {
  logger.info("Iniciando tarea: Recordatorio de deudas y vencimientos");

  try {
    const today = new Date();
const twoDaysLater = new Date(today);
twoDaysLater.setDate(today.getDate() + 2);

const clientsWithUpcomingDueDates = await prisma.client.findMany({
  where: {
    debt: {
      gt: 0,
    },
    isBlackList: false,
    orders: {
      some: {
        installments: {
          some: {
            due_date: {
              gte: today, // Desde hoy
              lte: twoDaysLater, // Hasta 2 días después
            },
            paid: false, // Solo cuotas no pagadas
          },
        },
      },
    },
  },
  select: {
    id: true,
    name: true,
    lastName: true,
    user_id: true,
    orders: {
      select: {
        installments: {
          where: {
            due_date: {
              gte: today,
              lte: twoDaysLater,
            },
            paid: false,
          },
          select: {
            due_date: true,
          },
          orderBy: {
            due_date: "asc",
          },
        },
      },
    },
  },
});
console.log(clientsWithUpcomingDueDates);


    for (const client of clientsWithUpcomingDueDates) {
      const alertExists = await prisma.alert.findFirst({
        where: {
          type: "upcoming_due_date",
          client_id: client.id,
          user_id: client.user_id,
        },
      });

      if (!alertExists) {
        await prisma.alert.create({
          data: {
            message: `El cliente ${client.name} ${client.lastName} tiene una cuota próxima a vencer el ${client.orders[0].installments[0].due_date.toISOString().split("T")[0]}.`,
            type: "upcoming_due_date",
            priority: "MEDIUM",
            user_id: client.user_id,
            client_id: client.id,
          },
        });
        logger.info(`Alerta de vencimiento próximo creada para el cliente: ${client.name} ${client.lastName}`);
      }
    }

    // Clientes con cuotas ya vencidas (nivel alto)
    const clientsWithOverdueInstallments = await prisma.client.findMany({
        where: {
          debt: {
            gt: 0,
          },
          isBlackList: false,
          orders: {
            some: {
              installments: {
                some: {
                  due_date: {
                    lt: today, // Cuotas vencidas antes de hoy
                  },
                  paid: false, // Cuotas no pagadas
                },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          lastName: true,
          user_id: true,
          orders: {
            select: {
              installments: {
                where: {
                  due_date: {
                    lt: today,
                  },
                  paid: false,
                },
                select: {
                  due_date: true,
                },
                orderBy: {
                  due_date: "desc",
                },
              },
            },
          },
        },
      });
      console.log(clientsWithOverdueInstallments);

    for (const client of clientsWithOverdueInstallments) {
      const alertExists = await prisma.alert.findFirst({
        where: {
          type: "overdue_installment",
          client_id: client.id,
          user_id: client.user_id,
        },
      });

      if (!alertExists) {
        await prisma.alert.create({
          data: {
            message: `El cliente ${client.name} ${client.lastName} tiene una cuota vencida desde el ${client.orders[0].installments[0].due_date.toISOString().split("T")[0]}.`,
            type: "overdue_installment",
            priority: "HIGH",
            user_id: client.user_id,
            client_id: client.id,
          },
        });
        logger.info(`Alerta de vencimiento atrasado creada para el cliente: ${client.name} ${client.lastName}`);
      }
    }

    logger.info("Tarea completada: Recordatorio de deudas y vencimientos");
  } catch (error) {
    logger.error(`Error en tarea de recordatorio de deudas: ${error.message}`);
  }
});

module.exports = debtReminderTask;
