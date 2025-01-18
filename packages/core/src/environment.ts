import { z } from "zod";
import { ModelProviderName, Clients } from "./types";

// TODO: TO COMPLETE
export const envSchema = z.object({
    // API Keys with specific formats
    OPENAI_API_KEY: z
        .string()
        .startsWith("sk-", "OpenAI API key must start with 'sk-'"),
    REDPILL_API_KEY: z.string().min(1, "REDPILL API key is required"),
    GROK_API_KEY: z.string().min(1, "GROK API key is required"),
    GROQ_API_KEY: z
        .string()
        .startsWith("gsk_", "GROQ API key must start with 'gsk_'"),
    OPENROUTER_API_KEY: z.string().min(1, "OpenRouter API key is required"),
    GOOGLE_GENERATIVE_AI_API_KEY: z
        .string()
        .min(1, "Gemini API key is required"),
    ELEVENLABS_XI_API_KEY: z.string().min(1, "ElevenLabs API key is required"),
});

// Type inference
export type EnvConfig = z.infer<typeof envSchema>;

// Validation function
export function validateEnv(): EnvConfig {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path}: ${err.message}`)
                .join("\n");
            throw new Error(`Environment validation failed:\n${errorMessages}`);
        }
        throw error;
    }
}

// Helper schemas for nested types
const MessageExampleSchema = z.object({
    user: z.string(),
    content: z
        .object({
            text: z.string(),
            action: z.string().optional(),
            source: z.string().optional(),
            url: z.string().optional(),
            inReplyTo: z.string().uuid().optional(),
            attachments: z.array(z.any()).optional(),
        })
        .and(z.record(z.string(), z.unknown())), // For additional properties
});

const PluginSchema = z.object({
    name: z.string(),
    description: z.string(),
    actions: z.array(z.any()).optional(),
    providers: z.array(z.any()).optional(),
    evaluators: z.array(z.any()).optional(),
    services: z.array(z.any()).optional(),
    clients: z.array(z.any()).optional(),
});

const BillOfMaterialsLineItemSchema = z.object({
    name: z.string(),
    type: z.string(),
    prompt: z.string(),
    isOptional: z.boolean(),
    listOfValidValues: z.array(z.string()).optional(),
    isInteger: z.number().optional(),
    minVal: z.number().optional(),
    maxVal: z.number().optional(),
    unitsDescription: z.string().optional(),
    preliminaryPromptForOptionalLineItem: z.string().optional(),
    helpDocumentForBomLineItem: z.string().optional(),
});

// Main Character schema
export const CharacterSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    system: z.string().optional(),
    modelProvider: z.nativeEnum(ModelProviderName),
    modelEndpointOverride: z.string().optional(),
    templates: z.record(z.string()).optional(),
    bio: z.union([z.string(), z.array(z.string())]),
    lore: z.array(z.string()),
    messageExamples: z.array(z.array(MessageExampleSchema)),
    postExamples: z.array(z.string()),
    topics: z.array(z.string()),
    adjectives: z.array(z.string()),
    knowledge: z.array(z.string()).optional(),
    clients: z.array(z.nativeEnum(Clients)),
    plugins: z.union([
      z.array(z.string()),
      z.array(PluginSchema),
    ]),
    settings: z
        .object({
            secrets: z.record(z.string()).optional(),
            voice: z
                .object({
                    model: z.string().optional(),
                    url: z.string().optional(),
                })
                .optional(),
            model: z.string().optional(),
            embeddingModel: z.string().optional(),
        })
        .optional(),
    clientConfig: z
        .object({
            discord: z
                .object({
                    shouldIgnoreBotMessages: z.boolean().optional(),
                    shouldIgnoreDirectMessages: z.boolean().optional(),
                })
                .optional(),
            telegram: z
                .object({
                    shouldIgnoreBotMessages: z.boolean().optional(),
                    shouldIgnoreDirectMessages: z.boolean().optional(),
                })
                .optional(),
        })
        .optional(),
    style: z.object({
        all: z.array(z.string()),
        chat: z.array(z.string()),
        post: z.array(z.string()),
    }),
    twitterProfile: z
        .object({
            username: z.string(),
            screenName: z.string(),
            bio: z.string(),
            nicknames: z.array(z.string()).optional(),
        })
        .optional(),
    messageTemplate: z.string().optional(),
    billOfMaterials: z.array(BillOfMaterialsLineItemSchema).optional(),
    switchToCharacterWhenBomComplete: z.string().optional(),
    resetGoalsOnReceivingControl: z.boolean().optional()
});

// Type inference
export type CharacterConfig = z.infer<typeof CharacterSchema>;

/**
 * Validates a character configuration JSON object against the CharacterSchema.
 *
 * This function provides detailed error reporting, including the exact paths
 * to invalid fields and descriptive messages for validation errors.
 *
 * @param {unknown} json - The JSON object to validate.
 * @returns {CharacterConfig} - The validated character configuration.
 * @throws {Error} - If validation fails, an error with detailed information is thrown.
 */
export function validateCharacterConfig(json: unknown): CharacterConfig {
    try {
        // Attempt to parse and validate the input JSON against the schema.
        return CharacterSchema.parse(json);
    } catch (error) {
        // Check if the error is a ZodError.
        if (error instanceof z.ZodError) {
            // Format Zod errors into a detailed string.
            const formattedErrors = formatZodErrors(error);

            // Throw a new error with the detailed validation error messages.
            throw new Error(
                `Character configuration validation failed:\n${formattedErrors}`
            );
        }

        // Rethrow non-Zod errors for further handling.
        throw error;
    }
}

/**
 * Formats Zod validation errors into a readable string.
 *
 * Each error includes the path to the invalid field and the corresponding
 * error message, providing clarity on the validation issues.
 *
 * @param {z.ZodError} error - The ZodError to format.
 * @returns {string} - A formatted string of validation errors.
 */
function formatZodErrors(error: z.ZodError): string {
    return error.issues
        .map(
            (issue) =>
                `Path: ${issue.path.join(".")}, Error: ${issue.message}`
        )
        .join("\n");
}
