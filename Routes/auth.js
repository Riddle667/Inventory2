const { Router } = require("express");
const { login } = require("../Controller/auth");
const { check } = require("express-validator");


const router = Router();


router.get('/login',[
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').not().isEmpty()
    ], 
    login 
);

module.exports = router;