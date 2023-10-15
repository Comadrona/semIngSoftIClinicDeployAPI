const express = require('express');
const router = express.Router();
const appoimentsController = require('../controllers/appoimentsController')
const verifyJWT = require('../middleware/verifyJWT');
const appoimentsControllerFullfiled = require('../controllers/appoimentsFullfiledController');
//router.use(verifyJWT)

router.route('/')
    .get(appoimentsController.getAllAppoiments)//read all
    .post(appoimentsController.createAppoiment)//create
router.route('/user')
    .get(appoimentsController.getUserAppoiments)//read user appoiments
router.route('/unique')
    .get(appoimentsController.getOneAppoiment)//read unique
    .patch(appoimentsController.updateAppoiment)//update
    .delete(appoimentsController.deleteAppoiment)//delete
router.route('/fullfiled')
    .get(appoimentsControllerFullfiled.getAllAppoimentsFullfiled)//read all fullfiled
    .post(appoimentsControllerFullfiled.createAppoimentFullfiled)
router.route('/fullfiled/unique')
    .get(appoimentsControllerFullfiled.getOneAppoimentFullfiled)
router.route('/fullfiled/user')
    .get(appoimentsControllerFullfiled.getUserAppoimentsFullfiled)
router.route('/automatic')
    .post(appoimentsController.createAutomaticAppoiment)
module.exports = router;