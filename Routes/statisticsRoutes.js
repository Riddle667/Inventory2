const { Router } = require("express");
const { getStatistics, getStatisticsDashboard } = require("../Controller/statisticsController");


const router = Router();

router.get(
    '/get-statistics',
    getStatistics
)

router.get(
    '/get-statistics-dashboard',
    getStatisticsDashboard
)

module.exports = router;