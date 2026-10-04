// Compatibility entrypoint. New code should import from server/expedition/* directly.
module.exports={
  ...require('./expedition/route-generator'),
  ...require('./expedition/route-voting')
};
