// import { link } from '@markdoc/next.js/tags';
import { nodes } from '@markdoc/markdoc';

import { AppLink } from '../../components/AppLink';

export default {
  ...nodes.link,
  render: AppLink
};
