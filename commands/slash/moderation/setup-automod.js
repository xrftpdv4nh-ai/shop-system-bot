const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    AutoModerationRuleTriggerType,
    AutoModerationActionType,
    AutoModerationEventType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-automod')
        .setDescription('Create AutoMod rules for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {

        const guild = interaction.guild;

        try {

            const rules = [

                {
                    name: "Block Bad Words",
                    triggerMetadata: { keywordFilter: ['badword', 'curse', 'insult'] }
                },

                {
                    name: "Block Spam Links",
                    triggerMetadata: { keywordFilter: ['discord.gg/', 'http://', 'https://'] }
                },

                {
                    name: "Block Scam Words",
                    triggerMetadata: { keywordFilter: ['free nitro', 'steam gift', 'claim reward'] }
                },

                {
                    name: "Block Mention Spam",
                    triggerMetadata: { mentionTotalLimit: 5 },
                    triggerType: AutoModerationRuleTriggerType.MentionSpam
                },

                {
                    name: "Block Invite Links",
                    triggerMetadata: { keywordFilter: ['discord.gg'] }
                }

            ];

            for (const r of rules) {

                await guild.autoModerationRules.create({
                    name: r.name,
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: r.triggerType || AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: r.triggerMetadata,
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: {
                                customMessage: "🚫 This message is blocked by AutoMod."
                            }
                        }
                    ],
                    enabled: true,
                    reason: "AutoMod setup"
                });

            }

            interaction.reply({
                content: "✅ تم إنشاء **5 AutoMod Rules** في السيرفر.",
                ephemeral: true
            });

        } catch (err) {
            console.error(err);
            interaction.reply({
                content: "❌ حصل خطأ أثناء إنشاء القواعد.",
                ephemeral: true
            });
        }

    }
};
