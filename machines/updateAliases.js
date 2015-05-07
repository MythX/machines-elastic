module.exports = {
  friendlyName: 'Update an alias',
  description: 'Perform an atomic alias swap, for a rotating index.',
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
    actions: {
      description: 'The search query',
      example: '{actions: [{ remove: { index: "response_1", alias: "response" } }, { add:    { index: "response_2", alias: "response" } }] }',
      required: true
    }
  },
  defaultExit: 'success',
  exits: {
    error: {
      description: 'Unexpected error occurred.',
    },
    couldNotConnect: {
      description: 'Could not connect to ElasticSearch at the provided hostname and port.'
    },
    noSuchIndex: {
      description: 'The specified index does not exist.'
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

    client.indices.updateAliases({
      body: inputs.actions
    }).then(function (response) {
      client.close();
      return exits.success();
    }, function errorHandler(err) {
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
      if (err.message.match(/missing/)) {
        return exits.aliasNotExists();
      }
      return exits.error(err);
    });
  },
};
