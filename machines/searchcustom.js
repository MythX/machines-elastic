module.exports = {
  friendlyName: 'Search custom',
  description: 'Search custom on Elastic Search',
  extendedDescription: '',
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
      description: 'The name of the index to search',
      extendedDescription: 'An "index" in ElasticSearch is a lot like a "database" in MySQL or MongoDB.',
      example: 'myindex',
      required: true
    },
    type: {
      description: 'The name of the type to search',
      extendedDescription: '',
      example: 'mytype',
      required: true
    },
    query: {
      description: 'The search query',
      example: 'cute dogs',
      required: true
    }
  },
  defaultExit: 'success',
  exits: {
    error: {
      description: 'Unexpected error occurred.',
    },
    couldNotConnect: {
      description: 'Could not connect to ElasticSearch at the provided hostname and port',
    },
    noSuchIndex: {
      description: 'The specified index does not exist.'
    },
    success: {
      description: 'Done.',
      example: []
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

    client.search({
      _source: false,
      index: inputs.index,
      body: inputs.query,
      type: inputs.type,
    }, function (err, body) {
      if (err) {
        client.close();
        if (typeof err !== 'object' || typeof err.message !== 'string') {
          return exits.error(err);
        }
        if (err.constructor && err.constructor.name === 'NoConnections' || err.message.match(/No Living connections/)) {
          return exits.couldNotConnect();
        }
        if (err.message.match(/IndexMissingException/)) {
          return exits.noSuchIndex();
        }
        return exits.error(err);
      }

      var hits = [];
      try {
        hits = body.hits.hits;
      } catch (e) {
        client.close();
        return exits.error(e);
      }
      client.close();
      return exits.success(hits);
    });
  },
};
