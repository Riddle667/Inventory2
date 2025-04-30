const prisma = require('@prisma/client'); // Ajusta el path si es necesario

/**
 * Elimina alertas específicas según los criterios.
 * @param {Object} criteria - Los criterios para eliminar alertas.
 */
async function deleteAlerts(criteria) {
  try {
    await prisma.alert.deleteMany({
      where: criteria,
    });
    console.log('Alertas eliminadas con éxito.');
  } catch (error) {
    console.error('Error al eliminar alertas:', error.message);
  }
}

module.exports = { deleteAlerts };
