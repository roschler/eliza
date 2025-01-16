[@ai16z/eliza v0.1.5-alpha.5](../index.md) / IAgentRuntime

# Interface: IAgentRuntime

## Properties

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Properties

#### Defined in

[packages/core/src/types.ts:1250](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1250)

***

### serverUrl

> **serverUrl**: `string`

#### Defined in

[packages/core/src/types.ts:1251](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1251)

***

### databaseAdapter

> **databaseAdapter**: [`IDatabaseAdapter`](IDatabaseAdapter.md)

#### Defined in

[packages/core/src/types.ts:1252](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1252)

***

### token

> **token**: `string`

#### Defined in

[packages/core/src/types.ts:1253](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1253)

***

### modelProvider

> **modelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

#### Defined in

[packages/core/src/types.ts:1254](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1254)

***

### imageModelProvider

> **imageModelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

#### Defined in

[packages/core/src/types.ts:1255](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1255)

***

### character

> **character**: [`Character`](../type-aliases/Character.md)

#### Defined in

[packages/core/src/types.ts:1256](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1256)

***

### providers

> **providers**: [`Provider`](Provider.md)[]

#### Defined in

[packages/core/src/types.ts:1257](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1257)

***

### actions

> **actions**: [`Action`](Action.md)[]

#### Defined in

[packages/core/src/types.ts:1258](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1258)

***

### evaluators

> **evaluators**: [`Evaluator`](Evaluator.md)[]

#### Defined in

[packages/core/src/types.ts:1259](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1259)

***

### plugins

> **plugins**: [`Plugin`](../type-aliases/Plugin.md)[]

#### Defined in

[packages/core/src/types.ts:1260](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1260)

***

### messageManager

> **messageManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1262](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1262)

***

### descriptionManager

> **descriptionManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1263](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1263)

***

### documentsManager

> **documentsManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1264](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1264)

***

### knowledgeManager

> **knowledgeManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1265](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1265)

***

### loreManager

> **loreManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1266](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1266)

***

### cacheManager

> **cacheManager**: [`ICacheManager`](ICacheManager.md)

#### Defined in

[packages/core/src/types.ts:1268](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1268)

***

### services

> **services**: `Map`\<[`ServiceType`](../enumerations/ServiceType.md), [`Service`](../classes/Service.md)\>

#### Defined in

[packages/core/src/types.ts:1270](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1270)

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1272](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1272)

***

### registerMemoryManager()

> **registerMemoryManager**(`manager`): `void`

#### Parameters

• **manager**: [`IMemoryManager`](IMemoryManager.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1274](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1274)

***

### getMemoryManager()

> **getMemoryManager**(`name`): [`IMemoryManager`](IMemoryManager.md)

#### Parameters

• **name**: `string`

#### Returns

[`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1276](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1276)

***

### getService()

> **getService**\<`T`\>(`service`): `T`

#### Type Parameters

• **T** *extends* [`Service`](../classes/Service.md)

#### Parameters

• **service**: [`ServiceType`](../enumerations/ServiceType.md)

#### Returns

`T`

#### Defined in

[packages/core/src/types.ts:1278](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1278)

***

### registerService()

> **registerService**(`service`): `void`

#### Parameters

• **service**: [`Service`](../classes/Service.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1280](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1280)

***

### getSetting()

> **getSetting**(`key`): `string`

#### Parameters

• **key**: `string`

#### Returns

`string`

#### Defined in

[packages/core/src/types.ts:1282](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1282)

***

### getConversationLength()

> **getConversationLength**(): `number`

Methods

#### Returns

`number`

#### Defined in

[packages/core/src/types.ts:1285](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1285)

***

### processActions()

> **processActions**(`message`, `responses`, `state`?, `callback`?): `Promise`\<`void`\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **responses**: [`Memory`](Memory.md)[]

• **state?**: [`State`](State.md)

• **callback?**: [`HandlerCallback`](../type-aliases/HandlerCallback.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1287](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1287)

***

### evaluate()

> **evaluate**(`message`, `state`?, `didRespond`?): `Promise`\<`string`[]\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **state?**: [`State`](State.md)

• **didRespond?**: `boolean`

#### Returns

`Promise`\<`string`[]\>

#### Defined in

[packages/core/src/types.ts:1294](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1294)

***

### ensureParticipantExists()

> **ensureParticipantExists**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1300](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1300)

***

### ensureUserExists()

> **ensureUserExists**(`userId`, `userName`, `name`, `source`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **userName**: `string`

• **name**: `string`

• **source**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1302](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1302)

***

### registerAction()

> **registerAction**(`action`): `void`

#### Parameters

• **action**: [`Action`](Action.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1309](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1309)

***

### ensureConnection()

> **ensureConnection**(`userId`, `roomId`, `userName`?, `userScreenName`?, `source`?): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **userName?**: `string`

• **userScreenName?**: `string`

• **source?**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1311](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1311)

***

### ensureParticipantInRoom()

> **ensureParticipantInRoom**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1319](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1319)

***

### ensureRoomExists()

> **ensureRoomExists**(`roomId`): `Promise`\<`void`\>

#### Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1321](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1321)

***

### composeState()

> **composeState**(`message`, `additionalKeys`?): `Promise`\<[`State`](State.md)\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **additionalKeys?**

#### Returns

`Promise`\<[`State`](State.md)\>

#### Defined in

[packages/core/src/types.ts:1323](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1323)

***

### updateRecentMessageState()

> **updateRecentMessageState**(`state`): `Promise`\<[`State`](State.md)\>

#### Parameters

• **state**: [`State`](State.md)

#### Returns

`Promise`\<[`State`](State.md)\>

#### Defined in

[packages/core/src/types.ts:1328](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1328)
