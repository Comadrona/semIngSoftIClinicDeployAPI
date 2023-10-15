const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController')
const verifyJWT = require('../middleware/verifyJWT')

router.route('/')
    .get(usersController.getAllUsers)//read
    .post(usersController.createUser)//create
router.route('/unique')
    .post(usersController.getOneUser)//read one user
    .patch(usersController.updateUser)//update
    .delete(usersController.deleteUser)//delete
router.route('/basic')
    .get(usersController.getAllBasicUsers)
router.route('/admin')
    .get(usersController.getAllAdminUsers)
router.route('/clinicProfile')
    .post(usersController.hasClinicProfile)// get clinic profile condition
router.route('/activate')
    .patch(usersController.activateUser)// get clinic profile condition
module.exports = router;