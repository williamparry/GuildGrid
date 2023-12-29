import { useEffect, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline'
import 'react-toastify/dist/ReactToastify.css'
import Grid from './Grid'
import Home from './Home'
import { Button, ThemeProvider, createTheme } from '@mui/material'

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
