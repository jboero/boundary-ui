import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | form/auth-method', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.submit = () => {};
    this.cancel = () => {};

    await render(hbs`
      <Form::AuthMethod
        @submit={{this.submit}}
        @cancel={{this.cancel}}
      />`);

    assert.ok(find('form'));
  });
});
