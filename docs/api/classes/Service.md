[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Service

# Class: `abstract` Service

## Extended by

- [`IImageDescriptionService`](../interfaces/IImageDescriptionService.md)
- [`ITranscriptionService`](../interfaces/ITranscriptionService.md)
- [`IVideoService`](../interfaces/IVideoService.md)
- [`ITextGenerationService`](../interfaces/ITextGenerationService.md)
- [`IBrowserService`](../interfaces/IBrowserService.md)
- [`ISpeechService`](../interfaces/ISpeechService.md)
- [`IPdfService`](../interfaces/IPdfService.md)

## Constructors

### new Service()

> **new Service**(): [`Service`](Service.md)

#### Returns

[`Service`](Service.md)

## Accessors

### serviceType

#### Get Signature

> **get** `static` **serviceType**(): [`ServiceType`](../enumerations/ServiceType.md)

##### Returns

[`ServiceType`](../enumerations/ServiceType.md)

#### Defined in

[packages/core/src/types.ts:1250](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1250)

***

### serviceType

#### Get Signature

> **get** **serviceType**(): [`ServiceType`](../enumerations/ServiceType.md)

##### Returns

[`ServiceType`](../enumerations/ServiceType.md)

#### Defined in

[packages/core/src/types.ts:1261](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1261)

## Methods

### getInstance()

> `static` **getInstance**\<`T`\>(): `T`

#### Type Parameters

• **T** *extends* [`Service`](Service.md)

#### Returns

`T`

#### Defined in

[packages/core/src/types.ts:1254](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1254)

***

### initialize()

> `abstract` **initialize**(`runtime`): `Promise`\<`void`\>

Add abstract initialize method that must be implemented by derived classes

#### Parameters

• **runtime**: [`IAgentRuntime`](../interfaces/IAgentRuntime.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1266](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1266)
