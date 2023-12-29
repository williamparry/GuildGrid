import { AccountCircle } from '@mui/icons-material'
import {
	AppBar,
	IconButton,
	Menu,
	MenuItem,
	Toolbar,
	Typography,
} from '@mui/material'
import { SupabaseClient } from '@supabase/supabase-js'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function TopBar({
	supabase,
	leftItems,
	rightItems,
}: {
	supabase: SupabaseClient
	leftItems?: React.ReactNode
	rightItems?: React.ReactNode
}) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

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

	return (
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
					{leftItems}
				</Typography>

				{rightItems}

				<IconButton edge="end" color="inherit" onClick={handleMenu}>
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
	)
}

export default TopBar
