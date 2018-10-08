//  TODO: http://start.jcolemorrison.com/quick-tip-organizing-routes-in-large-express-4-x-apps/

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var isa_provider = req.query.isa_provider;
  var isa_reference = req.query.isa_reference;
  var isa_transfer_type = req.query.isa_transfer_type;
  res.render('start', {
    title: 'Express',
    provider: isa_provider,
    reference: isa_reference,
    transfer_type: isa_transfer_type
  });
});
router.get('/details', function(req, res, next) {
  var isa_provider = req.query.isa_provider;
  var isa_reference = req.query.isa_reference;
  var isa_transfer_type = req.query.isa_transfer_type;
  res.render('details', {
    title: 'Express',
    provider: isa_provider,
    reference: isa_reference,
    transfer_type: isa_transfer_type
  });
});
router.get('/summary', function(req, res, next) {
  var isa_provider = req.query.isa_provider;
  var isa_reference = req.query.isa_reference;
  var isa_transfer_type = req.query.isa_transfer_type;
  res.render('summary', {
    title: 'Express',
    provider: isa_provider,
    reference: isa_reference,
    transfer_type: isa_transfer_type
  });
});
router.get('/success', function(req, res, next) {
  var isa_provider = req.query.isa_provider;
  var isa_reference = req.query.isa_reference;
  var isa_transfer_type = req.query.isa_transfer_type;
  res.render('success', {
    title: 'Express',
    provider: isa_provider,
    reference: isa_reference,
    transfer_type: isa_transfer_type
  });
});

module.exports = router;
