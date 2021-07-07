import Route from '@ember/routing/route';

export default class ScopesScopeCredentialStoresCredentialStoreRoute extends Route {
  // =methods

  /**
   * Load a credential store by ID.
   * @param {object} params
   * @param {string} params.credential_store_id
   * @return {credentialStoreModel}
   */
  async model({ credential_store_id }) {
    return this.store.findRecord('credential-store', credential_store_id);
  }

  /**
   * Renders credential store specific templates for header and navigation page section.
   * @override
   */
  renderTemplate() {
    super.renderTemplate(...arguments);

    this.render('scopes/scope/credential-stores/credential-store/-header', {
      into: 'scopes/scope/credential-stores/credential-store',
      outlet: 'header',
    });

    this.render('scopes/scope/credential-stores/credential-store/-navigation', {
      into: 'scopes/scope/credential-stores/credential-store',
      outlet: 'navigation',
    });
  }
}
