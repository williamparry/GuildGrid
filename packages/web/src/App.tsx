import { useEffect, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'
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
import {
	Button,
	Menu,
	MenuItem,
	ThemeProvider,
	createTheme,
} from '@mui/material'

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
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const [isLoading, setLoading] = useState(true)
	const [session, setSession] = useState<Session>()

	const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}

	const handleLogout = async () => {
		handleClose()
		await supabase.auth.signOut()
	}

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
		// @ts-ignore
		supabase.auth.getSession().then(({ session }) => {
			setSession(session)
			setLoading(false)
		})
	})

	useEffect(() => {
		if (!isLoading && !user && session) {
			fetchUser()
		} else {
			const { data: authListener } = supabase.auth.onAuthStateChange(
				async (_event, session) => {
					setUser(session?.user ?? null)
				}
			)
			return () => {
				authListener?.subscription.unsubscribe()
			}
		}
	}, [session, isLoading, user])

	if (!user) {
		return (
			<ThemeProvider theme={darkTheme}>
				<CssBaseline />
				<div>
					<Button onClick={signInWithDiscord}>
						Sign in with Discord
					</Button>
				</div>
			</ThemeProvider>
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
						<IconButton
							edge="end"
							color="inherit"
							onClick={handleMenu}
						>
							<AccountCircle />
						</IconButton>
						<Menu
							id="menu-appbar"
							anchorEl={anchorEl}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							keepMounted
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							open={Boolean(anchorEl)}
							onClose={handleClose}
						>
							<MenuItem onClick={handleLogout}>Logout</MenuItem>
						</Menu>
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
