/* Set up redis client */
var redis = require("redis");
module.exports = redis.createClient();