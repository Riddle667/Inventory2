const { Router } = require("express");
const { getStatistics, getStatisticsDashboard, getStatisticsProfile } = require("../Controller/statisticsController");
const { validateJWT } = require("../Middleware/validate-jwt");


const router = Router();

router.get(
    '/get-statistics',
    getStatistics
)

router.get(
    '/get-statistics-dashboard',
    getStatisticsDashboard
)

router.get(
    '/get-statistics-profile',
    validateJWT,
    getStatisticsProfile
)
module.exports = router;