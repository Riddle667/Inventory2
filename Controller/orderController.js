const { PrismaClient } = require('@prisma/client');
const { request, response } = require('express');
const prisma = new PrismaClient();

// Crear una nueva orden con productos asociados
const createOrder = async (req = request, res = response) => {
  try {
    const {
      client_id,
      pay_method,
      is_installment,
      total_price,
      products, // Array de objetos con { product_id, quantity, total_price }
      installments, // Array de cuotas con { installment_number, amount, due_date }
    } = req.body;

    // Verificar estructura del cuerpo de la solicitud
    if (!client_id || !pay_method || !total_price || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Please provide all required fields.',
      });
    }

    // Verificar que el cliente existe
    const clientExists = await prisma.client.findUnique({
      where: { id: client_id },
    });
    if (!clientExists) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Verificar productos y stock
    for (const product of products) {
      const productData = await prisma.product.findUnique({
        where: { id: product.product_id },
      });

      if (!productData) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${product.product_id} not found`,
        });
      }
      if (productData.stock < product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${product.product_id} does not have enough stock`,
        });
      }
    }

    // Crear orden, actualizar deuda y reducir stock dentro de una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la orden
      const newOrder = await tx.order.create({
        data: {
          client_id,
          pay_method,
          is_installment,
          total_price,
          products: {
            create: products.map((product) => ({
              product_id: product.product_id,
              quantity: product.quantity,
              total_price: product.total_price,
            })),
          },
          installments: is_installment
            ? {
                create: installments.map((installment) => ({
                  installment_number: installment.installment_number,
                  amount: installment.amount,
                  due_date: new Date(installment.due_date),
                })),
              }
            : undefined,
        },
      });

      // Actualizar deuda del cliente
      await tx.client.update({
        where: { id: client_id },
        data: {
          debt: {
            increment: total_price,
          },
        },
      });

      // Reducir stock de los productos
      for (const product of products) {
        await tx.product.update({
          where: { id: product.product_id },
          data: { stock: { decrement: product.quantity } },
        });
      }

      return newOrder;
    });

    // Enviar respuesta
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};



// Editar una orden existente
const editOrder = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const {
      payment_method,
      is_installment,
      total_price,
      products,
      installments
    } = req.body;

    // Actualizar orden
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        payment_method,
        is_installment,
        total_price
      }
    });

    // Actualizar productos asociados
    if (products && products.length > 0) {
      await prisma.orderProduct.deleteMany({ where: { orderId: parseInt(id) } });
      await prisma.orderProduct.createMany({
        data: products.map((product) => ({
          orderId: parseInt(id),
          productId: product.productId,
          quantity: product.quantity,
          price_total: product.quantity * product.price
        }))
      });
    }

    // Actualizar cuotas asociadas (si aplica)
    if (is_installment && installments && installments.length > 0) {
      await prisma.installment.deleteMany({ where: { orderId: parseInt(id) } });
      await prisma.installment.createMany({
        data: installments.map((installment) => ({
          orderId: parseInt(id),
          installment_number: installment.installment_number,
          amount: installment.amount,
          due_date: new Date(installment.due_date)
        }))
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// Eliminar una orden y sus asociaciones
const deleteOrder = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    // Eliminar asociaciones primero
    await prisma.orderProduct.deleteMany({ where: { orderId: parseInt(id) } });
    await prisma.installment.deleteMany({ where: { orderId: parseInt(id) } });

    // Eliminar la orden
    await prisma.order.delete({ where: { id: parseInt(id) } });

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

// Obtener todas las órdenes con detalles
const getOrders = async (req = request, res = response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        client: true,
        products: {
          include: {
            product: true
          }
        },
        installments: true
      }
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Obtener una orden específica con detalles
const getOrder = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        products: {
          include: {
            product: true
          }
        },
        installments: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

const payOrder = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    // Marcar la orden como pagada
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { paid: true }
    });

    const client = await prisma.client.findUnique({
      where: { id: updatedOrder.client_id },
    });

    const newPay = client.pay + updatedOrder.total_price;

    if (client.debt <= newPay) {
      // Si la deuda ya se cubre, poner todo en 0 y dejar el excedente como pago
      await prisma.client.update({
        where: { id: client.id },
        data: {
          debt: 0,
          pay: newPay - client.debt
        }
      });
    } else {
      // Si aún queda deuda, solo incrementar el monto pagado
      await prisma.client.update({
        where: { id: client.id },
        data: {
          pay: { increment: updatedOrder.total_price }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order paid successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to pay order',
      error: error.message
    });
  }
};

const payInstallmentOrder = async (req = request, res = response) => {
  try {
    const { id, idInstallment } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { installments: true },
    });

    const targetInstallment = order.installments.find(
      inst => inst.id === parseInt(idInstallment)
    );

    if (!targetInstallment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }
    console.log(targetInstallment);
    if (targetInstallment.installment_number != 1){
      // Verificar si todas las cuotas anteriores están pagadas
      const previousUnpaid = order.installments
        .filter(inst => inst.installment_number < targetInstallment.installment_number)
        .some(inst => !inst.paid);

      if (previousUnpaid) {
        return res.status(400).json({
          success: false,
          message: 'You must pay previous installments first'
        });
      }
    }

    

    // Marcar la cuota como pagada
    const updatedInstallment = await prisma.installment.update({
      where: { id: targetInstallment.id },
      data: { paid: true }
    });

    // Actualizar el `pay` del cliente
    await prisma.client.update({
      where: { id: order.client_id },
      data: {
        pay: {
          increment: targetInstallment.amount
        }
      }
    });

    // Verificar si ya todas las cuotas están pagadas
    const allPaid = order.installments.every(inst =>
      inst.id === targetInstallment.id ? true : inst.paid
    );

    if (allPaid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paid: true }
      });
    }

    // Lógica de deuda
    const client = await prisma.client.findUnique({
      where: { id: order.client_id },
    });

    if (client.pay >= client.debt) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          debt: 0,
          pay: client.pay - client.debt
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Installment paid successfully',
      data: updatedInstallment
    });

  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to pay installment',
      error: error.message
    });
  }
};


module.exports = {
  createOrder,
  editOrder,
  deleteOrder,
  getOrders,
  getOrder,
  payOrder,
  payInstallmentOrder
};
