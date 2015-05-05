module.exports = {
  friendlyName: 'bulk',
  description: 'Perform many index/delete operations in a single API call.',
  extendedDescription: 'http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-bulk',
    inputs: {
    hostname: {
      description: 'The hostname of your ElasticSearch server',
      example: 'localhost',
      required: true,
      whereToGet: {
        description: 'Copy the hostname of your ElasticSearch server',
        extendedDescription: 'i.e. if you are using a hosted ElasticSearch instance at "bae23592g23523.some-hosted-service.com", that is your hostname.  If you are running ElasticSearch locally, this will be "localhost".'
      }
    },
    port: {
      description: 'The port your ElasticSearch server is running on',
      defaultsTo: 9200,
      example: 9200,
      whereToGet: {
        description: 'Copy the port of your ElasticSearch server',
        extendedDescription: 'The conventional port number for ElasticSearch servers is 9200.'
      }
    },
    index: {
      description: 'Default index for items which don\'t provide one',
      extendedDescription: 'An "index" in ElasticSearch is a lot like a "database" in MySQL or MongoDB.',
      example: 'myindex',
      required: false
    },
    type: {
      description: 'Default document type for items which don\'t provide one',
      extendedDescription: 'An "index" in ElasticSearch is a lot like a "database" in MySQL or MongoDB.',
      example: 'myindex',
      required: false
    },
    actions: {
      description: 'Actions to do ! (see elastic documentation for more details)',
      //example: [{ index:  { _index: "myindex", _type: "mytype", _id: 2 } }, { title: "foo" } ],
      required: true,
      typeclass: 'array'
    }
  },
  defaultExit: 'success',
  exits: {
    error: {
      description: 'Unexpected error occurred.',
    },
    couldNotConnect: {
      description: 'Could not connect to ElasticSearch at the provided hostname and port.',
    },
    success: {
      description: 'Done.'
    },
  },

  fn: function (inputs, exits) {
    var util = require('util');
    var _ = require('lodash');
    var elasticsearch = require('elasticsearch');

    var client = elasticsearch.Client({
      host: util.format('%s:%d', inputs.hostname, inputs.port||9200),
      log: require('../helpers/noop-logger')
    });

    client.bulk({
      index: inputs.index || "default_bulk_index",
      type: inputs.type || "default_bulk_type",
      body: inputs.actions
    }, function (err, body) {
      if (err) {
        client.close();
        if (typeof err !== 'object' || typeof err.message !== 'string') {
          return exits.error(err);
        }
        if (err.constructor && err.constructor.name === 'NoConnections' || err.message.match(/No Living connections/)) {
          return exits.couldNotConnect();
        }
        return exits.error(err);
      }
      client.close();
      return exits.success();
    });
  },
};
