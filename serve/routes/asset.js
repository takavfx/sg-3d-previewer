var express = require('express');
const { route } = require('.');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.send('Asset ID parameter is missing.');
});

router.get('/:assetId', function(req, res, next) {
    console.log(req.body)
    
});

module.exports = router;