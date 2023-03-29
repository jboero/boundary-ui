import { module, test } from 'qunit';
import { visit, currentURL, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'admin/tests/helpers';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { enableFeature } from 'ember-feature-flags/test-support';

module('Acceptance | session recordings | list', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  // Selectors
  const LIST_SESSION_RECORDING_BUTTON =
    'table > tbody > tr > td:last-child > a';
  const SESSION_RECORDING_TITLE = 'Session Recordings';

  // Instances
  const instances = {
    scopes: {
      global: null,
      org: null,
    },
    sessionRecording: null,
  };

  // Urls
  const urls = {
    globalScope: null,
    sessionRecordings: null,
    sessionRecording: null,
  };

  hooks.beforeEach(function () {
    instances.scopes.global = this.server.create('scope', { id: 'global' });
    instances.scopes.org = this.server.create('scope', {
      type: 'org',
      scope: { id: 'global', type: 'global' },
    });
    instances.scopes.targetModel = this.server.create('target', {
      scope: instances.scopes.global,
    });
    instances.sessionRecording = this.server.create('session-recording', {
      target: instances.scopes.targetModel,
    });
    urls.globalScope = `/scopes/global`;
    urls.sessionRecordings = `${urls.globalScope}/session-recordings`;
    urls.sessionRecording = `${urls.sessionRecordings}/${instances.sessionRecording.id}`;
    enableFeature('session-recording');
    authenticateSession({});
  });

  test('users can navigate to session-recordings with proper authorization', async function (assert) {
    assert.expect(4);

    await visit(urls.globalScope);

    assert.true(
      instances.scopes.global.authorized_collection_actions[
        'session-recordings'
      ].includes('list')
    );
    assert.dom(`[href="${urls.sessionRecordings}"]`).exists();
    assert.dom('[title="General"]').includesText(SESSION_RECORDING_TITLE);

    // Visit session recordings
    await click(`[href="${urls.sessionRecordings}"]`);
    assert.strictEqual(currentURL(), urls.sessionRecordings);
  });

  test('users cannot navigate to session-recordings without the list action', async function (assert) {
    assert.expect(3);
    instances.scopes.global.authorized_collection_actions[
      'session-recordings'
    ] = [];

    await visit(urls.globalScope);

    assert.false(
      instances.scopes.global.authorized_collection_actions[
        'session-recordings'
      ].includes('list')
    );
    assert.dom('[title="General"]').doesNotIncludeText(SESSION_RECORDING_TITLE);
    assert.dom(`[href="${urls.sessionRecordings}"]`).doesNotExist();
  });

  // TODO: When we add abilities to session-recordings this test will be refactor to account for it.
  test('user can navigate to a session recording', async function (assert) {
    assert.expect(2);
    // Visit session recordings
    await visit(urls.sessionRecordings);
    assert.dom('table').hasClass('hds-table');
    // Click a session recording and check it navigates properly
    await click(LIST_SESSION_RECORDING_BUTTON);
    assert.strictEqual(currentURL(), urls.sessionRecording);
  });
});
