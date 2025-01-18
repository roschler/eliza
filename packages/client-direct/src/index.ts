import bodyParser from "body-parser";
import cors from "cors";
import express, { Request as ExpressRequest } from "express";
import multer, { File } from "multer";
import {
    IAgentRuntimeOrNull,
    elizaLogger,
    generateCaption,
    generateImage,
    UUID,
    FullUserIdCharacterIdPair,
    buildRelationshipIdPair,
    GoalOrNull,
    GoalStatus,
    isRelated,
    JOKER_UUID_AS_ROOMS_ID_WILDCARD,
    setExclusiveUserToCharacterRelationship,
    isUuid,
    createEndSessionMemory, shallowCloneCharacter
} from "@ai16z/eliza";
import { composeContext } from "@ai16z/eliza";
import { generateMessageResponse } from "@ai16z/eliza";
import { AgentRuntime, Goal } from "@ai16z/eliza";
import {GOAL_NAME_BILL_OF_MATERIALS, resetBomGoalsForRelationship} from "@ai16z/plugin-pilterms";
import {
    Content,
    Memory,
    ModelClass,
    Client,
    IAgentRuntime,
} from "@ai16z/eliza";
import { stringToUuid } from "@ai16z/eliza";
import { settings } from "@ai16z/eliza";
import { createApiRouter } from "./api.ts";
import * as fs from "fs";
import * as path from "path";
import {processFileOrUrlReferences} from "./process-external-references.ts";
import {
    buildBillOfMaterialQuestion, determineBomQuestionResult,
    getNextBomObjective,
    isBomAgentCharacter,
    messageHandlerTemplate
} from "./bill-of-materials.ts";
import {CLIENT_NAME} from "./common.ts";
const upload = multer({ storage: multer.memoryStorage() });

/**
 * This function searches the agents registry to see if a specific
 *  agent was assigned to the given user in the given room.
 *
 * @param roomId - The ID of the current room.
 * @param userId - The ID of the user.
 * @param agentsMap - A map of the available agents.
 */
export async function findAgentAssignedToUser(
    roomId: UUID,
    userId: UUID,
    agentsMap: Map<string, AgentRuntime>): Promise<IAgentRuntimeOrNull> {

    // Create an array of Promises for the database asynchronous calls
    const promises: Promise<IAgentRuntimeOrNull>[] = [];

    for (const agentObj of agentsMap.values()) {
        // Push each asynchronous call into the promises array
        promises.push(
            isRelated(roomId, userId, agentObj)
        );
    }

    const results = await Promise.all(promises);

    // Take the first agent assigned, if any assignments exist,
    //  and return it.  Or return NULL if no assignment exists.
    let agentFoundOrNull: IAgentRuntimeOrNull = null;

    // Find the first result that is an AgentRuntime object
    agentFoundOrNull =
        results.find(
            (result: IAgentRuntimeOrNull): result is AgentRuntime => result !== null) || null;

    return agentFoundOrNull;
}

export class DirectClient {
    public app: express.Application;
    public agents: Map<string, AgentRuntime>;

    // We use the "catch-all" joker ID as a room ID for all clients.
    public roomId: UUID = JOKER_UUID_AS_ROOMS_ID_WILDCARD as UUID;

    private server: any; // Store server instance

    constructor() {
        elizaLogger.log("DirectClient constructor");
        this.app = express();
        this.app.use(cors());
        this.agents = new Map();

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        const apiRouter = createApiRouter(this.agents);
        this.app.use(apiRouter);

        // Define an interface that extends the Express Request interface
        interface CustomRequest extends ExpressRequest {
            file: File;
        }

        // Update the route handler to use CustomRequest instead of express.Request
        this.app.post(
            "/:agentId/whisper",
            upload.single("file"),
            async (req: CustomRequest, res: express.Response) => {
                const audioFile = req.file; // Access the uploaded file using req.file
                const agentId = req.params.agentId;

                if (!audioFile) {
                    res.status(400).send("No audio file provided");
                    return;
                }

                let runtime = this.agents.get(agentId);

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const formData = new FormData();
                const audioBlob = new Blob([audioFile.buffer], {
                    type: audioFile.mimetype,
                });
                formData.append("file", audioBlob, audioFile.originalname);
                formData.append("model", "whisper-1");

                const response = await fetch(
                    "https://api.openai.com/v1/audio/transcriptions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${runtime.token}`,
                        },
                        body: formData,
                    }
                );

                const data = await response.json();
                res.json(data);
            }
        );

        this.app.post(
            "/:agentId/message",
            async (req: express.Request, res: express.Response) => {
                const errPrefix = `(/:agentId/message) `;

                /**
                 * Check for the existence of a main bill-of-materials goal for
                 *  the current relationship that is marked as IN_PROGRESS.
                 *
                 *  @param runtime - The current agent/character.
                 *  @param relationshipIdPair - The room ID prepended full user ID
                 *   and agent/character ID that forms the relationship.
                 *
                 *  @returns - Returns the active bill-of-materials goal for the
                 *   current relationship if one exists, NULL if not.
                 */
                async function checkForMainBomGoal(runtime: IAgentRuntime, relationshipIdPair: FullUserIdCharacterIdPair): Promise<GoalOrNull> {
                    const errPrefix = '(checkForMainBomGoal) ';

                    let retGoalOrNull: GoalOrNull = null;

                    if (relationshipIdPair.fullUserId.length === 0)
                        throw new Error(`${errPrefix} The full user ID is empty.`);
                    if (relationshipIdPair.fullCharacterId.length === 0)
                        throw new Error(`${errPrefix} The full character ID is empty.`);

                    // Find all the bill-of-materials goals belonging to this
                    //  user to agent/character relationship that is still
                    //  in progress.
                    const bomGoalsFound =
                        await runtime.databaseAdapter.getGoalsByRelationship(
                            {
                                agentId: relationshipIdPair.fullCharacterId,
                                userId: relationshipIdPair.fullUserId,
                                name: GOAL_NAME_BILL_OF_MATERIALS,
                                goalStatus: GoalStatus.IN_PROGRESS,
                            }
                        );

                    if (!Array.isArray(bomGoalsFound))
                        throw new Error(`The return from getGoalsByRelationship was not an array.`);

                    // We should only have 1 main goal for a particular agent/character
                    //  name.  If there is more than 1 then, the ensuing results
                    //  are unpredictable.
                    if (bomGoalsFound.length > 1)
                        throw new Error(`More than one goal was returned from getGoalsByRelationship.  Only one or none is expected.`);

                    if (bomGoalsFound.length > 0) {
                        elizaLogger.debug(`An existing goal was found for agent/character: ${runtime.character.name}`);

                        // Use the existing goal.
                        retGoalOrNull = bomGoalsFound[0];
                    } else {
                        elizaLogger.debug(`No existing goals found for agent/character: ${runtime.character.name}`);
                    }

                    return retGoalOrNull;
                }  // checkForMainBomGoal()

                try {
                    const agentId = req.params.agentId;
                    const trimmedRoomIdInBody = req.body.roomId?.trim();

                    // If the incoming room ID is already a UUID, use it as is.
                    //  Otherwise, build one dynamically from the incoming
                    //  room ID, falling back to a "default" value built
                    //  from the agent ID if the incoming room ID is empty.
                    const strRoomId =
                        isUuid(trimmedRoomIdInBody)
                            ? trimmedRoomIdInBody
                            : stringToUuid(trimmedRoomIdInBody ?? "default-room-" + agentId);

                    const roomId = strRoomId as UUID;

                    const userId = stringToUuid(req.body.userId ?? "user");
                    const userInput = req.body.text.trim();

                    // TODO: Until we create a more sophisticated way to reset a session
                    //  with a user to the "start" condition, we look for a simple "reset"
                    //  statement to do this.  If found then we do not override the
                    //  the default choice which in the direct client, is the first
                    //  available agent.
                    const bIsResetCommand = userInput === 'reset';

                    let mainBomGoal: Goal | null = null;

                    if (bIsResetCommand)
                        elizaLogger.debug(`Direct client message route received a RESET instruction.`);

                    // Initialize the runtime to the first agent created with the system.
                    //  That is considered the "starting" agent.
                    let runtime = this.agents.get(agentId);

                    // if runtime is null, look for runtime with the same ID/name
                    //  as that this API route was called with, if one was
                    //  provided in the route parameters.
                    if (!runtime && agentId.trim().length > 0) {
                        runtime = Array.from(this.agents.values()).find(
                            (a) =>
                                a.character.name.toLowerCase() ===
                                agentId.toLowerCase()
                        );
                    }

                    /*
                    if (!runtime) {
                        const infoMsg = `Unable to find an agent with ID: ${agentId}`;

                        elizaLogger.debug(infoMsg);

                        res.status(404).send(infoMsg);
                        return;
                    }
                     */

                    // -------------------------- BEGIN: CHARACTER/AGENT SWITCH HANDLING ------------------------

                    // Iterate the available agents to see if any of them
                    //  have a relationship with the current user in the
                    //  current room.  If they do, override the default
                    //  agent/character choice with the one in the
                    //  relationship with the user in the current room.
                    const overrideRuntimeOrNull =
                        await findAgentAssignedToUser(roomId, userId, this.agents);

                    if (overrideRuntimeOrNull instanceof AgentRuntime) {
                        elizaLogger.debug(`User assigned the following agent with CHARACTER name: ${overrideRuntimeOrNull.character.name}`);

                        // Override the selected agent.
                        runtime = overrideRuntimeOrNull;
                    }

                    // Make sure we have a valid agent/character to use from here on.
                    if (!runtime) {
                        throw new Error(`The "runtime" agent/character variable is unassigned.`);
                    }

                    // -------------------------- BEGIN: ESTABLISH INITIAL RELATIONSHIP ------------------------

                    // If an existing user to agent/character relationship was not found,
                    //  make that association now.
                    if (!overrideRuntimeOrNull) {
                        elizaLogger.debug(`Creating starting relationship for user ID("${userId}") with character: ${runtime.character.name}`);

                        // Make an exclusive relationship between the given user ID and the
                        //  selected agent/character.  All other relationships for that user
                        //  in the current room will be broken.
                        await setExclusiveUserToCharacterRelationship(roomId, userId, runtime);
                    }


                    // -------------------------- END  : ESTABLISH INITIAL RELATIONSHIP ------------------------

                    // -------------------------- BEGIN: HOT-LOAD CHARACTER CONTENT ------------------------

                    // DEPRECATED: Deprecated in favor of true on-demand string field
                    //  processing.
                    //
                    // This code process all the character fields that have "file:", "http:", or "https:"
                    //  prefixes and replaces the field content with the results of a file load or
                    //  HTTP/HTTPS fetch call, with the result being put into the "characterProcessed"
                    //  property.
                    // await processFileOrUrlReferences(runtime.character);

                    // -------------------------- END  : HOT-LOAD CHARACTER CONTENT ------------------------

                    // >>>>> Is this a bill-of-materials agent/character or not?
                    const bIsBomAgentCharacter =
                        isBomAgentCharacter(runtime);

                    if (bIsBomAgentCharacter) {
                        // Yes it is.  Get the bill-of-materials goal for this agent/character.
                        const relationshipIdPair: FullUserIdCharacterIdPair =
                            buildRelationshipIdPair(roomId, userId, runtime.character.name);

                        // If this is not an explicit RESET command, then see if the
                        //  current agent/character has a goal in progress.
                        if (!bIsResetCommand) {
                            // -------------------------- BEGIN: CHECK FOR EXISTING BOM GOAL FOR AGENT/CHARACTER ------------------------

                            mainBomGoal =
                                await checkForMainBomGoal(runtime, relationshipIdPair);

                            // -------------------------- END  : CHECK FOR EXISTING BOM GOAL FOR AGENT/CHARACTER ------------------------
                        }

                        // Was an explicit RESET command triggered OR does the agent/character
                        //  not have an existing goal object?
                        if (bIsResetCommand || !mainBomGoal) {
                            elizaLogger.debug(`RESET command received.  Building the main bill-of-materials goal for agent/character: ${runtime.character.name}.`);

                            // Yes. Rebuild the character/agent's MAIN goal using its
                            //  bill of materials content.
                            mainBomGoal = await resetBomGoalsForRelationship(roomId, userId, runtime);
                        } else {
                            // No. mainBomGoal should have a valid bill-of-materials goal for
                            //  us to use now.
                            elizaLogger.debug(`Re-using the main bill-of-materials goal for agent/character: ${runtime.character.name}.`);
                        }
                    }

                    // -------------------------- END  : CHARACTER/AGENT SWITCH HANDLING ------------------------

                    await runtime.ensureConnection(
                        userId,
                        roomId,
                        req.body.userName,
                        req.body.name,
                        "direct"
                    );

                    // -------------------------- BEGIN: SAVE USER INPUT AS MEMORY ------------------------

                    const text = req.body.text;
                    const messageId = stringToUuid(Date.now().toString());

                    const content: Content = {
                        text,
                        attachments: [],
                        source: "direct",
                        inReplyTo: undefined,
                    };

                    const userMessage = {
                        content,
                        userId,
                        roomId,
                        agentId: runtime.agentId,
                    };

                    const memory: Memory = {
                        id: messageId,
                        agentId: runtime.agentId,
                        userId,
                        roomId,
                        content,
                        createdAt: Date.now(),
                    };

                    await runtime.messageManager.createMemory(memory);

                    // -------------------------- END  : SAVE USER INPUT AS MEMORY ------------------------

                    const state = await runtime.composeState(userMessage, {
                        agentName: runtime.character.name,
                    });


                    // TODO: If there is a bill-of-materials goal active for the current
                    //  agent/character, then it is time to facilitate that objective
                    //  by creating the bill-of-materials sub-prompt for insertion into
                    //  the message handler template.

                    let response: Content | null = null;

                    if (mainBomGoal) {
                        // Determine the next objective that needs to be completed.
                        let currentBomObjective = getNextBomObjective(mainBomGoal);

                        if (currentBomObjective !== null) {
                            // -------------------------- BEGIN: ANALYZE STATUS OF CURRENT BOM OBJECTIVE ------------------------

                            // First, we need to check for an answer to a recently
                            //  asked optional line item preliminary question,
                            //  optional line item main question, or non-optional
                            //  line item main question.  This function may
                            //  come up with a response to show the user in
                            //  certain contexts.  For example, like when
                            //  HELP mode is active and the chat history
                            //  indicates the user wants to cancel the
                            //  bill-of-materials session.
                            response =
                                await determineBomQuestionResult(runtime, roomId, userId, state, currentBomObjective);

                            // -------------------------- END  : ANALYZE STATUS OF CURRENT BOM OBJECTIVE ------------------------
                        }

                        // Is the GOAL (aka form fill operation) complete?
                        if (currentBomObjective === null) {
                            // -------------------------- BEGIN: BILL-OF-MATERIALS GOAL COMPLETE ------------------------

                            // Yes.  If we don't have an agent/character to switch control to,
                            //  now that the bill-of-materials goal is complete, then that
                            //  is an error.
                            const nextCharacterName =
                                runtime.character.switchToCharacterWhenBomComplete;

                            if (typeof nextCharacterName !== "string" || typeof nextCharacterName === "string" && nextCharacterName.trim().length === 0) {
                                throw new Error(`The bill-of-materials goal processing is complete, but the character does not specify the next agent to transfer control to (i.e. - switchToCharacterWhenBomComplete is unassigned or invalid.`);
                            }

                            // Emit the action that will transfer control of the conversation
                            //  to the next agent/character.
                            response = {
                                text: `Transferring you over to the next agent: ${nextCharacterName}`,
                                action: `SELECT_CHARACTER_${nextCharacterName}`
                            }

                            // Write an END SESSION message into the recent messages stream.  The
                            //  completion of the goal marks the end of the bill-of-materials
                            //  session.
                            await createEndSessionMemory(runtime, CLIENT_NAME, roomId, userId);

                            // -------------------------- END  : BILL-OF-MATERIALS GOAL COMPLETE ------------------------

                        } else {
                            // -------------------------- BEGIN: ASK NEXT BOM QUESTION ------------------------

                            // If a response was already generated, then we use it.
                            //  Otherwise, we determine what question we should ask
                            //  the user now and build a response from that.
                            if (!response) {
                                // We need to re-calculate the next bill-of-materials objective
                                //  in case one of the result checks marked the current
                                //  objective as completed, or in case an OPTIONAL line item
                                //  objective was just marked as being of interest or not of
                                //  interest to the user.
                                currentBomObjective =
                                    getNextBomObjective(mainBomGoal);

                                elizaLogger.debug(`Building the next bill-of-materials question now, for objective: ${currentBomObjective.description}`);

                                const billOfMaterialsQuestion =
                                    await buildBillOfMaterialQuestion(currentBomObjective);

                                if (billOfMaterialsQuestion.trim().length === 0)
                                    throw new Error(`The billOfMaterialsQuestion variable is empty.`);

                                // Create a response that will ask the user the desired question.
                                response = {
                                    text: billOfMaterialsQuestion
                                }
                            }


                            // -------------------------- BEGIN: UPDATE GOAL ------------------------

                            // We always update the goal in case we made changes to it or any of
                            //  its objectives during processing.
                            await runtime.databaseAdapter.updateGoal(mainBomGoal);

                            // -------------------------- END  : UPDATE GOAL ------------------------

                            // -------------------------- END  : ASK NEXT BOM QUESTION ------------------------
                        }
                    } else {
                        // -------------------------- BEGIN: LEGACY PROCESSING (Not bill-of-materials) ------------------------

                        // If the character has its own message template, use that instead.
                        let useTemplate = messageHandlerTemplate;

                        if (runtime.character.messageTemplate && runtime.character.messageTemplate.trim().length > 0) {
                            elizaLogger.debug(`OVERRIDING message template with CHARACTER defined message template.`);
                            useTemplate = runtime.character.messageTemplate.trim();
                        }

                        const context = composeContext({
                            state,
                            template: useTemplate,
                        });

                        // Now, make the call to the LLM using the updated context.
                        //
                        // DEV NOTE: "context" is just a string with the substitution
                        //  variables filled in by the composeContext() call using
                        //  elements found in the "state" variable.
                        //
                        //  The "runtime" (agent/character) object is passed in to
                        //  give the code that sets up the LLM call access to the
                        //  settings and environment variables the agent/character
                        //  object carries, and access to the agent/character's
                        //  system prompt (i.e. - runtime.character.system_prompt),
                        //  which has priority ver the SYSTEM_PROMPT environment
                        //  variable.  Note, either or both of these two system
                        //  prompt sources may be unassigned.
                        //
                        //  See aiGenerateText in generations.ts (eliza package) for
                        //  details.
                        response = await generateMessageResponse({
                            runtime: runtime,
                            context,
                            modelClass: ModelClass.SMALL,
                        });

                        // -------------------------- END  : LEGACY PROCESSING (Not bill-of-materials) ------------------------
                    } // else/if (mainBomGoal)

                    // save response to memory
                    const responseMessage = {
                        ...userMessage,
                        userId: runtime.agentId,
                        content: response,
                    };

                    await runtime.messageManager.createMemory(responseMessage);

                    if (!response) {
                        res.status(500).send(
                            "No response from generateMessageResponse"
                        );
                        return;
                    }

                    let message = null as Content | null;

                    await runtime.evaluate(memory, state);

                    const _result = await runtime.processActions(
                        memory,
                        [responseMessage],
                        state,
                        async (newMessages) => {
                            message = newMessages;
                            return [memory];
                        }
                    );

                    // Return the response we created.
                    if (message) {
                        res.json([response, message]);
                    } else {
                        res.json([response]);
                    }
                } catch (err) {
                    elizaLogger.error(`${errPrefix}`, err);
                }
            }
        );

        this.app.post(
            "/:agentId/image",
            async (req: express.Request, res: express.Response) => {
                const agentId = req.params.agentId;
                const agent = this.agents.get(agentId);
                if (!agent) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const images = await generateImage({ ...req.body }, agent);
                const imagesRes: { image: string; caption: string }[] = [];
                if (images.data && images.data.length > 0) {
                    for (let i = 0; i < images.data.length; i++) {
                        const caption = await generateCaption(
                            { imageUrl: images.data[i] },
                            agent
                        );
                        imagesRes.push({
                            image: images.data[i],
                            caption: caption.title,
                        });
                    }
                }
                res.json({ images: imagesRes });
            }
        );

        this.app.post(
            "/fine-tune",
            async (req: express.Request, res: express.Response) => {
                try {
                    const response = await fetch(
                        "https://api.bageldb.ai/api/v1/asset",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                            body: JSON.stringify(req.body),
                        }
                    );

                    const data = await response.json();
                    res.json(data);
                } catch (error) {
                    res.status(500).json({
                        error: "Please create an account at bakery.bagel.net and get an API key. Then set the BAGEL_API_KEY environment variable.",
                        details: error.message,
                    });
                }
            }
        );
        this.app.get(
            "/fine-tune/:assetId",
            async (req: express.Request, res: express.Response) => {
                const assetId = req.params.assetId;
                const downloadDir = path.join(
                    process.cwd(),
                    "downloads",
                    assetId
                );

                console.log("Download directory:", downloadDir);

                try {
                    console.log("Creating directory...");
                    await fs.promises.mkdir(downloadDir, { recursive: true });

                    console.log("Fetching file...");
                    const fileResponse = await fetch(
                        `https://api.bageldb.ai/api/v1/asset/${assetId}/download`,
                        {
                            headers: {
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                        }
                    );

                    if (!fileResponse.ok) {
                        throw new Error(
                            `API responded with status ${fileResponse.status}: ${await fileResponse.text()}`
                        );
                    }

                    console.log("Response headers:", fileResponse.headers);

                    const fileName =
                        fileResponse.headers
                            .get("content-disposition")
                            ?.split("filename=")[1]
                            ?.replace(/"/g, "") || "default_name.txt";

                    console.log("Saving as:", fileName);

                    const arrayBuffer = await fileResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    const filePath = path.join(downloadDir, fileName);
                    console.log("Full file path:", filePath);

                    await fs.promises.writeFile(filePath, buffer);

                    // Verify file was written
                    const stats = await fs.promises.stat(filePath);
                    console.log(
                        "File written successfully. Size:",
                        stats.size,
                        "bytes"
                    );

                    res.json({
                        success: true,
                        message: "Single file downloaded successfully",
                        downloadPath: downloadDir,
                        fileCount: 1,
                        fileName: fileName,
                        fileSize: stats.size,
                    });
                } catch (error) {
                    console.error("Detailed error:", error);
                    res.status(500).json({
                        error: "Failed to download files from BagelDB",
                        details: error.message,
                        stack: error.stack,
                    });
                }
            }
        );
    }

    /**
     * Retrieve an agent from the agents collection using its ID.
     *
     * @param agentId - The ID of the agent to retrieve.
     *
     * @returns - Returns the agent object associated with the ID
     *  if found, or NULL if no agent could be found with that ID.
     */
    public getAgentByAgentId(agentId: string): AgentRuntime {
        const errPrefix = `(getAgentByAgentId) `;

        if (agentId.trim().length === 0)
            throw new Error(`${errPrefix}The agentId parameter is empty.`);

        const agentFound = this.agents.get(agentId);

        if (agentFound)
            return agentFound;
        else
            return null;
    }

    /**
     * Retrieve the first agent from the agents collection.
     *
     * @returns - Returns the first agent object found in the agents
     *  collection or NULL, if the collection is empty.
     */
    public getFirstAgent(): AgentRuntime {
        const agentFound = this.agents.values().next().value;

        if (agentFound)
            return agentFound;
        else
            return null;
    }

    public registerAgent(runtime: AgentRuntime) {
        this.agents.set(runtime.agentId, runtime);
    }

    public unregisterAgent(runtime: AgentRuntime) {
        this.agents.delete(runtime.agentId);
    }

    public start(port: number) {
        this.server = this.app.listen(port, () => {
            elizaLogger.success(`Server running at http://localhost:${port}/`);
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            elizaLogger.log("Received shutdown signal, closing server...");
            this.server.close(() => {
                elizaLogger.success("Server closed successfully");
                process.exit(0);
            });

            // Force close after 5 seconds if server hasn't closed
            setTimeout(() => {
                elizaLogger.error(
                    "Could not close connections in time, forcefully shutting down"
                );
                process.exit(1);
            }, 5000);
        };

        // Handle different shutdown signals
        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }

    public stop() {
        if (this.server) {
            this.server.close(() => {
                elizaLogger.success("Server stopped");
            });
        }
    }
}

export const DirectClientInterface: Client = {
    start: async (_runtime: IAgentRuntime) => {
        elizaLogger.log("DirectClientInterface start");
        const client = new DirectClient();
        const serverPort = parseInt(settings.SERVER_PORT || "3000");
        client.start(serverPort);
        return client;
    },
    stop: async (_runtime: IAgentRuntime, client?: any) => {
        if (client instanceof DirectClient) {
            client.stop();
        }
    },
};

export default DirectClientInterface;
