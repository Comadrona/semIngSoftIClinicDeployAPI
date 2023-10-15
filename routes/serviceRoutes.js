const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController')
const verifyJWT = require('../middleware/verifyJWT')
router.route('/')
    .get(servicesController.getAllServices)//read
    .patch(servicesController.updateService)//update
    .delete(servicesController.deleteService)//delete
    .post(servicesController.createService)//create

module.exports = router;