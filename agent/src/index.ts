// Agent level index file.

import { AutoClientInterface } from "@ai16z/client-auto";
import {DirectClient, DirectClientInterface, findAgentAssignedToUser} from "@ai16z/client-direct";
import { DiscordClientInterface } from "@ai16z/client-discord";
import { TelegramClientInterface } from "@ai16z/client-telegram";
import { TwitterClientInterface } from "@ai16z/client-twitter";
import { FarcasterAgentClient } from "@ai16z/client-farcaster";
import {
    AgentRuntime,
    CacheManager,
    Character,
    Clients,
    DbCacheAdapter,
    FsCacheAdapter,
    IAgentRuntime,
    ICacheManager,
    IDatabaseAdapter,
    IDatabaseCacheAdapter,
    ModelProviderName,
    defaultCharacter,
    elizaLogger,
    settings,
    stringToUuid,
    validateCharacterConfig,
    USER_A_ID_FOR_RELATIONSHIP_WITH_LOCALHOST_USER_ID, UUID, JOKER_UUID_AS_ROOMS_ID_WILDCARD,
} from "@ai16z/eliza";
import { zgPlugin } from "@ai16z/plugin-0g";
import { goatPlugin } from "@ai16z/plugin-goat";
import { bootstrapPlugin } from "@ai16z/plugin-bootstrap";
// import { buttplugPlugin } from "@ai16z/plugin-buttplug";
import {
    coinbaseCommercePlugin,
    coinbaseMassPaymentsPlugin,
    tradePlugin,
    tokenContractPlugin,
    webhookPlugin,
    advancedTradePlugin,
} from "@ai16z/plugin-coinbase";
import { confluxPlugin } from "@ai16z/plugin-conflux";
import { imageGenerationPlugin } from "@ai16z/plugin-image-generation";
import { evmPlugin } from "@ai16z/plugin-evm";
import { createNodePlugin } from "@ai16z/plugin-node";
import { solanaPlugin } from "@ai16z/plugin-solana";
import { aptosPlugin, TransferAptosToken } from "@ai16z/plugin-aptos";
import { flowPlugin } from "@ai16z/plugin-flow";
import { storyPlugin } from "@ai16z/plugin-story";
import { teePlugin } from "@ai16z/plugin-tee";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import pilTermsPlugin from "@ai16z/plugin-pilterms";
import {prepareDatabase} from "./database-helpers.ts";
import {isAllStrings, parseArguments, tryLoadFile} from "./utils.ts";
import {v4} from "uuid";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

// The name of the agent/character assigned to the current user (if any).
let g_NameOfAssignedCharacter = null;

// The user ID dynamically created for the localhost user.
let g_LocalhostUserId = null;

/**
 * Load the characters specified by the user for the system, using
 *  defaults if none were specified.
 *
 * @param charactersArg - A list of characters to process, may be empty.
 */
export async function loadCharacters(
    charactersArg: string
): Promise<Character[]> {
    let characterPaths = charactersArg
        ?.split(",")
        .map((filePath) => filePath.trim());
    const loadedCharacters = [];

    if (characterPaths?.length > 0) {
        for (const characterPath of characterPaths) {
            let content = null;
            let resolvedPath = "";

            // Try different path resolutions in order
            const pathsToTry = [
                characterPath, // exact path as specified
                path.resolve(process.cwd(), characterPath), // relative to cwd
                path.resolve(process.cwd(), "agent", characterPath), // Add this
                path.resolve(__dirname, characterPath), // relative to current script
                path.resolve(
                    __dirname,
                    "characters",
                    path.basename(characterPath)
                ), // relative to agent/characters
                path.resolve(
                    __dirname,
                    "../characters",
                    path.basename(characterPath)
                ), // relative to characters dir from agent
                path.resolve(
                    __dirname,
                    "../../characters",
                    path.basename(characterPath)
                ), // relative to project root characters dir
            ];

            elizaLogger.info(
                "Trying paths:",
                pathsToTry.map((p) => ({
                    path: p,
                    exists: fs.existsSync(p),
                }))
            );

            for (const tryPath of pathsToTry) {
                content = tryLoadFile(tryPath);
                if (content !== null) {
                    resolvedPath = tryPath;
                    break;
                }
            }

            if (content === null) {
                elizaLogger.error(
                    `Error loading character from ${characterPath}: File not found in any of the expected locations`
                );
                elizaLogger.error("Tried the following paths:");
                pathsToTry.forEach((p) => elizaLogger.error(` - ${p}`));
                process.exit(1);
            }

            try {
                // Parse the content into an object that meets the
                //  CharacterConfig(inferred::CharacterSchema) schema.
                const character = JSON.parse(content);

                // Make sure it validates against the schema.
                validateCharacterConfig(character);

                // Handle plugins
                if (isAllStrings(character.plugins)) {
                    elizaLogger.info("Plugins are: ", character.plugins);
                    const importedPlugins = await Promise.all(
                        character.plugins.map(async (plugin) => {
                            const importedPlugin = await import(plugin);
                            return importedPlugin.default;
                        })
                    );
                    character.plugins = importedPlugins;
                }

                // Move processFileOrUrlReferences() to the client to facilitate
                //  hot-load character content.
                loadedCharacters.push(character);
                elizaLogger.info(
                    `Successfully loaded character from: ${resolvedPath}`
                );
            } catch (e) {
                elizaLogger.error(
                    `Error parsing character from ${resolvedPath}: ${e}`
                );
                process.exit(1);
            }
        }
    }

    if (loadedCharacters.length === 0) {
        elizaLogger.info("No characters found, using default character");
        loadedCharacters.push(defaultCharacter);
    }

    return loadedCharacters;
}

export function getTokenForProvider(
    provider: ModelProviderName,
    character: Character
) {
    switch (provider) {
        case ModelProviderName.OPENAI:
            return (
                character.settings?.secrets?.OPENAI_API_KEY ||
                settings.OPENAI_API_KEY
            );
        case ModelProviderName.ETERNALAI:
            return (
                character.settings?.secrets?.ETERNALAI_API_KEY ||
                settings.ETERNALAI_API_KEY
            );
        case ModelProviderName.LLAMACLOUD:
        case ModelProviderName.TOGETHER:
            return (
                character.settings?.secrets?.LLAMACLOUD_API_KEY ||
                settings.LLAMACLOUD_API_KEY ||
                character.settings?.secrets?.TOGETHER_API_KEY ||
                settings.TOGETHER_API_KEY ||
                character.settings?.secrets?.XAI_API_KEY ||
                settings.XAI_API_KEY ||
                character.settings?.secrets?.OPENAI_API_KEY ||
                settings.OPENAI_API_KEY
            );
        case ModelProviderName.ANTHROPIC:
            return (
                character.settings?.secrets?.ANTHROPIC_API_KEY ||
                character.settings?.secrets?.CLAUDE_API_KEY ||
                settings.ANTHROPIC_API_KEY ||
                settings.CLAUDE_API_KEY
            );
        case ModelProviderName.REDPILL:
            return (
                character.settings?.secrets?.REDPILL_API_KEY ||
                settings.REDPILL_API_KEY
            );
        case ModelProviderName.OPENROUTER:
            return (
                character.settings?.secrets?.OPENROUTER ||
                settings.OPENROUTER_API_KEY
            );
        case ModelProviderName.GROK:
            return (
                character.settings?.secrets?.GROK_API_KEY ||
                settings.GROK_API_KEY
            );
        case ModelProviderName.HEURIST:
            return (
                character.settings?.secrets?.HEURIST_API_KEY ||
                settings.HEURIST_API_KEY
            );
        case ModelProviderName.GROQ:
            return (
                character.settings?.secrets?.GROQ_API_KEY ||
                settings.GROQ_API_KEY
            );
        case ModelProviderName.GALADRIEL:
            return (
                character.settings?.secrets?.GALADRIEL_API_KEY ||
                settings.GALADRIEL_API_KEY
            );
        case ModelProviderName.FAL:
            return (
                character.settings?.secrets?.FAL_API_KEY || settings.FAL_API_KEY
            );
        case ModelProviderName.ALI_BAILIAN:
            return (
                character.settings?.secrets?.ALI_BAILIAN_API_KEY ||
                settings.ALI_BAILIAN_API_KEY
            );
        case ModelProviderName.VOLENGINE:
            return (
                character.settings?.secrets?.VOLENGINE_API_KEY ||
                settings.VOLENGINE_API_KEY
            );
    }
}


export async function initializeClients(
    character: Character,
    runtime: IAgentRuntime
) {
    const clients = [];
    const clientTypes =
        character.clients?.map((str) => str.toLowerCase()) || [];

    if (clientTypes.includes("auto")) {
        const autoClient = await AutoClientInterface.start(runtime);
        if (autoClient) clients.push(autoClient);
    }

    if (clientTypes.includes("discord")) {
        clients.push(await DiscordClientInterface.start(runtime));
    }

    if (clientTypes.includes("telegram")) {
        const telegramClient = await TelegramClientInterface.start(runtime);
        if (telegramClient) clients.push(telegramClient);
    }

    if (clientTypes.includes("twitter")) {
        const twitterClients = await TwitterClientInterface.start(runtime);
        clients.push(twitterClients);
    }

    if (clientTypes.includes("farcaster")) {
        const farcasterClients = new FarcasterAgentClient(runtime);
        farcasterClients.start();
        clients.push(farcasterClients);
    }

    if (character.plugins?.length > 0) {
        for (const plugin of character.plugins) {
            if (plugin.clients) {
                for (const client of plugin.clients) {
                    clients.push(await client.start(runtime));
                }
            }
        }
    }

    return clients;
}

function getSecret(character: Character, secret: string) {
    return character.settings.secrets?.[secret] || process.env[secret];
}

let nodePlugin: any | undefined;

export function createAgent(
    character: Character,
    db: IDatabaseAdapter,
    cache: ICacheManager,
    token: string
) {
    elizaLogger.success(
        elizaLogger.successesTitle,
        "Creating runtime for character",
        character.name
    );

    nodePlugin ??= createNodePlugin();

    return new AgentRuntime({
        databaseAdapter: db,
        token,
        modelProvider: character.modelProvider,
        evaluators: [],
        character,
        plugins: [
            bootstrapPlugin,
            pilTermsPlugin,
            getSecret(character, "CONFLUX_CORE_PRIVATE_KEY")
                ? confluxPlugin
                : null,
            nodePlugin,
            getSecret(character, "SOLANA_PUBLIC_KEY") ||
            (getSecret(character, "WALLET_PUBLIC_KEY") &&
                !getSecret(character, "WALLET_PUBLIC_KEY")?.startsWith("0x"))
                ? solanaPlugin
                : null,
            getSecret(character, "EVM_PRIVATE_KEY") ||
            (getSecret(character, "WALLET_PUBLIC_KEY") &&
                !getSecret(character, "WALLET_PUBLIC_KEY")?.startsWith("0x"))
                ? evmPlugin
                : null,
            getSecret(character, "ZEROG_PRIVATE_KEY") ? zgPlugin : null,
            getSecret(character, "COINBASE_COMMERCE_KEY")
                ? coinbaseCommercePlugin
                : null,
            getSecret(character, "FAL_API_KEY") ||
            getSecret(character, "OPENAI_API_KEY") ||
            getSecret(character, "HEURIST_API_KEY")
                ? imageGenerationPlugin
                : null,
            ...(getSecret(character, "COINBASE_API_KEY") &&
            getSecret(character, "COINBASE_PRIVATE_KEY")
                ? [
                    coinbaseMassPaymentsPlugin,
                    tradePlugin,
                    tokenContractPlugin,
                    advancedTradePlugin,
                ]
                : []),
            getSecret(character, "COINBASE_API_KEY") &&
            getSecret(character, "COINBASE_PRIVATE_KEY") &&
            getSecret(character, "COINBASE_NOTIFICATION_URI")
                ? webhookPlugin
                : null,
            getSecret(character, "WALLET_SECRET_SALT") ? teePlugin : null,
            getSecret(character, "ALCHEMY_API_KEY") ? goatPlugin : null,
            getSecret(character, "FLOW_ADDRESS") &&
            getSecret(character, "FLOW_PRIVATE_KEY")
                ? flowPlugin
                : null,
            getSecret(character, "APTOS_PRIVATE_KEY") ? aptosPlugin : null,
            getSecret(character, "STORY_PRIVATE_KEY") ? storyPlugin : null,
        ].filter(Boolean),
        providers: [],
        actions: [],
        services: [],
        managers: [],
        cacheManager: cache,
    });
}

function initializeFsCache(baseDir: string, character: Character) {
    const cacheDir = path.resolve(baseDir, character.id, "cache");

    const cache = new CacheManager(new FsCacheAdapter(cacheDir));
    return cache;
}

function intializeDbCache(character: Character, db: IDatabaseCacheAdapter) {
    const cache = new CacheManager(new DbCacheAdapter(db, character.id));
    return cache;
}

/**
 * This function looks for a user ID to use for the localhost
 *  user in the database.  If not found, one is created, stored
 *  and returned.
 *   */
async function getOrCreateLocalHostUserId(agentObj: IAgentRuntime): Promise<UUID> {
    const errPrefix = `(getOrCreateLocalHostUserId) `;

    // Do we already have a user ID for the localhost user?
    let relationships =
        await agentObj.databaseAdapter.getRelationships(
            {
                userId: USER_A_ID_FOR_RELATIONSHIP_WITH_LOCALHOST_USER_ID as UUID
            }
        );

    let localhostUserId = null;

    if (Array.isArray(relationships) && relationships.length > 0) {
        // Take the userB field from the first element as the
        //  localhost user ID.
        localhostUserId = relationships[0].userB;
    } else {
        // No existing user ID for the localhost user.  Create one now.
        localhostUserId = v4() as UUID;

        // Create a relationship using the "fake" user ID we actually
        //  use as a lookup key as the userA value, and the newly
        //  created user ID as the userB value.
        await agentObj.databaseAdapter.createRelationship(
            {
                userA: USER_A_ID_FOR_RELATIONSHIP_WITH_LOCALHOST_USER_ID,
                userB: localhostUserId
            }
        );
    }

    if (!localhostUserId) {
        throw new Error(`${errPrefix}Failed to create a local host user ID.`);
    }

    return localhostUserId;
}

/**
 * Start an agent using the specified character and client.
 *
 * @param character - The desired character.
 * @param directClient - The desired direct client.
 *
 * @return {Promise<any[]>}  - Returns an array of the
 *  available clients for use with this agent.
 */
async function startAgent(character: Character, directClient) {
    let db: IDatabaseAdapter & IDatabaseCacheAdapter;
    try {
        character.id ??= stringToUuid(character.name);
        character.username ??= character.name;

        const token = getTokenForProvider(character.modelProvider, character);

        // Prepare a shared database for use for this agent.
        db = await prepareDatabase();

        // Create a cache for the database to speed up database operations.
        const cache = intializeDbCache(character, db);

        // Create an AgentRuntime object to represent the agent.
        const runtime = createAgent(character, db, cache, token);

        await runtime.initialize();

        const clients = await initializeClients(character, runtime);

        // Register the agent so the rest of the code base can interact with
        //  it easily.
        directClient.registerAgent(runtime);

        return clients;
    } catch (error) {
        elizaLogger.error(
            `Error starting agent for character ${character.name}:`,
            error
        );
        console.error(error);
        if (db) {
            await db.close();
        }
        throw error;
    }
}

/**
 * Extracts the value of the first command-line
 *  argument starting with "--character",
 *  splits it into an array by commas, removes
 *  double quotes, and trims each element.
 *
 * @returns {string[] | null} An array of
 *   processed character strings if a suitable
 *   command line argument was found, or
 *   null if not.
 */
const failsafeFindCharactersArg = (): string[] | null => {
    // Initialize the variable to null
    let failsafeFindCharactersRaw: string | null = null;

    // Look for the first argument starting with "--character"
    const argPrefix = "--character";
    for (const arg of process.argv) {
        if (arg.startsWith(argPrefix)) {
            const [, value] = arg.split("=");
            failsafeFindCharactersRaw = value || null;
            break;
        }
    }

    // Process the argument if it is not null
    if (failsafeFindCharactersRaw !== null) {
        const failsafeCharactersFound = failsafeFindCharactersRaw.split(",")
            .map(char => char.replace(/"/g, "").trim());
        return failsafeCharactersFound.length > 0 ? failsafeCharactersFound : null;
    }

    // Return null if no valid argument or empty result
    return null;
};

const startAgents = async () => {
    const directClient: DirectClient =
        await DirectClientInterface.start() as DirectClient;

    const args = parseArguments();

    let charactersArg = args.characters || args.character;

    // We make a failsafe attempt to find the
    //  characters command line argument in case
    //  the current execution context is different
    //  from what parseArguments() expected.
    if (!charactersArg)
    {
        const failsafeCharactersFound =
            failsafeFindCharactersArg();

        if (failsafeCharactersFound) {
            // loadCharacters() expects a comma
            //  delimited string.
            charactersArg = failsafeCharactersFound.join(",");
        }
    }

    let characters = [defaultCharacter];

    if (charactersArg) {
        characters = await loadCharacters(charactersArg);
    }

    try {
        for (const character of characters) {
            await startAgent(character, directClient);
        }
    } catch (error) {
        elizaLogger.error("Error starting agents:", error);
    }

    // -------------------------- BEGIN: GET/CREATE LOCALHOST USER ID ------------------------

    // Get the first registered agent, solely to take advantage of its
    //  database interface, since it is a shared interface across
    //  the agents.
    const utilityAgent = directClient.getFirstAgent();

    // Get or create a dynamically created user ID for the local host
    //  user.
    g_LocalhostUserId = await getOrCreateLocalHostUserId(utilityAgent);

    // See if we have a current agent/character to user assignment.
    //  We use the "joker" room ID because the direct client
    g_NameOfAssignedCharacter =
        await findAgentAssignedToUser(directClient.roomId, g_LocalhostUserId, directClient.agents);


    // -------------------------- END  : GET/CREATE LOCALHOST USER ID ------------------------

    function chat() {
        const agentName = g_NameOfAssignedCharacter ?? characters[0].name ?? "Agent";

        rl.question(`${agentName} -> You: `, async (input) => {
            await handleUserInput(directClient.roomId, input, agentName);

            if (input.toLowerCase() !== "exit") {
                chat(); // Loop back to ask another question
            }
        });
    }

    elizaLogger.log("Chat started. Type 'exit' to quit.");

    if (!args["non-interactive"]) {
        chat();
    }
};

startAgents().catch((error) => {
    // The current elizaLogger code has a problem with certain errors whereby
    //  the error strings don't print correctly.  So that is why we
    //  have our own error printing here.
    if (typeof error.message === 'string') {
        console.error(`Error during startAgents(): ${error.message}`);
    }

    if (typeof error.stack === 'string') {
        console.error(`Stack: ${error.stack}`);
    }

    elizaLogger.error("Unhandled error in startAgents:", error);
    process.exit(1); // Exit the process after logging
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Make the call to our local Eliza agent server using the given parameters.
 *
 * @param roomId - The current room ID
 * @param input - The user input
 * @param agentId - The ID of the agent that should handle the chat volley.
 */
async function handleUserInput(roomId: string, input: string, agentId: string) {
    const errPrefix = `(handleUserInput) `;

    if (roomId.trim().length === 0) {
        throw new Error(`${errPrefix}The roomId parameter is empty.`);
    }
    if (input.trim().length === 0) {
        throw new Error(`${errPrefix}The input parameter is empty.`);
    }
    if (agentId.trim().length === 0) {
        throw new Error(`${errPrefix}The agentId parameter is empty.`);
    }

    if (input.toLowerCase() === "exit") {
        gracefulExit();
    }

    try {
        const serverPort = parseInt(settings.SERVER_PORT || "3000");

        const response = await fetch(
            `http://localhost:${serverPort}/${agentId}/message`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: input,
                    userId: USER_A_ID_FOR_RELATIONSHIP_WITH_LOCALHOST_USER_ID,
                    userName: "User",
                    roomId: roomId
                }),
            }
        );

        const data = await response.json();
        data.forEach((message) =>
            elizaLogger.log(`${"Agent"}: ${message.text}`)
        );
    } catch (error) {
        console.error("Error fetching response:", error);
    }
}

async function gracefulExit() {
    elizaLogger.log("Terminating and cleaning up resources...");
    rl.close();
    process.exit(0);
}

rl.on("SIGINT", gracefulExit);
rl.on("SIGTERM", gracefulExit);
