/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import factory from '../generated/factories/channel-recording';
import generateId from '../helpers/id';

export default factory.extend({
  id: () => generateId('chr_'),
});
