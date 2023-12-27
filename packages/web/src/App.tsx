import { useEffect, useState } from 'react'
import { createClient, User } from '@supabase/supabase-js'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import '@silevis/reactgrid/styles.css'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import 'react-toastify/dist/ReactToastify.css'
import Grid from './Grid'
import { AccountCircle } from '@mui/icons-material'
import Home from './Home'
import { ThemeProvider, createTheme } from '@mui/material'

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
)

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
})

function App() {
	const [user, setUser] = useState<User | null>(null)

	const fetchUser = async () => {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser()
		if (error) {
			console.error('Error fetching user:', error)
			return
		}
		setUser(user)
	}

	async function signInWithDiscord() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'discord',
		})
		if (error) alert(`Login failed: ${error.message}`)
	}

	useEffect(() => {
		if (!user) {
			console.log('user')
			fetchUser()
		} else {
			const { data: authListener } = supabase.auth.onAuthStateChange(
				async (_event, session) => {
					console.log('set')
					setUser(session?.user ?? null)
				}
			)
			return () => {
				authListener?.subscription.unsubscribe()
			}
		}
	}, [])

	if (!user) {
		return <button onClick={signInWithDiscord}>Sign in with Discord</button>
	}

	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" sx={{ flexGrow: 1 }}>
						Guild Grid
					</Typography>
					<IconButton edge="end" color="inherit">
						<AccountCircle />
					</IconButton>
				</Toolbar>
			</AppBar>

			<main>

				
			

			<Router>
				<Routes>
					<Route path="/" element={<Home />}></Route>
					<Route
						path="/grids/:guildId/:gridSlug"
						element={<Grid />}
					></Route>
				</Routes>
			</Router>
			</main>
		</ThemeProvider>
	)
}

export default App
