import bodyParser from "body-parser";
import cors from "cors";
import express, { Request as ExpressRequest } from "express";
import multer, { File } from "multer";
import {
    IAgentRuntimeOrNull,
    buildCharacterNameForRelationship,
    buildFullRelationshipId,
    elizaLogger,
    generateCaption,
    generateImage, UUID
} from "@ai16z/eliza";
import { composeContext } from "@ai16z/eliza";
import { generateMessageResponse } from "@ai16z/eliza";
import { messageCompletionFooter } from "@ai16z/eliza";
import { AgentRuntime, Goal } from "@ai16z/eliza";
import { resetBomCharacterAgentGoals } from "@ai16z/plugin-pilterms";
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
const upload = multer({ storage: multer.memoryStorage() });

export const messageHandlerTemplate =
    // {{goals}}
    `
#
# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.
` + messageCompletionFooter;

export interface SimliClientConfig {
    apiKey: string;
    faceID: string;
    handleSilence: boolean;
    videoRef: any;
    audioRef: any;
}

/**
 * This function checks to see if the given room ID +
 *  user ID combination has been assigned a particular
 *  agent.
 *
 * @param roomId - The ID of the current room.
 * @param userId - The ID of the user.
 * @param agentObj - An agent object.
 *
 * @returns - If the given agent is assigned to the
 *  given user in the given room, the IAgentRuntime
 *  object for that agent will be returned.  Otherwise,
 *  null will be returned.
 */
export async function isRelated(roomId: UUID, userId: UUID, agentObj: IAgentRuntime): Promise<IAgentRuntimeOrNull> {
    const characterName =
        agentObj.character.name;

    if (characterName.length > 0) {
        // We build a full user ID from the current room ID
        //  and the current user ID, so the relationship
        //  between the user and the specified character
        //  is local to the current room.  This allows
        //  the user to be serviced by other characters
        //  in other rooms they may be participating in.
        const fullUserId =
            buildFullRelationshipId(roomId, userId);

        // We adorn the character name with a constant prefix
        //  so that we don't accidentally confuse a character
        //  name with a user ID.
        const fullCharacterName =
            buildCharacterNameForRelationship(characterName);

        // Same for the specified character.
        const fullCharacterId =
            buildFullRelationshipId(roomId, fullCharacterName as UUID);

        // Search for a relationship between the user and the selected character.
        //  runtime.databaseAdapter.createRelationship().  ALWAYS put
        // the user before the character!
        const relationshipObjOrNull =
            await agentObj.databaseAdapter.getRelationship(
                {
                    userA: fullUserId,
                    userB: fullCharacterId
                }
            );

        // If a relationship exists, we stop searching
        //  immediately and use the "assigned" agent,
        //  since it has the name of the character that
        //  a request was made to switch to via a
        //  SELECT_CHARACTER_* action occurrence.
        const bIsRelated = relationshipObjOrNull !== null;

        if (bIsRelated)
            return agentObj;
    }

    return null;
}

/**
 * This function searches the agents registry to see if a specific
 *  agent was assigned to the given user in the given room.
 *
 * @param roomId - The ID of the current room.
 * @param userId - The ID of the user.
 * @param agentsMap - A map of the available agents.
 */
async function findAgentAssignedToUser(
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
    private agents: Map<string, AgentRuntime>;
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
                const agentId = req.params.agentId;
                const roomId = stringToUuid(
                    req.body.roomId ?? "default-room-" + agentId
                );
                const userId = stringToUuid(req.body.userId ?? "user");
                const userInput = req.body.text.trim();

                // TODO: Until we create a more sophisticated way to reset a session
                //  with a user to the "start" condition, we look for a simple "reset"
                //  statement to do this.  If found then we do not override the
                //  the default choice which in the direct client, is the first
                //  available agent.
                const bIsResetCommand = userInput === 'reset';

                let mainGoal: Goal | null = null;

                if (bIsResetCommand)
                    elizaLogger.debug(`Direct client message route received a RESET instruction.`);

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

                // -------------------------- BEGIN: CHARACTER/AGENT SWITCH HANDLING ------------------------

                // Was an explicit RESET command triggered?
                if (bIsResetCommand) {
                    elizaLogger.debug(`RESET command received.`);

                    // Yes. Rebuild the character/agent's MAIN goal using its
                    //  bill of materials content.
                    mainGoal = await resetBomCharacterAgentGoals(roomId, userId, runtime);
                } else {

                    //  No. Check if a character assignment relationship was created for the
                    //  current room ID + user ID pair.

                    // Iterate the available agents to see if any of them
                    //  have a relationship with the current user in the
                    //  current room.
                    const overrideRuntimeOrNull =
                        await findAgentAssignedToUser(roomId, userId, this.agents);

                    if (overrideRuntimeOrNull instanceof AgentRuntime) {
                        elizaLogger.debug(`User assigned the following agent with CHARACTER name: ${overrideRuntimeOrNull.character.name}`);

                        // Override the selected agent.
                        runtime = overrideRuntimeOrNull;
                    }

                }

                if (!runtime) {
                    throw new Error(`The "runtime" agent/character variable is unassigned.`);
                }

                // If we don't have a main goal yet, then get the
                //   current bill-of-materials main GOAL for the
                //   resulting agent/character.
                if (!mainGoal) {
                    mainGoal = await runtime.databaseAdapter.getGoals()
                }


                // -------------------------- END  : CHARACTER/AGENT SWITCH HANDLING ------------------------

                // -------------------------- BEGIN: HOT-LOAD CHARACTER CONTENT ------------------------

                // This code process all the character fields that have "file:", "http:", or "https:"
                //  prefixes and replaces the field content with the results of a file load or
                //  HTTP/HTTPS fetch call.
                await processFileOrUrlReferences(runtime.character);

                // -------------------------- END  : HOT-LOAD CHARACTER CONTENT ------------------------

                // -------------------------- BEGIN: BILL-OF-MATERIALS GOAL PROCESSING ------------------------

                // Retrieve the current goal, if any for the current agent/character

                // -------------------------- END  : BILL-OF-MATERIALS GOAL PROCESSING ------------------------
                await runtime.ensureConnection(
                    userId,
                    roomId,
                    req.body.userName,
                    req.body.name,
                    "direct"
                );

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

                const state = await runtime.composeState(userMessage, {
                    agentName: runtime.character.name,
                });

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

                const response = await generateMessageResponse({
                    runtime: runtime,
                    context,
                    modelClass: ModelClass.SMALL,
                });

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

                if (message) {
                    res.json([response, message]);
                } else {
                    res.json([response]);
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
