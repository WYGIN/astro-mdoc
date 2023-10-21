import Markdoc from '@markdoc/markdoc';
import { Code } from '../../components/Code';

export default {
  render: Code,
  attributes: Markdoc.nodes.fence.attributes
};