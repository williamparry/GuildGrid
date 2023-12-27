import { Routes, REST, Client, GatewayIntentBits } from 'discord.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_KEY
)
const commands = [
	{
		name: 'grid',
		description: 'Create a new grid',
		options: [
			{
				name: 'grid_name',
				type: 3, // Type 3 corresponds to a string
				description: 'Name for the new grid',
				required: false,
			},
		],
	},
]
async function registerCommands() {
	const rest = new REST({ version: '9' }).setToken(
		process.env.DISCORD_BOT_TOKEN
	)
	try {
		console.log('Started refreshing application (/) commands.')
		await rest.put(
			Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
			{ body: commands }
		)

		console.log('Successfully reloaded application (/) commands.')
	} catch (error) {
		console.error(error)
	}
}

async function insertNewGuild(guildId) {
	try {
		// Check if the guild already exists in the database
		const { data } = await supabase
			.from('gg_guilds')
			.select('id')
			.eq('id', guildId)
			.single()

		// If the guild does not exist, insert it
		if (!data) {
			const { error: insertError } = await supabase
				.from('gg_guilds')
				.insert([{ id: guildId }])
			if (insertError) {
				console.error(
					'Error adding new guild to database:',
					insertError
				)
			} else {
				console.log(`Added guild ${guildId} to database.`)
			}
		}
	} catch (error) {
		console.error('Error handling new guild:', error)
	}
}

async function updateGuildMemberships(guild) {
	try {
		// Check if the guild is currently being updated
		const { data: guildData, error: guildFetchError } = await supabase
			.from('gg_guilds')
			.select('is_updating')
			.eq('id', guild.id)
			.single()

		if (guildFetchError) {
			console.error(
				`Error fetching guild data for ${guild.id}:`,
				guildFetchError
			)
			return
		}

		if (guildData?.is_updating) {
			console.log(
				`Guild ${guild.id} is currently being updated by another process.`
			)
			return
		}

		// Set the guild as updating
		await supabase
			.from('gg_guilds')
			.update({ is_updating: true })
			.eq('id', guild.id)

		// Fetch current guild members
		const currentMembers = await guild.members.fetch()
		const currentMemberIds = currentMembers.map((member) => member.user.id)

		console.log('currentMemberIds', currentMemberIds)

		// Fetch stored memberships
		const { data: storedMemberships, error: fetchError } = await supabase
			.from('gg_guild_memberships')
			.select('user_id')
			.eq('guild_id', guild.id)

		if (fetchError) {
			console.error('Error fetching stored memberships:', fetchError)
			throw fetchError // Throw error to ensure is_updating is reset
		}

		// Determine members to add and remove
		const storedMemberIds = storedMemberships.map(
			(membership) => membership.user_id
		)
		const membersToAdd = currentMemberIds.filter(
			(id) => !storedMemberIds.includes(id)
		)
		const membersToRemove = storedMemberIds.filter(
			(id) => !currentMemberIds.includes(id)
		)

		console.log('membersToAdd', membersToAdd)

		// Perform bulk insert for new members
		for (const userId of membersToAdd) {
			await supabase
				.from('gg_guild_memberships')
				.insert({ user_id: userId, guild_id: guild.id })
		}

		// Perform bulk delete for members to remove
		for (const memberId of membersToRemove) {
			await supabase
				.from('gg_guild_memberships')
				.delete()
				.match({ user_id: memberId, guild_id: guild.id })
		}

		// Reset the is_updating flag after update
		await supabase
			.from('gg_guilds')
			.update({ is_updating: false })
			.eq('id', guild.id)
	} catch (error) {
		console.error(`Failed to process guild ${guild.id}:`, error)
		// Reset the is_updating flag in case of error
		await supabase
			.from('gg_guilds')
			.update({ is_updating: false })
			.eq('id', guild.id)
	}
}

const startBot = async () => {
	const client = new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	})

	client.once('ready', async () => {
		console.log(`Logged in as ${client.user.tag}!`)
		console.log('guilds', client.guilds)
		try {
			client.guilds.cache.forEach(async (guild) => {
				await insertNewGuild(guild.id)
				await updateGuildMemberships(guild)
			})
		} catch (error) {
			console.error('Error handling guilds:', error)
		}
	})

	client.on('guildCreate', async (guild) => {
		await insertNewGuild(guild.id)
		await updateGuildMemberships(guild)
	})

	client.on('guildCreate', async (guild) => {
		try {
			// Insert the new guild into the gg_guilds table
			const { error } = await supabase
				.from('gg_guilds')
				.insert([{ id: guild.id }])

			if (error) {
				console.error('Error adding new guild to database:', error)
			} else {
				console.log(`Added guild ${guild.id} to database.`)
			}
		} catch (error) {
			console.error('Error handling new guild:', error)
		}
	})

	client.on('guildMemberAdd', async (member) => {
		// Add to gg_guild_memberships table in Supabase
		const { error } = await supabase
			.from('gg_guild_memberships')
			.insert([{ user_id: member.user.id, guild_id: member.guild.id }])

		if (error) console.error('Error adding guild member:', error)
	})

	client.on('guildMemberRemove', async (member) => {
		// Remove from gg_guild_memberships table in Supabase
		const { error } = await supabase
			.from('gg_guild_memberships')
			.delete()
			.match({ user_id: member.user.id, guild_id: member.guild.id })

		if (error) console.error('Error removing guild member:', error)
	})

	client.on('interactionCreate', async (interaction) => {
		if (!interaction.isCommand()) return

		if (interaction.commandName === 'grid') {
			const gridName =
				interaction.options.getString('grid_name') ||
				`${interaction.user.username}'s grid`
			const randomString = Math.random().toString(36).substr(2, 5) // Short random string
			const gridSlugBase = gridName
				.toLowerCase()
				.replace(/\s+/g, '-')
				.replace(/[^a-z0-9-]/g, '')
			const gridSlug = `${gridSlugBase}-${randomString}`.substr(0, 100) // Ensuring it doesn't exceed 100 chars

			// Generate a new grid instance and store in the database
			const { data, error } = await supabase
				.from('gg_grids')
				.insert([
					{
						guild_id: interaction.guildId,
						grid_name: gridName,
						grid_slug: gridSlug,
						created_by_id: interaction.user.id,
						created_by_username: interaction.user.username,
					},
				])
				.select()

			if (error) {
				console.error('Error creating grid:', error)
				return interaction.reply('Failed to create a grid.')
			}

			const baseUrl = process.env.CODESPACES
				? `https://${process.env.CODESPACE_NAME}-5173.app.github.dev`
				: 'https://guildgrid.app'
			const gridUrl = `${baseUrl}/grids/${interaction.guildId}/${gridSlug}`
			await interaction.reply(`Here's your grid: ${gridUrl}`)
		}
	})

	client.login(process.env.DISCORD_BOT_TOKEN)
}

registerCommands()
startBot()
