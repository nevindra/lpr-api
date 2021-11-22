const express = require('express');
const router = express.Router();
const ctrl = require('../src/controllers');

router.post('/', (req, res) => {
  res.send('POST request to the homepage');
});

router.post('/auth', ctrl.getAuth)
router.post('/detect', ctrl.detectImg)
router.post('/in', ctrl.parkingIn)
router.post('/out', ctrl.parkingOut)

module.exports = router;