import { useEffect, useState } from 'react'
import {
	ReactGrid,
	Highlight,
	Column,
	Row,
	CellChange,
} from '@silevis/reactgrid'
import { createClient } from '@supabase/supabase-js'
import { ToastContainer, toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import '@silevis/reactgrid/styles.css'
import 'react-toastify/dist/ReactToastify.css'
import {
	Link,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Paper,
	Typography,
} from '@mui/material'

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
)

function Home() {
	const [loading, setLoading] = useState(false)

	const [grids, setGrids] = useState<
		{
			guild_id: string
			gridSlug: string
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
		<Paper sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
			<Typography variant="h4" sx={{ marginBottom: 2 }}>
				My Grids
			</Typography>
			<List>
				{grids.map((grid, index) => (
					<ListItemButton
						key={index}
						component={Link}
						href={`/grids/${grid.guild_id}/${grid.grid_slug}`}
					>
						<ListItemText primary={grid.grid_name} />
					</ListItemButton>
				))}
			</List>
		</Paper>
	)
}

export default Home
