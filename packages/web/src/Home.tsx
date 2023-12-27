import {
	List,
	ListItemButton,
	ListItemText,
	Paper,
	Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Home({ supabase }) {
	const [loading, setLoading] = useState(false)

	const [grids, setGrids] = useState<
		{
			guild_id: string
			grid_slug: string
			grid_name: string
		}[]
	>([])

	useEffect(() => {
		const fetchGrids = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser()

			if (user) {
				const { data, error } = await supabase
					.from('gg_grids')
					.select('*')
					.eq('created_by_id', user.identities[0].id) // Adjust based on your data model

				if (error) {
					console.error('Error fetching grids:', error)
				} else {
					setGrids(data)
				}
			}
		}

		fetchGrids()
	}, [])

	if (loading) {
		return <div>Loading...</div>
	}

	return (
		<Paper
			sx={{ maxWidth: 600, margin: 'auto', padding: 2, marginTop: 4 }}
			elevation={10}
		>
			<Typography variant="h5" sx={{ marginBottom: 2 }}>
				My Grids
			</Typography>
			<List>
				{grids.map((grid, index) => (
					<ListItemButton
						key={`list-item-${index}`}
						component={Link}
						to={`/grids/${grid.guild_id}/${grid.grid_slug}`}
					>
						<ListItemText primary={grid.grid_name} />
					</ListItemButton>
				))}
			</List>
		</Paper>
	)
}

export default Home
