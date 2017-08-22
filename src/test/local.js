/**
 * Based on https://github.com/expressjs/express/blob/9f019c8c6966736803a65eb4a96d0e7e87e85ede/test/acceptance/auth.js
 */
'use strict';

import { identityDesk, port } from '../../examples/local';
import request from 'supertest';

/**
 * Create a Cookie header value from a request's `Set-Cookie` header
 * 
 * @param {IncomingMessage} res 
 * @return {string}
 */
function getCookies(res) {
  return (res.headers['set-cookie'] || [])
    .map(cookie => cookie.split(';')[0])
    .join('; ');
}

const TEST_URL = `http://localhost:${port}`;

describe('local', function() {
  before(async () => {
    await identityDesk.database.init();

    const {
      Authentication$Account,
      Authentication$Local$User,
      Core$Identity,
    } = identityDesk.database.models;

    // set up test identity and authentication account
    const user = await Authentication$Local$User.create({
      password: 'bar',
      username: 'foo',
    }); // TODO replace with an initial POST call to `/register`
    await Core$Identity.create(
      {
        authentication$Accounts: [
          {
            authenticatorAccountId: user.id,
            authenticatorName: 'local',
          },
        ],
      },
      {
        include: [Authentication$Account],
      },
    );
  });

  describe('GET /', function() {
    it('should redirect to /login', function(done) {
      request(TEST_URL).get('/').expect('Location', '/login').expect(302, done);
    });
  });

  describe('GET /login', function() {
    it('should render login form', function(done) {
      request(TEST_URL).get('/login').expect(200, /<form/, done);
    });

    it('should display login error', function(done) {
      request(TEST_URL)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=not-foo&password=bar')
        .expect('Location', '/login?reason=Unauthorized')
        .expect(303, done);
    });
  });

  describe('GET /logout', function() {
    it('should redirect to /', function(done) {
      request(TEST_URL)
        .get('/logout')
        .expect('Location', '/')
        .expect(302, done);
    });
  });

  describe('GET /restricted', function() {
    it('should redirect to /login without cookie', function(done) {
      request(TEST_URL)
        .get('/restricted')
        .expect('Location', '/login')
        .expect(302, done);
    });

    it('should succeed with proper cookie', function(done) {
      request(TEST_URL)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=foo&password=bar')
        .expect('Location', '/restricted')
        .expect(303, function(err, res) {
          if (err) {
            return done(err);
          }
          request(TEST_URL)
            .get('/restricted')
            .set('Cookie', getCookies(res))
            .expect(200, done);
        });
    });
  });

  describe('POST /auth/local', function() {
    it('should fail without proper username', function(done) {
      request(TEST_URL)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=not-foo&password=bar')
        .expect('Location', '/login?reason=Unauthorized')
        .expect(303, done);
    });

    it('should fail without proper password', function(done) {
      request(TEST_URL)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=foo&password=baz')
        .expect('Location', '/login?reason=Unauthorized')
        .expect(303, done);
    });

    it('should succeed with proper credentials', function(done) {
      request(TEST_URL)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=foo&password=bar')
        .expect('Location', '/restricted')
        .expect(303, done);
    });
  });
});
