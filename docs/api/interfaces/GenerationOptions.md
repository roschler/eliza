[@ai16z/eliza v0.1.5-alpha.5](../index.md) / GenerationOptions

# Interface: GenerationOptions

Configuration options for generating objects with a model.

## Properties

### runtime

> **runtime**: [`IAgentRuntime`](IAgentRuntime.md)

#### Defined in

[packages/core/src/generation.ts:1118](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1118)

***

### context

> **context**: `string`

#### Defined in

[packages/core/src/generation.ts:1119](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1119)

***

### modelClass

> **modelClass**: [`ModelClass`](../enumerations/ModelClass.md)

#### Defined in

[packages/core/src/generation.ts:1120](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1120)

***

### schema?

> `optional` **schema**: `ZodType`\<`any`, `ZodTypeDef`, `any`\>

#### Defined in

[packages/core/src/generation.ts:1121](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1121)

***

### schemaName?

> `optional` **schemaName**: `string`

#### Defined in

[packages/core/src/generation.ts:1122](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1122)

***

### schemaDescription?

> `optional` **schemaDescription**: `string`

#### Defined in

[packages/core/src/generation.ts:1123](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1123)

***

### stop?

> `optional` **stop**: `string`[]

#### Defined in

[packages/core/src/generation.ts:1124](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1124)

***

### mode?

> `optional` **mode**: `"auto"` \| `"json"` \| `"tool"`

#### Defined in

[packages/core/src/generation.ts:1125](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1125)

***

### experimental\_providerMetadata?

> `optional` **experimental\_providerMetadata**: `Record`\<`string`, `unknown`\>

#### Defined in

[packages/core/src/generation.ts:1126](https://github.com/roschler/eliza/blob/main/packages/core/src/generation.ts#L1126)
