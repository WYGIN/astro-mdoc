import type {
	Config,
	ConfigType as MarkdocConfig,
	NodeType,
	Schema,
} from '@markdoc/markdoc';
import type { AstroInstance } from 'astro';


export type Render = AstroInstance['default'];

export type AstroMarkdocConfig = MarkdocConfig & {
	tags?: Record<string, Schema<Config, Render>>
	nodes?: Partial<Record<NodeType, Schema<Config, Render>>>
}
// Partial<{
// 	tags: Record<string, Schema<Config, Render>>;
// 	nodes: Partial<Record<NodeType, Schema<Config, Render>>>;
// 	ctx: C;
// 	extends: MaybePromise<ResolvedAstroMarkdocConfig>[];
// }>;

export type ResolvedAstroMarkdocConfig = Omit<AstroMarkdocConfig, 'extends'>;