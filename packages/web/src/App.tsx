import { useEffect, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DownloadIcon from '@mui/icons-material/Download'
import GitHubIcon from '@mui/icons-material/GitHub'
import HelpIcon from '@mui/icons-material/Help'
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
		supabase.auth
			.getSession()
			.then(({ data: { session } }: { data: { session: Session } }) => {
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

	if (isLoading) {
		return <></>
	}
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
								<Typography variant="caption" component="small">
									To view your grids
								</Typography>
								<Button
									onClick={signInWithDiscord}
									variant="outlined"
								>
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
						<div>
							<Button
								variant="contained"
								size="large"
								startIcon={<DownloadIcon />}
								onClick={(e) => {
									e.preventDefault()
									if (
										confirm(
											'THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
										)
									) {
										window.location.href =
											'https://discord.com/api/oauth2/authorize?client_id=1189312952273223741&scope=applications.commands'
									}
								}}
							>
								Install Guild Grid on your Discord channel
							</Button>
						</div>
						<Card>
							<CardContent>
								<Typography variant="h5" component="div">
									No external accounts, only Discord
								</Typography>

								<Typography variant="body2">
									Your members access and make grids directly
									from within your channel.
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
									instantly generate a collaborative grid.
								</Typography>
							</CardContent>
						</Card>
						<Card>
							<CardContent>
								<Typography variant="h5" component="div">
									Cell-level encryption
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
									See grid changes from all members live in
									real time.
								</Typography>
							</CardContent>
						</Card>
						<Card>
							<CardContent>
								<Typography variant="h5" component="div">
									Open-source
								</Typography>

								<Typography variant="body2">
									Use guildgrid.app or run on your own server.
									The code is open-source and available on
									GitHub. PRs are welcome 😊
								</Typography>
							</CardContent>
						</Card>
					</div>
					<div
						style={{
							display: 'flex',
							columnGap: 15,
							alignItems: 'center',
							justifyContent: 'space-between',
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
						<div
							style={{
								display: 'flex',
								columnGap: 15,
								alignItems: 'center',
							}}
						>
							<Button
								startIcon={<GitHubIcon />}
								href="https://github.com/williamparry/guildgrid.app"
								variant="outlined"
								size="small"
							>
								GitHub
							</Button>
							<Button
								startIcon={<HelpIcon />}
								href="https://discord.gg/kSuSm46sCC"
								variant="outlined"
								color="secondary"
								size="small"
							>
								Help
							</Button>
						</div>
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
