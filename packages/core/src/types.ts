import { Readable } from "stream";

// Some simple types that are either NULL or some other primitive value.
export type BillOfMaterialsLineItemOrNull = BillOfMaterialsLineItem | null;
export type BooleanOrNull = boolean | null;
export type ContentOrNull = Content | null;
export type GoalOrNull = Goal | null;
export type IAgentRuntimeOrNull = IAgentRuntime | null;
export type NumberOrNull = number | null;
export type ObjectiveOrNull = Objective | null;
export type ObjectOrNull = object | null;
export type RelationshipOrNull = Relationship | null;
export type StringOrNull = string | null;

/**
 * Represents a UUID string in the format "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

/**
 * Use this UUID for functions like getGoals() that require a room ID, but
 *  in your application context you are not using a room ID.
 */
export const JOKER_UUID_AS_ROOMS_ID_WILDCARD = "00000000-0000-0000-0000-000000000000";

/**
 * Represents the content of a message or communication
 */
export interface Content {
    /** The main text content */
    text: string;

    /** Optional action associated with the message */
    action?: string;

    /** Optional source/origin of the content */
    source?: string;

    /** URL of the original message/post (e.g. tweet URL, Discord message link) */
    url?: string;

    /** UUID of parent message if this is a reply/thread */
    inReplyTo?: UUID;

    /** Array of media attachments */
    attachments?: Media[];

    /** Additional dynamic properties */
    [key: string]: unknown;
}

/**
 * Example content with associated user for demonstration purposes
 */
export interface ActionExample {
    /** User associated with the example */
    user: string;

    /** Content of the example */
    content: Content;
}

/**
 * Example conversation content with user ID
 */
export interface ConversationExample {
    /** UUID of user in conversation */
    userId: UUID;

    /** Content of the conversation */
    content: Content;
}

/**
 * Represents an actor/participant in a conversation
 */
export interface Actor {
    /** Display name */
    name: string;

    /** Username/handle */
    username: string;

    /** Additional profile details */
    details: {
        /** Short profile tagline */
        tagline: string;

        /** Longer profile summary */
        summary: string;

        /** Favorite quote */
        quote: string;
    };

    /** Unique identifier */
    id: UUID;
}

/**
 * The types allowed for the Object resultData and defaultValue properties.
 */
export type BillOfMaterialsResultType = string | boolean | number | object;

/**
 * Represents a single objective within a goal
 */
export interface Objective {
    /** Optional unique identifier */
    id?: string;

    /** Description of what needs to be achieved */
    description: string;

    /** Whether objective is completed */
    completed: boolean;

    /**
     * This flag is set to TRUE if the user indicated they
     *  are interested in (this) optional line item, if it
     *  is optional, or FALSE if they indicated they are not
     *  interested in it.
     */
    isOptionalFieldDesiredByUser?: boolean;

    /**
     * This flag is set to TRUE if the users asks a help
     *  question about the line item, and we have switched
     *  to HELP mode until the user indicates we have
     *  properly answered their question, or they cancel
     *  the session.
     */
    isInHelpMode: boolean;

    /** The optional data object that is the result of the objective
     *   being completed.
     *
     * NOTE: If this objective carries an optional bill-of-materials
     *  line item object, and the user is not interested in the
     *  line item, then this field will contain specifically NULL.
     */
    resultData?: ObjectOrNull;

    /**
     * If present, then this object is a bill of materials line
     *  item objective.
     */
    billOfMaterialsLineItem?: BillOfMaterialsLineItem;
}

/**
 * Status enum for goals
 */
export enum GoalStatus {
    DONE = "DONE",
    FAILED = "FAILED",
    IN_PROGRESS = "IN_PROGRESS",
}

/**
 * Represents a high-level goal composed of objectives
 */
export interface Goal {
    /** Optional unique identifier */
    id?: UUID;

    /** Room ID where goal exists */
    roomId: UUID;

    /** If specified, then this goal is
     *   tied to a specific user to
     *   agent/character relationship
     *   belonging to the room.
     */
    agentId?: UUID;

    /** User ID of goal owner */
    userId: UUID;

    /** Name/title of the goal */
    name: string;

    /** Current status */
    status: GoalStatus;

    /** Component objectives */
    objectives: Objective[];
}

/**
 * Model size/type classification
 */
export enum ModelClass {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    EMBEDDING = "embedding",
    IMAGE = "image",
}

/**
 * Configuration for an AI model
 */
export type Model = {
    /** Optional API endpoint */
    endpoint?: string;

    /** Model settings */
    settings: {
        /** Maximum input tokens */
        maxInputTokens: number;

        /** Maximum output tokens */
        maxOutputTokens: number;

        /** Optional frequency penalty */
        frequency_penalty?: number;

        /** Optional presence penalty */
        presence_penalty?: number;

        /** Optional repetition penalty */
        repetition_penalty?: number;

        /** Stop sequences */
        stop: string[];

        /** Temperature setting */
        temperature: number;
    };

    /** Optional image generation settings */
    imageSettings?: {
        steps?: number;
    };

    /** Model names by size class */
    model: {
        [ModelClass.SMALL]: string;
        [ModelClass.MEDIUM]: string;
        [ModelClass.LARGE]: string;
        [ModelClass.EMBEDDING]?: string;
        [ModelClass.IMAGE]?: string;
    };
};

/**
 * Model configurations by provider
 */
export type Models = {
    [ModelProviderName.OPENAI]: Model;
    [ModelProviderName.ETERNALAI]: Model;
    [ModelProviderName.ANTHROPIC]: Model;
    [ModelProviderName.GROK]: Model;
    [ModelProviderName.GROQ]: Model;
    [ModelProviderName.LLAMACLOUD]: Model;
    [ModelProviderName.TOGETHER]: Model;
    [ModelProviderName.LLAMALOCAL]: Model;
    [ModelProviderName.GOOGLE]: Model;
    [ModelProviderName.CLAUDE_VERTEX]: Model;
    [ModelProviderName.REDPILL]: Model;
    [ModelProviderName.OPENROUTER]: Model;
    [ModelProviderName.OLLAMA]: Model;
    [ModelProviderName.HEURIST]: Model;
    [ModelProviderName.GALADRIEL]: Model;
    [ModelProviderName.FAL]: Model;
    [ModelProviderName.GAIANET]: Model;
    [ModelProviderName.ALI_BAILIAN]: Model;
    [ModelProviderName.VOLENGINE]: Model;
};

/**
 * Available model providers
 */
export enum ModelProviderName {
    OPENAI = "openai",
    ETERNALAI = "eternalai",
    ANTHROPIC = "anthropic",
    GROK = "grok",
    GROQ = "groq",
    LLAMACLOUD = "llama_cloud",
    TOGETHER = "together",
    LLAMALOCAL = "llama_local",
    GOOGLE = "google",
    CLAUDE_VERTEX = "claude_vertex",
    REDPILL = "redpill",
    OPENROUTER = "openrouter",
    OLLAMA = "ollama",
    HEURIST = "heurist",
    GALADRIEL = "galadriel",
    FAL = "falai",
    GAIANET = "gaianet",
    ALI_BAILIAN = "ali_bailian",
    VOLENGINE = "volengine",
}

/**
 * Represents the current state/context of a conversation
 */
export interface State {
    /** ID of user who sent current message */
    userId?: UUID;

    /** ID of agent in conversation */
    agentId?: UUID;

    /** Agent's biography */
    bio: string;

    /** Agent's background lore */
    lore: string;

    /** Message handling directions */
    messageDirections: string;

    /** Post handling directions */
    postDirections: string;

    /** Current room/conversation ID */
    roomId: UUID;

    /** Optional agent name */
    agentName?: string;

    /** Optional message sender name */
    senderName?: string;

    /** String representation of conversation actors */
    actors: string;

    /** Optional array of actor objects */
    actorsData?: Actor[];

    /** Optional string representation of goals */
    goals?: string;

    /** Optional array of goal objects */
    goalsData?: Goal[];

    /** Recent message history as string */
    recentMessages: string;

    /** Recent message objects */
    recentMessagesData: Memory[];

    /** Optional valid action names */
    actionNames?: string;

    /** Optional action descriptions */
    actions?: string;

    /** Optional action objects */
    actionsData?: Action[];

    /** Optional action examples */
    actionExamples?: string;

    /** Optional provider descriptions */
    providers?: string;

    /** Optional response content */
    responseData?: Content;

    /** Optional recent interaction objects */
    recentInteractionsData?: Memory[];

    /** Optional recent interactions string */
    recentInteractions?: string;

    /** Optional formatted conversation */
    formattedConversation?: string;

    /** Optional formatted knowledge */
    knowledge?: string;
    /** Optional knowledge data */
    knowledgeData?: KnowledgeItem[];

    /** Optional direct question that the current chat interaction
     *   with the user is intended to have answered.  For
     *   example, like getting the answer to a bill-of-materials
     *   related question from the LLM.
     */
    simpleQuestion?: string;

    /**
     * Optional help document that should be used when the chat
     *  interaction for a bill-of-materials line item has switched
     *  into HELP mode to answer a user's questions about the
     *  the current line item.
     */
    helpDocument?: string;

    /** Additional dynamic properties */
    [key: string]: unknown;
}

/**
 * Represents a stored memory/message
 */
export interface Memory {
    /** Optional unique identifier */
    id?: UUID;

    /** Associated user ID */
    userId: UUID;

    /** Associated agent ID */
    agentId: UUID;

    /** Optional creation timestamp */
    createdAt?: number;

    /** Memory content */
    content: Content;

    /** Optional embedding vector */
    embedding?: number[];

    /** Associated room ID */
    roomId: UUID;

    /** Whether memory is unique */
    unique?: boolean;

    /** Embedding similarity score */
    similarity?: number;
}

/**
 * Example message for demonstration
 */
export interface MessageExample {
    /** Associated user */
    user: string;

    /** Message content */
    content: Content;
}

/**
 * Handler function type for processing messages
 */
export type Handler = (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
) => Promise<unknown>;

/**
 * Callback function type for handlers
 */
export type HandlerCallback = (
    response: Content,
    files?: any
) => Promise<Memory[]>;

/**
 * Validator function type for actions/evaluators
 */
export type Validator = (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
) => Promise<boolean>;

/**
 * Represents an action the agent can perform
 */
export interface Action {
    /** Similar action descriptions */
    similes: string[];

    /** Detailed description */
    description: string;

    /** Example usages */
    examples: ActionExample[][];

    /** Handler function */
    handler: Handler;

    /** Action name */
    name: string;

    /** Validation function */
    validate: Validator;
}

/**
 * Example for evaluating agent behavior
 */
export interface EvaluationExample {
    /** Evaluation context */
    context: string;

    /** Example messages */
    messages: Array<ActionExample>;

    /** Expected outcome */
    outcome: string;
}

/**
 * Evaluator for assessing agent responses
 */
export interface Evaluator {
    /** Whether to always run */
    alwaysRun?: boolean;

    /** Detailed description */
    description: string;

    /** Similar evaluator descriptions */
    similes: string[];

    /** Example evaluations */
    examples: EvaluationExample[];

    /** Handler function */
    handler: Handler;

    /** Evaluator name */
    name: string;

    /** Validation function */
    validate: Validator;
}

/**
 * Provider for external data/services
 */
export interface Provider {
    /** Data retrieval function */
    get: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ) => Promise<any>;
}

/**
 * Represents a relationship between users
 */
export interface Relationship {
    /** Unique identifier */
    id: UUID;

    /** First user ID */
    userA: UUID;

    /** Second user ID */
    userB: UUID;

    /** Primary user ID */
    userId: UUID;

    /** Associated room ID */
    roomId: UUID;

    /** Relationship status */
    status: string;

    /** Optional creation timestamp */
    createdAt?: string;
}

/**
 * Represents a user account
 */
export interface Account {
    /** Unique identifier */
    id: UUID;

    /** Display name */
    name: string;

    /** Username */
    username: string;

    /** Optional additional details */
    details?: { [key: string]: any };

    /** Optional email */
    email?: string;

    /** Optional avatar URL */
    avatarUrl?: string;
}

/**
 * Room participant with account details
 */
export interface Participant {
    /** Unique identifier */
    id: UUID;

    /** Associated account */
    account: Account;
}

/**
 * Represents a conversation room
 */
export interface Room {
    /** Unique identifier */
    id: UUID;

    /** Room participants */
    participants: Participant[];
}

/**
 * Represents a media attachment
 */
export type Media = {
    /** Unique identifier */
    id: string;

    /** Media URL */
    url: string;

    /** Media title */
    title: string;

    /** Media source */
    source: string;

    /** Media description */
    description: string;

    /** Text content */
    text: string;
};

/**
 * Client interface for platform connections
 */
export type Client = {
    /** Start client connection */
    start: (runtime?: IAgentRuntime) => Promise<unknown>;

    /** Stop client connection */
    stop: (runtime?: IAgentRuntime) => Promise<unknown>;
};

/**
 * Plugin for extending agent functionality
 */
export type Plugin = {
    /** Plugin name */
    name: string;

    /** Plugin description */
    description: string;

    /** Optional actions */
    actions?: Action[];

    /** Optional providers */
    providers?: Provider[];

    /** Optional evaluators */
    evaluators?: Evaluator[];

    /** Optional services */
    services?: Service[];

    /** Optional clients */
    clients?: Client[];
};

/**
 * Available client platforms
 */
export enum Clients {
    DISCORD = "discord",
    DIRECT = "direct",
    TWITTER = "twitter",
    TELEGRAM = "telegram",
    FARCASTER = "farcaster",
}

/**
 * A single piece of information that belongs to a
 *  BillOfMaterials object.
 */
export type BillOfMaterialsLineItem = {

    /** The name of the field.  E.g. - "minting fee". **/
    name: string;

    /** The type of the field.  E.g. - "string", or "number", etc. **/
    type: string;

    /** The question to ask the user to get the desired value from them. **/
    prompt: string;

    /**
     * The default value for the result.  If present, then the LLM
     *  will be given this value to suggest it to the user.
     */
    defaultValue?: BillOfMaterialsResultType;

    // -------------------------- BEGIN: OPTIONAL FIELDS ------------------------

    // These fields are only relevant to OPTIONAL line items.

    /**
     * If FALSE, then the character will ask the user for the field value
     *   but will accept an empty answer as a response.  If TRUE, then
     *   the character will keep trying to get an answer until successful,
     *   or the user abandons the chat.
     */
    isOptional: boolean;

    /** The PRELIMINARY question to ask the user to see if they are
     *   interested or not in this line item, if and only if it is
     *   an optional line item. get the desired value from them.
     */
    preliminaryPromptForOptionalLineItem?: string;

    /**
     * The help text to include that the LLM can use to answer
     *  any questions the user may have about the line item.
     */
    helpDocumentForBomLineItem?: string;


    // -------------------------- END  : OPTIONAL FIELDS ------------------------

    // -------------------------- BEGIN: STRING TYPE ONLY ------------------------

    // The following fields only apply to string type line items.

    // Optional field that if present, must be an array of string values.
    //  If present, then if the user's response value is not in the list
    //  the character will try again to get a valid value.
    listOfValidValues?: string[];

    // -------------------------- END  : STRING TYPE ONLY ------------------------

    // -------------------------- BEGIN: NUMERIC TYPE ONLY ------------------------

    // The following fields only apply to numeric type line items.

    /**
     * If present and has the value TRUE, then the character will work to
     *  obtain, and only accept, an integer value.
     */
    isInteger?: boolean;

    /**
     * If present, then the character will only accept a number value that
     *  is greater than or equal to this value.  This value MUST be less
     *  than the maxVal value if that value exists.
     */
    minVal?: number;

    /**
     * If present, then the character will only accept a number value that
     *  is less than or equal to this value.  This value MUST be greater
     *  than the minVal value if that value exists.
     */
    maxVal?: number;

    /**
     * If present, then this string will be appended to any numeric values
     *  shown to the user (e.g. - "The minimum cost for an NFT is 1 Eth"
     *  where "Eth" would be the unitsDescription value.").
     */
    unitsDescription?: string;

    // -------------------------- END  : NUMERIC TYPE ONLY ------------------------
}

/**
 * Configuration for an agent character
 */
export type Character = {
    /** Optional unique identifier */
    id?: UUID;

    /** Character name */
    name: string;

    /** Optional username */
    username?: string;

    /** Optional system prompt */
    system?: string;

    /** Model provider to use */
    modelProvider: ModelProviderName;

    /** Image model provider to use, if different from modelProvider */
    imageModelProvider?: ModelProviderName;

    /** Optional model endpoint override */
    modelEndpointOverride?: string;

    /**
     * If billOfMaterialsJsonStr has a value when the character is loaded,
     *  then it will be parsed, then validated, into this field.  This
     *  optional field contains a list of the materials that comprise a
     *  character's bill of materials.  If present, it will contain
     *  an array of BillOfMaterialsLineItem objects.
     */
    billOfMaterials?: BillOfMaterialsLineItem[];

    /**
     * If this field has a value,then when the bill-of-materials
     *  goals is completed, control will be switched to the
     *  agent/character that has this value in its "name"
     *  field.
     *
     *  NOTE: This agent/character must be in collection of
     *   available agents that were instantiated when the
     *   client was created!
     */
    switchToCharacterWhenBomComplete?: string;

    /**
     * This is the agent/character that will be switched to
     *  if the user wants to cancel the bill-of-materials
     *  session.
     *
     *  NOTE: This agent/character must be in collection of
     *   available agents that were instantiated when the
     *   client was created!
     */
    switchToCharacterWhenBomSessionCancelled?: string;

    /**
     * This field if present and is equal to FALSE,
     *  will suppress the default behavior of characters
     *  whereby all of their goals are completely reset
     *  when the first get control.  If the field is not
     *  present, or it is TRUE, then the goals will be
     *  reset when the character first receives control.
     */
    resetGoalsOnReceivingControl?: boolean;

    /**
     * Characters can override the default message template by providing
     *  their own.
     */
    messageTemplate?: string;

    /** Optional prompt templates */
    templates?: {
        goalsTemplate?: string;
        factsTemplate?: string;
        messageHandlerTemplate?: string;
        shouldRespondTemplate?: string;
        continueMessageHandlerTemplate?: string;
        evaluationTemplate?: string;
        twitterSearchTemplate?: string;
        twitterPostTemplate?: string;
        twitterMessageHandlerTemplate?: string;
        twitterShouldRespondTemplate?: string;
        farcasterPostTemplate?: string;
        farcasterMessageHandlerTemplate?: string;
        farcasterShouldRespondTemplate?: string;
        telegramMessageHandlerTemplate?: string;
        telegramShouldRespondTemplate?: string;
        discordVoiceHandlerTemplate?: string;
        discordShouldRespondTemplate?: string;
        discordMessageHandlerTemplate?: string;
    };

    /** Character biography */
    bio: string | string[];

    /** Character background lore */
    lore: string[];

    /** Example messages */
    messageExamples: MessageExample[][];

    /** Example posts */
    postExamples: string[];

    /** Known topics */
    topics: string[];

    /** Character traits */
    adjectives: string[];

    /** Optional knowledge base */
    knowledge?: string[];

    /** Supported client platforms */
    clients: Clients[];

    /** Available plugins */
    plugins: Plugin[];

    /** Optional configuration */
    settings?: {
        secrets?: { [key: string]: string };
        buttplug?: boolean;
        voice?: {
            model?: string; // For VITS
            url?: string; // Legacy VITS support
            elevenlabs?: {
                // New structured ElevenLabs config
                voiceId: string;
                model?: string;
                stability?: string;
                similarityBoost?: string;
                style?: string;
                useSpeakerBoost?: string;
            };
        };
        model?: string;
        embeddingModel?: string;
        chains?: {
            evm?: any[];
            solana?: any[];
            [key: string]: any[];
        };
    };

    /** Optional client-specific config */
    clientConfig?: {
        discord?: {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        };
        telegram?: {
            shouldIgnoreBotMessages?: boolean;
            shouldIgnoreDirectMessages?: boolean;
        };
    };

    /** Writing style guides */
    style: {
        all: string[];
        chat: string[];
        post: string[];
    };

    /** Optional Twitter profile */
    twitterProfile?: {
        id: string;
        username: string;
        screenName: string;
        bio: string;
        nicknames?: string[];
    };
};

/**
 * Interface for database operations
 */
export interface IDatabaseAdapter {
    /** Database instance */
    db: any;

    /** Optional initialization */
    init(): Promise<void>;

    /** Close database connection */
    close(): Promise<void>;

    /** Get account by ID */
    getAccountById(userId: UUID): Promise<Account | null>;

    /** Create new account */
    createAccount(account: Account): Promise<boolean>;

    /** Get memories matching criteria */
    getMemories(params: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        tableName: string;
        agentId: UUID;
        start?: number;
        end?: number;
    }): Promise<Memory[]>;

    getMemoryById(id: UUID): Promise<Memory | null>;

    getMemoriesByRoomIds(params: {
        tableName: string;
        agentId: UUID;
        roomIds: UUID[];
    }): Promise<Memory[]>;

    getCachedEmbeddings(params: {
        query_table_name: string;
        query_threshold: number;
        query_input: string;
        query_field_name: string;
        query_field_sub_name: string;
        query_match_count: number;
    }): Promise<{ embedding: number[]; levenshtein_score: number }[]>;

    log(params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void>;

    getActorDetails(params: { roomId: UUID }): Promise<Actor[]>;

    searchMemories(params: {
        tableName: string;
        agentId: UUID;
        roomId: UUID;
        embedding: number[];
        match_threshold: number;
        match_count: number;
        unique: boolean;
    }): Promise<Memory[]>;

    updateGoalStatus(params: {
        goalId: UUID;
        status: GoalStatus;
    }): Promise<void>;

    searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
            roomId?: UUID;
            agentId?: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]>;

    createMemory(
        memory: Memory,
        tableName: string,
        unique?: boolean
    ): Promise<void>;

    removeMemory(memoryId: UUID, tableName: string): Promise<void>;

    removeAllMemories(roomId: UUID, tableName: string): Promise<void>;

    countMemories(
        roomId: UUID,
        unique?: boolean,
        tableName?: string
    ): Promise<number>;

    getGoalsByRelationship(params: {
        agentId: UUID;
        userId: UUID;
        name?: string;
        goalStatus?: string;
        count?: number;
    }): Promise<Goal[]>;

    removeGoalsByRelationship(params: {
        agentId: UUID;
        userId: UUID;
        name?: string;
        goalStatus?: string;
    }): Promise<void>;

    getGoals(params: {
        agentId: UUID;
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]>;

    updateGoal(goal: Goal): Promise<void>;

    createGoal(goal: Goal): Promise<void>;

    removeGoal(goalId: UUID): Promise<void>;

    removeAllGoals(roomId: UUID): Promise<void>;

    getRoom(roomId: UUID): Promise<UUID | null>;

    createRoom(roomId?: UUID): Promise<UUID>;

    removeRoom(roomId: UUID): Promise<void>;

    getRoomsForParticipant(userId: UUID): Promise<UUID[]>;

    getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]>;

    addParticipant(userId: UUID, roomId: UUID): Promise<boolean>;

    removeParticipant(userId: UUID, roomId: UUID): Promise<boolean>;

    getParticipantsForAccount(userId: UUID): Promise<Participant[]>;

    getParticipantsForRoom(roomId: UUID): Promise<UUID[]>;

    getParticipantUserState(
        roomId: UUID,
        userId: UUID
    ): Promise<"FOLLOWED" | "MUTED" | null>;

    setParticipantUserState(
        roomId: UUID,
        userId: UUID,
        state: "FOLLOWED" | "MUTED" | null
    ): Promise<void>;

    createRelationship(params: { userA: UUID; userB: UUID }): Promise<boolean>;

    removeRelationship(params: {userA: UUID, userB: UUID}): Promise<boolean>;

    removeAllRelationships(params: { userA: UUID}): Promise<boolean>;

    getRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<Relationship | null>;

    getRelationships(params: { userId: UUID }): Promise<Relationship[]>;
}

export interface IDatabaseCacheAdapter {
    getCache(params: {
        agentId: UUID;
        key: string;
    }): Promise<string | undefined>;

    setCache(params: {
        agentId: UUID;
        key: string;
        value: string;
    }): Promise<boolean>;

    deleteCache(params: { agentId: UUID; key: string }): Promise<boolean>;
}

export interface IMemoryManager {
    runtime: IAgentRuntime;
    tableName: string;
    constructor: Function;

    addEmbeddingToMemory(memory: Memory): Promise<Memory>;

    getMemories(opts: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        start?: number;
        end?: number;
    }): Promise<Memory[]>;

    getCachedEmbeddings(
        content: string
    ): Promise<{ embedding: number[]; levenshtein_score: number }[]>;

    getMemoryById(id: UUID): Promise<Memory | null>;
    getMemoriesByRoomIds(params: { roomIds: UUID[] }): Promise<Memory[]>;
    searchMemoriesByEmbedding(
        embedding: number[],
        opts: {
            match_threshold?: number;
            count?: number;
            roomId: UUID;
            unique?: boolean;
        }
    ): Promise<Memory[]>;

    createMemory(memory: Memory, unique?: boolean): Promise<void>;

    removeMemory(memoryId: UUID): Promise<void>;

    removeAllMemories(roomId: UUID): Promise<void>;

    countMemories(roomId: UUID, unique?: boolean): Promise<number>;
}

export type CacheOptions = {
    expires?: number;
};

export interface ICacheManager {
    get<T = unknown>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    delete(key: string): Promise<void>;
}

export abstract class Service {
    private static instance: Service | null = null;

    static get serviceType(): ServiceType {
        throw new Error("Service must implement static serviceType getter");
    }

    public static getInstance<T extends Service>(): T {
        if (!Service.instance) {
            Service.instance = new (this as any)();
        }
        return Service.instance as T;
    }

    get serviceType(): ServiceType {
        return (this.constructor as typeof Service).serviceType;
    }

    // Add abstract initialize method that must be implemented by derived classes
    abstract initialize(runtime: IAgentRuntime): Promise<void>;
}

export interface IAgentRuntime {
    // Properties
    agentId: UUID;
    serverUrl: string;
    databaseAdapter: IDatabaseAdapter;
    token: string | null;
    modelProvider: ModelProviderName;
    imageModelProvider: ModelProviderName;
    character: Character;
    providers: Provider[];
    actions: Action[];
    evaluators: Evaluator[];
    plugins: Plugin[];

    messageManager: IMemoryManager;
    descriptionManager: IMemoryManager;
    documentsManager: IMemoryManager;
    knowledgeManager: IMemoryManager;
    loreManager: IMemoryManager;

    cacheManager: ICacheManager;

    services: Map<ServiceType, Service>;

    initialize(): Promise<void>;

    registerMemoryManager(manager: IMemoryManager): void;

    getMemoryManager(name: string): IMemoryManager | null;

    getService<T extends Service>(service: ServiceType): T | null;

    registerService(service: Service): void;

    getSetting(key: string): string | null;

    // Methods
    getConversationLength(): number;

    processActions(
        message: Memory,
        responses: Memory[],
        state?: State,
        callback?: HandlerCallback
    ): Promise<void>;

    evaluate(
        message: Memory,
        state?: State,
        didRespond?: boolean
    ): Promise<string[]>;

    ensureParticipantExists(userId: UUID, roomId: UUID): Promise<void>;

    ensureUserExists(
        userId: UUID,
        userName: string | null,
        name: string | null,
        source: string | null
    ): Promise<void>;

    registerAction(action: Action): void;

    ensureConnection(
        userId: UUID,
        roomId: UUID,
        userName?: string,
        userScreenName?: string,
        source?: string
    ): Promise<void>;

    ensureParticipantInRoom(userId: UUID, roomId: UUID): Promise<void>;

    ensureRoomExists(roomId: UUID): Promise<void>;

    composeState(
        message: Memory,
        additionalKeys?: { [key: string]: unknown }
    ): Promise<State>;

    updateRecentMessageState(state: State): Promise<State>;
}

export interface IImageDescriptionService extends Service {
    describeImage(
        imageUrl: string
    ): Promise<{ title: string; description: string }>;
}

export interface ITranscriptionService extends Service {
    transcribeAttachment(audioBuffer: ArrayBuffer): Promise<string | null>;
    transcribeAttachmentLocally(
        audioBuffer: ArrayBuffer
    ): Promise<string | null>;
    transcribe(audioBuffer: ArrayBuffer): Promise<string | null>;
    transcribeLocally(audioBuffer: ArrayBuffer): Promise<string | null>;
}

export interface IVideoService extends Service {
    isVideoUrl(url: string): boolean;
    fetchVideoInfo(url: string): Promise<Media>;
    downloadVideo(videoInfo: Media): Promise<string>;
    processVideo(url: string, runtime: IAgentRuntime): Promise<Media>;
}

export interface ITextGenerationService extends Service {
    initializeModel(): Promise<void>;
    queueMessageCompletion(
        context: string,
        temperature: number,
        stop: string[],
        frequency_penalty: number,
        presence_penalty: number,
        max_tokens: number
    ): Promise<any>;
    queueTextCompletion(
        context: string,
        temperature: number,
        stop: string[],
        frequency_penalty: number,
        presence_penalty: number,
        max_tokens: number
    ): Promise<string>;
    getEmbeddingResponse(input: string): Promise<number[] | undefined>;
}

export interface IBrowserService extends Service {
    closeBrowser(): Promise<void>;
    getPageContent(
        url: string,
        runtime: IAgentRuntime
    ): Promise<{ title: string; description: string; bodyContent: string }>;
}

export interface ISpeechService extends Service {
    getInstance(): ISpeechService;
    generate(runtime: IAgentRuntime, text: string): Promise<Readable>;
}

export interface IPdfService extends Service {
    getInstance(): IPdfService;
    convertPdfToText(pdfBuffer: Buffer): Promise<string>;
}

export type SearchResult = {
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content: string | null;
};

export type SearchResponse = {
    query: string;
    follow_up_questions: string[] | null;
    answer: string | null;
    images: string[];
    results: SearchResult[];
    response_time: number;
};

export enum ServiceType {
    IMAGE_DESCRIPTION = "image_description",
    TRANSCRIPTION = "transcription",
    VIDEO = "video",
    TEXT_GENERATION = "text_generation",
    BROWSER = "browser",
    SPEECH_GENERATION = "speech_generation",
    PDF = "pdf",
    BUTTPLUG = "buttplug",
}

export enum LoggingLevel {
    DEBUG = "debug",
    VERBOSE = "verbose",
    NONE = "none",
}

export type KnowledgeItem = {
    id: UUID;
    content: Content;
};

/**
 * Simple type to bind together the full user and character ID pair
 *  that comprises a user to agent/character relationship.
 */
export type FullUserIdCharacterIdPair = {
    // The full user ID comprised of the room ID prefixed to the
    //  user ID with a delimiter.
    fullUserId: UUID;
    // The full character ID comprised of the room ID prefixed to the
    //  character name with a delimiter.  The character name is wrapped
    //  by a constant prefix and then encased in parentheses to avoid
    //  potential conflicts with other ID types.
    fullCharacterId: UUID;
}

