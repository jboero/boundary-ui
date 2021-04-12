import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module(
  'Unit | Route | scopes/scope/authenticate/method/oidc',
  function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
      let route = this.owner.lookup(
        'route:scopes/scope/authenticate/method/oidc'
      );
      assert.ok(route);
    });
  }
);
