const { request, response } = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getStatistics = async (req = request, res = response) => {
    try {
        const [clientsCloseInstallment, clientsOverdueInstallment, generalStats, activeOrders, completedOrders, lowStockProducts, latestOrders, popularCategories] = await Promise.all([
            prisma.client.findMany({
                where: {
                  debt: {
                    gt: 0
                  },
                  orders: {
                    some: {
                      installments: {
                        some: {
                          due_date: {
                            gt: new Date("2024-12-12T16:23:27.748Z")
                          }
                        }
                      }
                    }
                  }
                },
                select: {
                  id: true,
                  name: true,
                  orders: {
                    select: {
                      installments: {
                        where: {
                          due_date: {
                            gt: new Date("2024-12-12T16:23:27.748Z")
                          }
                        },
                        select: {
                          due_date: true
                        },
                        orderBy: {
                          due_date: "asc"  // Ordenar las cuotas por fecha de vencimiento de manera ascendente
                        }
                      }
                    }
                  }
                },
                take: 5
              }),    
            prisma.client.findMany({
                where: {
                  debt: {
                    gt: 0
                  },
                  orders: {
                    some: {
                      installments: {
                        some: {
                          due_date: {
                            lt: new Date("2024-12-12T16:20:54.227Z")
                          }
                        }
                      }
                    }
                  }
                },
                select: {
                  id: true,
                  name: true,
                  orders: {
                    select: {
                      installments: {
                        where: {
                          due_date: {
                            lt: new Date("2024-12-12T16:20:54.227Z")
                          }
                        },
                        select: {
                          due_date: true
                        },
                        orderBy: {
                          due_date: "desc"  // Ordenar las cuotas por fecha de vencimiento (descendente)
                        }
                      }
                    }
                  }
                },
                take: 5
            }),
              
            prisma.client.aggregate({
                _count: { _all: true },
                _sum: { debt: true },
                where: { debt: { gt: 0 } },
            }),
            prisma.order.count({ where: { paid: false } }),
            prisma.order.count({ where: { paid: true } }),
            prisma.product.findMany({ where: { stock: { lt: 5 } } }),
            prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
            prisma.category.findMany({
                include: { _count: { select: { products: true } } },
                orderBy: { products: { _count: "desc" } },
                take: 5,
            }),
        ]);
        console.log(clientsCloseInstallment, clientsOverdueInstallment, generalStats, activeOrders, completedOrders, lowStockProducts, latestOrders, popularCategories);
        res.status(200).json({
            
            success: true,
            data: {
                general: {
                    totalClientsWithDebt: generalStats._count._all,
                    totalDebt: generalStats._sum.debt || 0,
                },
                clients: {
                    clientsCloseInstallment,
                    clientsOverdueInstallment,
                },
                orders: { activeOrders, completedOrders, latestOrders },
                products: { lowStockProducts },
                popularCategories,
            },
        });
    } catch (error) {
        console.error("Error fetching statistics:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch statistics",
        });
    }
};

const getStatisticsDashboard = async (req = request, res = response) => {
    const { startDate, endDate, threshold = 2 } = req.body;
  
    try {
      // Ingresos Totales
      const totalIncome = await prisma.order.aggregate({
        _sum: { total_price: true },
        where: {
          createdAt: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
      });
  
      // Total de Ventas por Mes
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      const salesData = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(`${lastYear}-01-01`),
            lte: new Date(`${currentYear}-12-31`),
          },
        },
        select: {
          createdAt: true,
          total_price: true,
        },
      });
    
      // Transformamos los datos en un formato agrupado
      const groupedSales = {
        thisYear: {},
        lastYear: {},
      };
    
      salesData.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const monthName = orderDate.toLocaleString("en", { month: "long" });
        const year = orderDate.getFullYear();
    
        if (year === currentYear) {
          groupedSales.thisYear[monthName] =
            (groupedSales.thisYear[monthName] || 0) + order.total_price;
        } else if (year === lastYear) {
          groupedSales.lastYear[monthName] =
            (groupedSales.lastYear[monthName] || 0) + order.total_price;
        }
      });
      
  
      // Clientes con Deudas
      const clientsWithDebt = await prisma.client.findMany({
        where: { debt: { gt: 0 } },
        orderBy: { debt: 'desc' },
        select: {
          id: true,
          name: true,
          lastName: true,
          debt: true,
        },
      });
  
      // Suma total de cuotas pendientes
      const installmentTotal = await prisma.installment.aggregate({
        _sum: { amount: true },
        where: {
          paid: false,
        },
      });
  
      // Productos con Bajo Stock
      const lowStockProducts = await prisma.product.findMany({
        where: { stock: { lt: parseInt(threshold) } },
        select: {
          id: true,
          name: true,
          stock: true,
        },
      });
  
      // Valor Total del Inventario
      const products = await prisma.product.findMany({
        select: {
          price: true,
          stock: true,
        },
      });
      const inventoryValue = products.reduce((total, product) => {
        return total + (product.price * product.stock);
      }, 0);
  
      // Productos Más Vendidos
      const topSellingProducts = await prisma.orderProduct.groupBy({
        by: ['product_id'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      });
  
      // Ventas por Categoría
      const salesByCategory = await prisma.category.findMany({
        include: {
          products: {
            select: {
              id: true,
              name: true,
              orders: {
                select: {
                  total_price: true,
                },
              },
            },
          },
        },
      });
  
      // Consolidar los resultados y convertir BigInt a String o Number
      const sanitizedData = {
        totalIncome: totalIncome._sum.total_price ? Number(totalIncome._sum.total_price) : 0,
        salesByMonth: groupedSales,
        clientsWithDebt: clientsWithDebt.map(client => ({
            ...client,
            debt: Number(client.debt), // Convertir BigInt a Number
        })),
        installmentTotal: installmentTotal._sum.amount ? Number(installmentTotal._sum.amount) : 0,
        lowStockProducts,
        inventoryValue,
        topSellingProducts: topSellingProducts.map(product => ({
            ...product,
            _sum: {
                quantity: Number(product._sum.quantity), // Convertir BigInt a Number
            },
        })),
        salesByCategory,
    };

    res.json({
        success: true,
        data: sanitizedData,
    });
} catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
}
};
  

const getClientStatistics = async (req = request, res = response) => {
    const { clientId } = req.params;

    try {
        const [orders, installments, totalDebt] = await Promise.all([
            prisma.order.count({
                where: { clientId },
            }),
            prisma.installment.aggregate({
                _count: { _all: true },
                _sum: { amount: true },
                where: { clientId },
            }),
            prisma.client.findUnique({
                where: { id: clientId },
                select: { debt: true },
            }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                orders,
                totalInstallments: installments._count._all,
                totalInstallmentsAmount: installments._sum.amount || 0,
                totalDebt: totalDebt?.debt || 0,
            },
        });
    } catch (error) {
        console.error("Error fetching client statistics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getInventoryStatistics = async (req = request, res = response) => {
    try {
        const [topSellingProducts, lowStockCategories] = await Promise.all([
            prisma.product.findMany({
                include: {
                    _count: { select: { orders: true } },
                },
                orderBy: {
                    orders: { _count: "desc" },
                },
                take: 5,
            }),
            prisma.category.findMany({
                include: {
                    _sum: { select: { stock: true } },
                },
                orderBy: {
                    stock: { _sum: "asc" },
                },
                take: 5,
            }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                topSellingProducts,
                lowStockCategories,
            },
        });
    } catch (error) {
        console.error("Error fetching inventory statistics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWeeklyStatistics = async (req = request, res = response) => {
    try {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Lunes de la semana actual

        const endOfWeek = new Date();
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo de la semana actual

        const [weeklyOrders, weeklyRevenue] = await Promise.all([
            prisma.order.count({
                where: {
                    createdAt: { gte: startOfWeek, lte: endOfWeek },
                },
            }),
            prisma.order.aggregate({
                _sum: { total: true },
                where: {
                    createdAt: { gte: startOfWeek, lte: endOfWeek },
                },
            }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                weeklyOrders,
                weeklyRevenue: weeklyRevenue._sum.total || 0,
            },
        });
    } catch (error) {
        console.error("Error fetching weekly statistics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const getPopularCategories = async (req = request, res = response) => {
    try {
        const popularCategories = await prisma.category.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { products: { _count: "desc" } },
            take: 5,
        });

        res.status(200).json({ success: true, data: popularCategories });
    } catch (error) {
        console.error("Error fetching popular categories:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getStatisticsDashboard,
    getStatistics,
    getClientStatistics,
    getInventoryStatistics,
    getWeeklyStatistics,
};
