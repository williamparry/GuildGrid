import { useEffect, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline'
import 'react-toastify/dist/ReactToastify.css'
import Grid from './Grid'
import Home from './Home'
import {
	Button,
	Card,
	CardContent,
	Container,
	ThemeProvider,
	Typography,
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
	const [isLoading, setLoading] = useState(true)
	const [session, setSession] = useState<Session>()

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
				<Container maxWidth="sm">
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							rowGap: 30,
							marginTop: 30,
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<Typography
								variant="h2"
								component="div"
								style={{ flexShrink: 0 }}
							>
								Guild Grid
							</Typography>
							<div
								style={{
									display: 'flex',
									justifyContent: 'flex-end',
									flexDirection: 'column',
								}}
							>
								<Button onClick={signInWithDiscord}>
									Sign in with Discord
								</Button>
							</div>
						</div>
						<Typography variant="h6" component="h2">
							Make collaborative data grids within Discord.
							<br />
							No more Google Sheets.
						</Typography>
						<img
							src="/screenshot.png"
							alt="Guild Grid screenshot"
							width="100%"
						/>
						<Card>
							<CardContent>
								<Typography variant="h5" component="div">
									Use your Discord account
								</Typography>

								<Typography variant="body2">
									Your Discord channel users can access and
									make grids directly from Discord using their
									existing accounts.
								</Typography>
							</CardContent>
						</Card>
						<Card>
							<CardContent>
								<Typography variant="h5" component="div">
									Bot included
								</Typography>

								<Typography variant="body2">
									Just use the <code>/grid</code> command to
									generate a collaborative grid.
								</Typography>
							</CardContent>
						</Card>
						<Card>
							<CardContent>
								<Typography variant="h5" component="div">
									Cell-level encryption.
								</Typography>

								<Typography variant="body2">
									Optional encryption for your grid cells
									means that Guild Grid cannot see the
									contents.
								</Typography>
							</CardContent>
						</Card>
						<Card>
							<CardContent>
								<Typography variant="h5" component="div">
									Realtime
								</Typography>

								<Typography variant="body2">
									See changes in real time.
								</Typography>
							</CardContent>
						</Card>
					</div>
					<div
						style={{
							display: 'flex',
							columnGap: 15,
							alignItems: 'center',
						}}
					>
						<Typography
							variant="body2"
							style={{
								textAlign: 'center',
								marginTop: 30,
								marginBottom: 30,
							}}
						>
							Made in Sydney, Australia
						</Typography>
						<Button
							href="https://discord.gg/kSuSm46sCC"
							variant="outlined"
							size="small"
						>
							Request early access
						</Button>
					</div>
				</Container>
			</ThemeProvider>
		)
	}

	return (
		<Router>
			<ThemeProvider theme={darkTheme}>
				<CssBaseline />

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
			</ThemeProvider>
		</Router>
	)
}

export default App
