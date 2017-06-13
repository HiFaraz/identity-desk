/**
 * Express framework configuration
 *
 * Provides methods for configuring Express:
 * - before attaching authenticators
 * - after attaching authenticators
 */

'use strict';

export default {
  afterAuthenticators,
  beforeAuthenticators,
};

/**
 * Module dependencies.
 */

import parsers from './parsers';
import requests from './requests';
import sessions from './sessions';

/**
 * Configure Express before attaching authenticators
 *
 * @param {Object} app Express app
 */
function afterAuthenticators(app) {
  sessions.attach(app); // TODO move to /authentication
}

/**
 * Configure Express before attaching authenticators
 *
 * @param {Object} app Express app
 * @param {Object} [database] Sequelize database object. Not needed if a store is provided
 * @param {Object} [store] Store for `express-sessions`. Uses the database if a store is not provided
 * @param {Object} settings
 */
function beforeAuthenticators(app, database, store, settings) {
  parsers.attach(app, settings);
  requests.extend(app); // TODO move to /authentication
  sessions.setup(app, database, store, settings); // TODO move to /authentication
}