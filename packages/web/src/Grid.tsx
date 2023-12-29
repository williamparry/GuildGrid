/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { ReactGrid, Column, Row, CellChange } from '@silevis/reactgrid'
import { ToastContainer, toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import '@silevis/reactgrid/styles.css'
import { SupabaseClient } from '@supabase/supabase-js'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import TopBar from './TopBar'
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	TextField,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import CryptoJS from 'crypto-js'

function Grid({ supabase }: { supabase: SupabaseClient }) {
	const [rows, setRows] = useState<Row[]>([])
	const [columns, setColumns] = useState<Column[]>([])
	const [loading, setLoading] = useState(true)
	const { guildId, gridSlug } = useParams()
	const [gridData, setGridData] = useState<any>({})
	const [password, setPassword] = useState<string>()
	const [passwordText, setPasswordText] = useState<string>('')
	const [open, setOpen] = useState(false)
	const [openEnterPassword, setOpenEnterPassword] = useState(false)
	const [hasInitialised, setHasInitialised] = useState(false)

	const notifyError = (error: { message: string }) => {
		toast.error(`Error: ${error.message}`)
	}

	async function loadGridCells() {
		const { data } = await supabase
			.from('gg_cells')
			.select('*')
			.eq('guild_id', guildId)
			.eq('grid_id', gridData.id)

		const rows: Row[] = []
		const columns: Column[] = []

		for (let i = 0; i < 100; i++) {
			rows.push({
				rowId: `R-${i}`,
				cells: Array(100)
					.fill({})
					.map((_c, x) => {
						const cellData = data?.find(
							(d) => d.gg_row === i && d.gg_column === x
						)
						const val = cellData?.gg_value
						return {
							type: 'text',
							text: !val
								? ''
								: password
								? CryptoJS.AES.decrypt(val, password).toString(
										CryptoJS.enc.Utf8
								  )
								: val,
							id: cellData?.id, // Store the id of the cell
						}
					}),
			})
			columns.push({ columnId: `C-${i}` })
		}
		setRows(rows)
		setColumns(columns)
	}

	async function loadGridData() {
		const { data } = await supabase
			.from('gg_grids')
			.select('*')
			.eq('guild_id', guildId)
			.eq('grid_slug', gridSlug)
			.single()
		setGridData(data)
	}
	async function handleCellsChanged(changes: CellChange[]) {
		const newRows = [...rows]
		const deleteRequests = []
		const updateRequests = []

		for (const change of changes) {
			if (change.type === 'text') {
				const { rowId, columnId, newCell } = change
				const rowIndex = parseInt((rowId as string).split('-')[1])
				const columnIndex = parseInt((columnId as string).split('-')[1])
				const existingCell = newRows[rowIndex].cells[columnIndex]

				if (newCell.text === '') {
					// Prepare the delete request for cleared cells
					deleteRequests.push({
						grid_id: gridData.id,
						guild_id: guildId,
						gg_row: rowIndex.toString(),
						gg_column: columnIndex.toString(),
					})
				} else {
					// Prepare the update request for cells with content
					const updateRequest = {
						grid_id: gridData.id,
						guild_id: guildId,
						gg_row: rowIndex.toString(),
						gg_column: columnIndex.toString(),
						gg_value: !newCell.text
							? ''
							: password
							? CryptoJS.AES.encrypt(
									newCell.text,
									password
							  ).toString()
							: newCell.text,
					}

					if ((existingCell as any).id) {
						;(updateRequest as any).id = (existingCell as any).id
					}
					updateRequests.push(updateRequest)
				}

				// Update local state optimistically
				newRows[rowIndex].cells[columnIndex] = {
					...newRows[rowIndex].cells[columnIndex],
					type: 'text',
					text: newCell.text,
					validator: () => true,
				}
			}
		}

		setRows(newRows)

		// Perform the delete operations
		for (const deleteRequest of deleteRequests) {
			const { error } = await supabase
				.from('gg_cells')
				.delete()
				.match(deleteRequest)
			if (error) {
				notifyError(error)
			}
		}

		// Perform the update operations
		if (updateRequests.length > 0) {
			const { error } = await supabase
				.from('gg_cells')
				.upsert(updateRequests)
			if (error) {
				notifyError(error)
			}
		}
	}

	useEffect(() => {
		if (hasInitialised) {
			loadGridCells()
		}
	}, [hasInitialised])

	useEffect(() => {
		if (!loading) {
			if (gridData.has_password) {
				setOpenEnterPassword(true)
			} else {
				setHasInitialised(true)
			}
		}
	}, [gridData, loading])

	useEffect(() => {
		setLoading(true)
		loadGridData().finally(() => {
			setLoading(false)
		})
	}, [])

	useEffect(() => {
		const subscribeWithScope = subscribeToChanges.bind(this as any)
		if (!loading) {
			subscribeWithScope()
		}
	}, [loading, password])

	function subscribeToChanges() {
		const cellsSubscription = supabase
			.channel('supabase_realtime')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'gg_cells' },
				function (payload) {
					const { new: newRow, old: oldRow, eventType } = payload

					switch (eventType) {
						case 'INSERT':
						case 'UPDATE':
							updateLocalGrid(newRow)
							break
						case 'DELETE':
							removeLocalGridRow(oldRow)
							break
					}
				}
			)
			.subscribe()

		return () => {
			cellsSubscription.unsubscribe()
		}
	}

	function updateLocalGrid(newRowData: any) {
		setRows((currentRows) => {
			const rowIndex = currentRows.findIndex(
				(r) => r.rowId === `R-${newRowData.gg_row}`
			)
			if (rowIndex === -1) {
				// Row not found, adding a new row
				return [...currentRows, createRow(newRowData)]
			} else {
				// Updating an existing row
				const updatedRow = { ...currentRows[rowIndex] }

				updatedRow.cells[newRowData.gg_column] = {
					type: 'text',
					text: !newRowData.gg_value
						? ''
						: password
						? CryptoJS.AES.decrypt(
								newRowData.gg_value,
								password
						  ).toString(CryptoJS.enc.Utf8)
						: newRowData.gg_value,
				}
				return [
					...currentRows.slice(0, rowIndex),
					updatedRow,
					...currentRows.slice(rowIndex + 1),
				]
			}
		})
	}

	function createRow(rowData: any): Row {
		const numberOfColumns = 100
		const cells = Array(numberOfColumns)
			.fill({})
			.map((_, columnIndex) => {
				const val = rowData.gg_value
					? ''
					: password
					? CryptoJS.AES.decrypt(rowData.gg_value, password).toString(
							CryptoJS.enc.Utf8
					  )
					: rowData.gg_value

				return {
					type: 'text' as const, // Explicitly specify the cell type as a literal
					text: columnIndex === rowData.gg_column ? val : '',
				}
			})

		return {
			rowId: `R-${rowData.gg_row}`,
			cells: cells,
		}
	}

	function removeLocalGridRow(oldRowData: any) {
		setRows((currentRows) => {
			const rowIndex = currentRows.findIndex(
				(r) => r.rowId === `R-${oldRowData.gg_row}`
			)
			if (rowIndex !== -1) {
				// Row found, remove the cell content
				const updatedRow = { ...currentRows[rowIndex] }
				updatedRow.cells[oldRowData.gg_column] = {
					type: 'text',
					text: '',
				}
				return [
					...currentRows.slice(0, rowIndex),
					updatedRow,
					...currentRows.slice(rowIndex + 1),
				]
			}
			return currentRows
		})
	}

	const handleCreatePassword = async () => {
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
	}

	const handleCloseEnterPassword = () => {
		setOpenEnterPassword(false)
	}

	return (
		<>
			<TopBar
				supabase={supabase}
				rightItems={
					(!password && (
						<IconButton
							edge="end"
							color="inherit"
							onClick={handleCreatePassword}
						>
							<LockOpenIcon />
						</IconButton>
					)) ||
					(password && (
						<IconButton edge="end" color="inherit">
							<LockIcon />
						</IconButton>
					))
				}
			></TopBar>
			<main>
				<div id="grid-main">
					{!loading && (
						<ReactGrid
							rows={rows}
							columns={columns}
							onCellsChanged={handleCellsChanged}
							enableRangeSelection
							enableFillHandle
						/>
					)}
					<ToastContainer />
				</div>
			</main>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Add password</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Adding a password will encrypt your grid contents. Guild
						Grid does not store the decryption code so if you lose
						it, it's lost.
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						id="name"
						label="Password"
						type="text"
						fullWidth
						variant="standard"
						value={passwordText}
						onChange={(e) => {
							setPasswordText(
								(e.target as HTMLInputElement).value
							)
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button
						onClick={async () => {
							if (passwordText) {
								const { error } = await supabase
									.from('gg_grids')
									.update({
										has_password: true,
									})
									.eq('id', gridData.id)
								if (error) {
									notifyError(error)
								}
								setPassword(passwordText)
								handleClose()
							}
						}}
					>
						Set Password
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={openEnterPassword} onClose={handleCloseEnterPassword}>
				<DialogTitle>Enter password</DialogTitle>
				<DialogContent>
					<DialogContentText>
						This grid is password protected. Enter the password to
						view it
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						id="name"
						label="Password"
						type="text"
						fullWidth
						variant="standard"
						value={passwordText}
						onChange={(e) => {
							setPasswordText(
								(e.target as HTMLInputElement).value
							)
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							if (passwordText) {
								setPassword(passwordText)
								handleCloseEnterPassword()
								setHasInitialised(true)
							}
						}}
					>
						Submit
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default Grid
