//  TODO: http://start.jcolemorrison.com/quick-tip-organizing-routes-in-large-express-4-x-apps/

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/test', function(req, res, next) {
  res.render('test', { title: 'test' });
});

module.exports = router;
