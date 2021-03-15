import BaseAuthenticator from './base';
import { inject as service } from '@ember/service';
import { reject } from 'rsvp';
import fetch from 'fetch';

/**
 * The OIDC base authenticator encapsulates the multistep OIDC flow.
 *
 * 1. Start authentication flow:  this step is actually a combination of two
 *    sub steps:
 *    1. Initiate a call via `startAuthentication` to the API at
 *       `buildStartAuthEndpointURL` to fetch the URL of the external
 *       authentication provider (`authorization_request_url`).
 *    2. Open `authorization_request_url`.  This may be either inline (same tab)
 *       or external in a new tab or browser window.
 * 2. Requests the token from `buildTokenAuthEndpointURL`.  A token isn't
 *    guaranteed to be ready, so the OIDC flow can be in a "pending" state.
 *
 * This authenticator should not be used directly because it does not specify
 * URL-building endpoints of its own.
 * To use, generate an application authenticator in your app
 * `authenticators/application.js` and extend this class.
 */
export default class OIDCAuthenticator extends BaseAuthenticator {

  // =services

  @service session;

  // =methods

  /**
   * Generates an auth method URL with which to start authentication.
   * @override
   * @param {object} options
   * @param {string} options.scope.scope_id
   * @param {string} options.authMethod.id
   * @return {string}
   */
  buildStartAuthEndpointURL(/* {
    scope: { id: scopeID },
    authMethod: { id: authMethodID },
  } */) { }

  /**
   * Generates an auth method URL with which to authenticate.
   * @override
   * @param {object} options
   * @param {string} options.scope.scope_id
   * @param {string} options.authMethod.id
   * @return {string}
   */
  buildTokenAuthEndpointURL(/* {
    scope: { id: scopeID },
    authMethod: { id: authMethodID },
  } */) { }

  /**
   * Kicks-off the OIDC flow:  calls the `authenticate:start` action on the
   * specified auth method, which returns some meta data along with an
   * authorization request URL.  The response data is saved for later and
   * authentication enters a pending state.
   *
   * @param {boolean} requestCookies request cookie tokens (default `true`)
   * @param {object} options
   * @return {object}
   */
  async startAuthentication(options) {
    const url = this.buildStartAuthEndpointURL(options);
    const response = await fetch(url, { method: 'post' });
    const json = await response.json();
    if (response.status < 400) {
      // Store meta about the pending OIDC flow
      this.session.set('data.pending', {
        oidc: json
      });
      return json;
    } else {
      return reject();
    }
  }

  /**
   * OIDC is a _process_ and does not have a singular "authenticate" step.  Thus
   * this authenticate method simply normalizes the data passed into it once
   * `attemptFetchToken` completes.  Notably, no requests are made by calling
   * authenticate.  A Boundary token must already have been obtained.
   * @param {object} json
   * @return {object}
   */
  async authenticate(json) {
    return this.normalizeData(json);
  }

  /**
   * This request attempts to fetch a Boundary token.  This method represents a
   * single request the polling sequence used to wait for authentication.
   * There are three possible outcomes:
   *
   * 1. If the token is ready, it is persisted into the session, the session
   *    enters an authenticated state, and this method returns `true`.
   * 2. If the token is not yet ready, this method returns false.
   * 3. If the request errors, this method returns to a rejection,
   *    requiring appropriate error handling.
   */
  async attemptFetchToken(options) {
    // Get the URL and setup the request body
    const url = this.buildTokenAuthEndpointURL(options);
    const body = JSON.stringify({
      state: this.session.get('data.pending.oidc.state'),
      token_request_id: this.session.get('data.pending.oidc.token_request_id')
    });
    // Fetch the endpoint and get the response JSON
    const response = await fetch(url, { method: 'post', body });
    const json = await response.json();
    if (response.status === 100) {
      // The token isn't ready yet, keep trying.
      return false;
    } else if (response.status < 400) {
      // Response was successful, meaning a token was obtained.
      // Authenticate with the session service using the response JSON.
      await this.session.authenticate('authenticator:oidc', json);
      return true;
    } else {
      // Response errors, return a rejection for further handling.
      return reject();
    }
  }
}
