const express = require('express');
const router = express.Router();
const ctrl = require('../src/controllers');
const {getAuth} = require('../src/send-api');
router.post('/', (req, res) => {
  res.send('POST request to the homepage');
});

router.post('/auth', getAuth)
router.post('/in', ctrl.parkingIn)
router.post('/out', ctrl.parkingOut)

module.exports = router;