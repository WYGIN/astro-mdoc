// import { link } from '@markdoc/next.js/tags';
import Markdoc from '@markdoc/markdoc';

import { AppLink } from '../../components/AppLink';

export default {
  ...Markdoc.nodes.link,
  render: AppLink
};
