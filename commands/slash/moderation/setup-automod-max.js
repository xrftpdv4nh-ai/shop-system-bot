const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    AutoModerationActionType
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
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const guild = await interaction.client.guilds.fetch(interaction.guildId);
            if (!guild) {
                return interaction.editReply('❌ مقدرتش أوصل للسيرفر.');
            }

            const me = await guild.members.fetchMe().catch(() => null);
            if (!me) {
                return interaction.editReply('❌ مقدرتش أحدد صلاحيات البوت.');
            }

            if (!me.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.editReply('❌ البوت محتاج صلاحية Manage Server.');
            }

            if (!guild.autoModerationRules) {
                return interaction.editReply('❌ AutoMod غير مدعوم في نسخة discord.js الحالية.');
            }

            const existingRules = await guild.autoModerationRules.fetch().catch(() => null);
            if (!existingRules) {
                return interaction.editReply('❌ مقدرتش أجيب قواعد AutoMod الحالية.');
            }

            const existingNames = new Set(existingRules.map(r => r.name));

            const MessageSend = 1;
            const Keyword = 1;
            const Spam = 3;
            const KeywordPreset = 4;
            const MentionSpam = 5;

            const rulesToCreate = [
                {
                    name: 'AM Bad Words 1',
                    eventType: MessageSend,
                    triggerType: Keyword,
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
                    eventType: MessageSend,
                    triggerType: Keyword,
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
                    eventType: MessageSend,
                    triggerType: Keyword,
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
                    eventType: MessageSend,
                    triggerType: Keyword,
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
                    eventType: MessageSend,
                    triggerType: Keyword,
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
                    eventType: MessageSend,
                    triggerType: Keyword,
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
                    eventType: MessageSend,
                    triggerType: Spam,
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
                    eventType: MessageSend,
                    triggerType: KeywordPreset,
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
                    eventType: MessageSend,
                    triggerType: MentionSpam,
                    triggerMetadata: {
                        mentionTotalLimit: 5
                    },
                    actions: [
                        {
                            type: AutoModerationActionType.BlockMessage,
                            metadata: { customMessage: '🚫 منشن سبام ممنوع.' }
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

            let msg = `✅ تم إنشاء ${created} Rule\n⏭️ تم تخطي ${skipped} Rule موجودين بالفعل`;

            if (errors.length) {
                msg += `\n\n❌ Errors:\n${errors.slice(0, 10).join('\n')}`;
            }

            return interaction.editReply(msg);

        } catch (err) {
            console.error('setup-automod-max error:', err);
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply('❌ حصل خطأ أثناء إنشاء AutoMod Rules.');
            }
            return interaction.reply({
                content: '❌ حصل خطأ أثناء إنشاء AutoMod Rules.',
                ephemeral: true
            });
        }
    }
};
