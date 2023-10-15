const express = require('express');
const router = express.Router();
const clinicalProfileController = require('../controllers/clinicalProfileController');
const verifyJWT = require('../middleware/verifyJWT');
//router.use(verifyJWT)

router.route('/')
    .get(clinicalProfileController.getAllClinicalProfiles)//read all
    .post(clinicalProfileController.createClinicalProfile)//create
router.route('/user')
    .get(clinicalProfileController.getUserClinicalProfile)//read user appoiments
router.route('/unique')
    .get(clinicalProfileController.getOneClinicalProfile)//read unique
    .patch(clinicalProfileController.updateClinicalProfile)//update
    .delete(clinicalProfileController.deleteClinicalProfile)//delete
module.exports = router;