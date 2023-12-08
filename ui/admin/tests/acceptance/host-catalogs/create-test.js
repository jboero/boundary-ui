/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { module, test } from 'qunit';
import { visit, currentURL, find, click, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { Response } from 'miragejs';
import {
  authenticateSession,
  // These are left here intentionally for future reference.
  //currentSession,
  //invalidateSession,
} from 'ember-simple-auth/test-support';

module('Acceptance | host-catalogs | create', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  let gethostCatalogCount;

  const instances = {
    scopes: {
      global: null,
      org: null,
      project: null,
    },
    orgScope: null,
  };
  const urls = {
    globalScope: null,
    orgScope: null,
    projectScope: null,
    hostCatalogs: null,
    hostCatalog: null,
    newHostCatalog: null,
    newStaticHostCatalog: null,
    newAWSDynamicHostCatalog: null,
    newAzureDynamicHostCatalog: null,
  };

  hooks.beforeEach(function () {
    // Generate resources
    instances.scopes.global = this.server.create('scope', { id: 'global' });
    instances.orgScope = this.server.create(
      'scope',
      {
        type: 'org',
        scope: { id: 'global', type: 'global' },
      },
      'withChildren',
    );
    instances.scopes.org = this.server.create('scope', {
      type: 'org',
      scope: { id: 'global', type: 'global' },
    });
    instances.scopes.project = this.server.create('scope', {
      type: 'project',
      scope: { id: instances.scopes.org.id, type: 'org' },
    });
    instances.hostCatalog = this.server.create('host-catalog', {
      scope: instances.scopes.project,
    });

    // Generate route URLs for resources
    urls.globalScope = `/scopes/global/scopes`;
    urls.orgScope = `/scopes/${instances.orgScope.id}/scopes`;
    urls.projectScope = `/scopes/${instances.scopes.project.id}`;
    urls.hostCatalogs = `${urls.projectScope}/host-catalogs`;

    urls.hostCatalog = `${urls.hostCatalogs}/${instances.hostCatalog.id}`;
    urls.newHostCatalog = `${urls.hostCatalogs}/new`;
    urls.newStaticHostCatalog = `${urls.newHostCatalog}?type=static`;
    urls.newAWSDynamicHostCatalog = `${urls.newHostCatalog}?type=aws`;
    urls.newAzureDynamicHostCatalog = `${urls.newHostCatalog}?type=azure`;
    // Generate resource couner
    gethostCatalogCount = () =>
      this.server.schema.hostCatalogs.all().models.length;

    authenticateSession({});
  });

  test('Users can create new static host catalogs', async function (assert) {
    const count = gethostCatalogCount();
    await visit(urls.newStaticHostCatalog);
    await fillIn('[name="name"]', 'random string');
    await fillIn('[name="description"]', 'random string');
    await fillIn('[name="type"]', 'static');
    await click('[type="submit"]');
    assert.strictEqual(gethostCatalogCount(), count + 1);
  });

  test('Users can create new dynamic aws host catalogs with aws provider', async function (assert) {
    const count = gethostCatalogCount();
    await visit(urls.newAWSDynamicHostCatalog);
    await fillIn('[name="name"]', 'random string');
    await fillIn('[name="description"]', 'random string');
    await fillIn('[name="type"]', 'aws');
    await click('[type="submit"]');
    assert.strictEqual(gethostCatalogCount(), count + 1);
  });

  test('Users can create new dynamic aws host catalogs with azure provider', async function (assert) {
    const count = gethostCatalogCount();
    await visit(urls.newAzureDynamicHostCatalog);
    await fillIn('[name="name"]', 'random string');
    await fillIn('[name="description"]', 'random string');
    await fillIn('[name="type"]', 'azure');
    await click('[type="submit"]');
    assert.strictEqual(gethostCatalogCount(), count + 1);
  });

  test('Users can cancel creation of new static host catalogs', async function (assert) {
    const count = gethostCatalogCount();
    await visit(urls.newStaticHostCatalog);
    await fillIn('[name="name"]', 'random string');
    await click('.rose-form-actions [type="button"]');
    assert.strictEqual(currentURL(), urls.hostCatalogs);
    assert.strictEqual(gethostCatalogCount(), count);
  });

  test('Users can cancel creation of new dynamic host catalogs with AWS provider', async function (assert) {
    const count = gethostCatalogCount();
    await visit(urls.newAWSDynamicHostCatalog);
    await fillIn('[name="name"]', 'random string');
    await click('.rose-form-actions [type="button"]');
    assert.strictEqual(currentURL(), urls.hostCatalogs);
    assert.strictEqual(gethostCatalogCount(), count);
  });

  test('Users can cancel creation of new dynamic host catalogs with Azure provider', async function (assert) {
    const count = gethostCatalogCount();
    await visit(urls.newAzureDynamicHostCatalog);
    await fillIn('[name="name"]', 'random string');
    await click('.rose-form-actions [type="button"]');
    assert.strictEqual(currentURL(), urls.hostCatalogs);
    assert.strictEqual(gethostCatalogCount(), count);
  });

  test('Users can navigate to new static host catalogs route with proper authorization', async function (assert) {
    await visit(urls.hostCatalogs);
    assert.ok(
      instances.scopes.project.authorized_collection_actions[
        'host-catalogs'
      ].includes('create'),
    );
    assert.ok(find(`[href="${urls.newHostCatalog}"]`));
  });

  test('Users cannot navigate to new static host catalogs route without proper authorization', async function (assert) {
    instances.scopes.project.authorized_collection_actions['host-catalogs'] =
      [];
    await visit(urls.hostCatalogs);
    assert.notOk(
      instances.scopes.project.authorized_collection_actions[
        'host-catalogs'
      ].includes('create'),
    );
    assert.notOk(find(`[href="${urls.newStaticHostCatalog}"]`));
  });

  test('saving a new static host catalog with invalid fields displays error messages', async function (assert) {
    this.server.post('/host-catalogs', () => {
      return new Response(
        400,
        {},
        {
          status: 400,
          code: 'invalid_argument',
          message: 'The request was invalid.',
          details: {
            request_fields: [
              {
                name: 'name',
                description: 'Name is required.',
              },
            ],
          },
        },
      );
    });
    await visit(urls.newStaticHostCatalog);
    await click('[type="submit"]');
    assert.ok(
      find('[role="alert"]').textContent.trim(),
      'The request was invalid.',
    );
    assert.ok(
      find('.rose-form-error-message').textContent.trim(),
      'Name is required.',
    );
  });

  test('users cannot directly navigate to new host catalog route without proper authorization', async function (assert) {
    instances.scopes.project.authorized_collection_actions['host-catalogs'] =
      instances.scopes.project.authorized_collection_actions[
        'host-catalogs'
      ].filter((item) => item !== 'create');

    await visit(urls.newHostCatalog);

    assert.false(
      instances.scopes.project.authorized_collection_actions[
        'host-catalogs'
      ].includes('create'),
    );
    assert.strictEqual(currentURL(), urls.hostCatalogs);
  });
});
