const lowStockAlertTask = require("./lowStockAlert");
const debtReminderTask = require("./debtReminder");
const deleteObsoleteAlerts = require("./deleteObsoleteAlerts");

const startCronJobs = () => {
  lowStockAlertTask.start();
  debtReminderTask.start();
  deleteObsoleteAlerts.start();
  console.log("Tareas programadas iniciadas.");
};

module.exports = startCronJobs;
