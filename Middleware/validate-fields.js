const { response, request } = require("express");
const { validationResult } = require("express-validator")


const validateFields = (req = request, res = response, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

module.exports = {validateFields};