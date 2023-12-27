import { useEffect, useState } from 'react'
import { createClient, User } from '@supabase/supabase-js'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import CssBaseline from '@mui/material/CssBaseline'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
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
		return (
			<div>
				<button onClick={signInWithDiscord}>
					Sign in with Discord
				</button>
			</div>
		)
	}

	return (
		<Router>
			<ThemeProvider theme={darkTheme}>
				<CssBaseline />
				<AppBar position="static">
					<Toolbar>
						<Typography variant="h6" sx={{ flexGrow: 1 }}>
							<Link
								to="/"
								style={{
									color: '#fff',
									textDecoration: 'none',
								}}
							>
								Guild Grid
							</Link>
						</Typography>
						<IconButton edge="end" color="inherit">
							<AccountCircle />
						</IconButton>
					</Toolbar>
				</AppBar>

				<main>
					<Routes>
						<Route
							path="/"
							element={<Home supabase={supabase} />}
						></Route>
						<Route
							path="/grids/:guildId/:gridSlug"
							element={<Grid supabase={supabase} />}
						></Route>
					</Routes>
				</main>
			</ThemeProvider>
		</Router>
	)
}

export default App
