import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, type ButtonInteraction } from "discord.js";
import { logger } from "@/utils/logger";
import { InteractionType } from "@generated/client";
import { recordUserInteraction } from "@/services/user-history.service";

type HandlerFn = (interaction: ButtonInteraction, repoId: bigint) => Promise<void>;

const handlers: Record<string, HandlerFn> = {
    'like': likeHandler,
    'dislike': dislikeHandler,
};

/**
 * Dispatches button interactions to their respective handlers
 * @param interaction 
 * @returns 
 */
export async function handleButton(interaction: ButtonInteraction) {
    const [action, repoIdStr] = interaction.customId.split('/');
    if (!action || !repoIdStr) {
        logger.error({customId: interaction.customId}, "Invalid button custom ID format.");
        return interaction.reply({ content: "There was an error processing your interaction.", ephemeral: true });
    }
    const handler = handlers[action as keyof typeof handlers];
    if (handler) {
        return handler(interaction, BigInt(repoIdStr));
    }
    return interaction.reply({ content: "Unknown action: " + action, ephemeral: true });
}

/**
 * Handles like button interactions
 * @param interaction 
 * @param repoId 
 */
async function likeHandler(interaction: ButtonInteraction, repoId: bigint) {
    try {
        // Handle like action
        const { newStyle, isHighlight } = await recordFeedback(interaction, repoId, InteractionType.LIKED);
        const newRow = buildNewButton(interaction, newStyle, isHighlight);
        await interaction.update({components: [newRow]});
    } catch (error) {
        logger.error({err: error}, "Error handling like interaction");
        await interaction.reply({ content: "There was an error processing your like.", ephemeral: true });
    }
}

/**
 * Handles dislike button interactions
 * @param interaction 
 * @param repoId 
 */
async function dislikeHandler(interaction: ButtonInteraction, repoId: bigint) {
    try {
        // Handle dislike action
        const { newStyle, isHighlight } = await recordFeedback(interaction, repoId, InteractionType.DISLIKED);
        const newRow = buildNewButton(interaction, newStyle, isHighlight);
        await interaction.update({components: [newRow]});
    } catch (error) {
        logger.error({err: error}, "Error handling dislike interaction");
        await interaction.reply({ content: "There was an error processing your dislike.", ephemeral: true });
    }
}

/**
 * Records user feedback and determines new button styles
 * @param interaction 
 * @param repoId 
 * @param interactionType 
 * @returns new style and highlight status
 */
async function recordFeedback(interaction: ButtonInteraction, repoId: bigint, interactionType: InteractionType) {
    const userId = interaction.user.id;
    const button = interaction.component;
    let newStyle: ButtonStyle;
    let isHighlight = false;
    if (button.style === ButtonStyle.Secondary) {
        newStyle = ButtonStyle.Primary;
        isHighlight = true;
        await recordUserInteraction(userId, repoId, interactionType);
    } else {
        newStyle = ButtonStyle.Secondary;
        await recordUserInteraction(userId, repoId, InteractionType.PUSHED);
    }
    return { newStyle, isHighlight };
}

/**
 * Builds the new action row with updated button styles
 * @param interaction 
 * @param newStyle 
 * @param isHighlight 
 * @returns new action row
 */
function buildNewButton(interaction: ButtonInteraction, newStyle: ButtonStyle, isHighlight: boolean): ActionRowBuilder<ButtonBuilder> {
    const oldRow = interaction.message.components[0];
    const newRow = new ActionRowBuilder<ButtonBuilder>();
    if (!oldRow || !('components' in oldRow)) {
        return newRow;
    }
    oldRow.components.forEach(component => {
        if (component.type !== ComponentType.Button) return; 
        const btnBuilder = ButtonBuilder.from(component);

        if (component.customId === interaction.customId) {
            btnBuilder.setStyle(newStyle)
                        .setDisabled(false);
        } else {
            btnBuilder.setDisabled(isHighlight);
        }

        newRow.addComponents(btnBuilder);
    });
    return newRow;
}