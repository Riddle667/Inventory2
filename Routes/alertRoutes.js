const { Router } = require("express");
const { getAlerts } = require("../Controller/alertController");
const { validateJWT } = require("../Middleware/validate-jwt");



const router = Router();

router.get('/',
    validateJWT,
    getAlerts
);


module.exports = router;