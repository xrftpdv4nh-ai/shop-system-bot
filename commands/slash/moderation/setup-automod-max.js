const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    AutoModerationRuleTriggerType,
    AutoModerationActionType,
    AutoModerationEventType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-automod-max')
        .setDescription('Create maximum AutoMod rules for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            if (!interaction.inGuild() || !interaction.guildId) {
                return interaction.reply({
                    content: '❌ الأمر ده لازم يتستخدم داخل سيرفر.',
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            const guild = await interaction.client.guilds.fetch(interaction.guildId);
            if (!guild) {
                return interaction.editReply('❌ مقدرتش أوصل للسيرفر.');
            }

            const me = await guild.members.fetchMe().catch(() => null);
            if (!me) {
                return interaction.editReply('❌ مقدرتش أحدد صلاحيات البوت.');
            }

            if (!me.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.editReply('❌ البوت محتاج صلاحية **Manage Server**.');
            }

            if (!guild.autoModerationRules) {
                return interaction.editReply('❌ AutoMod غير مدعوم أو نسخة discord.js عندك قديمة.');
            }

            const existingRules = await guild.autoModerationRules.fetch().catch(() => null);
            if (!existingRules) {
                return interaction.editReply('❌ مقدرتش أجيب قواعد AutoMod الحالية.');
            }

            const existingNames = new Set(existingRules.map(r => r.name));

            const rulesToCreate = [
                {
                    name: 'AM Bad Words 1',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: {
                        keywordFilter: ['badword1', 'badword2', 'curse1', 'curse2']
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 الرسالة دي مخالفة.' }
                        }
                    ]
                },
                {
                    name: 'AM Bad Words 2',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: {
                        keywordFilter: ['insult1', 'insult2', 'toxic1', 'toxic2']
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 الرسالة دي مخالفة.' }
                        }
                    ]
                },
                {
                    name: 'AM Invite Links',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: {
                        keywordFilter: ['discord.gg', 'discord.com/invite']
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 روابط الدعوات ممنوعة.' }
                        }
                    ]
                },
                {
                    name: 'AM Scam Words',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: {
                        keywordFilter: ['free nitro', 'claim reward', 'steam gift', 'free gift']
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 الرسالة دي مشبوهة.' }
                        }
                    ]
                },
                {
                    name: 'AM Ad Links',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: {
                        keywordFilter: ['http://', 'https://', 'www.']
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 الروابط غير مسموحة.' }
                        }
                    ]
                },
                {
                    name: 'AM Fake Giveaway',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: {
                        keywordFilter: ['giveaway winner', 'limited offer', 'urgent claim', 'click here now']
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 الرسالة دي مشبوهة.' }
                        }
                    ]
                },
                {
                    name: 'AM Spam Filter',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Spam,
                    triggerMetadata: {},
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 تم منع الرسالة بسبب السبام.' }
                        }
                    ]
                },
                {
                    name: 'AM Preset Filter',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.KeywordPreset,
                    triggerMetadata: {
                        presets: [1, 2, 3],
                        allowList: []
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 الرسالة خالفت الفلتر التلقائي.' }
                        }
                    ]
                },
                {
                    name: 'AM Mention Spam',
                    eventType: AutoModerationEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.MentionSpam,
                    triggerMetadata: {
                        mentionTotalLimit: 5
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 منشن سبام ممنوع.' }
                        }
                    ]
                },
                {
                    name: 'AM Profile Filter',
                    eventType: AutoModerationEventType.MemberUpdate,
                    triggerType: AutoModerationRuleTriggerType.MemberProfile,
                    triggerMetadata: {
                        keywordFilter: ['badword1', 'fake staff', 'scamlink']
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage
                        }
                    ]
                }
            ];

            let created = 0;
            let skipped = 0;
            const errors = [];

            for (const rule of rulesToCreate) {
                if (existingNames.has(rule.name)) {
                    skipped++;
                    continue;
                }

                try {
                    await guild.autoModerationRules.create({
                        ...rule,
                        enabled: true,
                        reason: 'Bulk AutoMod setup'
                    });
                    created++;
                } catch (err) {
                    errors.push(`- ${rule.name}: ${err.message}`);
                }
            }

            let msg = `✅ تم إنشاء **${created}** Rule\n⏭️ تم تخطي **${skipped}** Rule موجودين بالفعل`;

            if (errors.length > 0) {
                msg += `\n\n❌ Errors:\n${errors.slice(0, 10).join('\n')}`;
            }

            return interaction.editReply(msg);
        } catch (err) {
            console.error('setup-automod-max error:', err);
            return interaction.editReply('❌ حصل خطأ أثناء إنشاء AutoMod Rules.');
        }
    }
};
