import { useEffect, useState } from 'react'
import { ReactGrid, Column, Row, CellChange } from '@silevis/reactgrid'
import { createClient } from '@supabase/supabase-js'
import { ToastContainer, toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import '@silevis/reactgrid/styles.css'
import 'react-toastify/dist/ReactToastify.css'

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
)

function Grid() {
	const [rows, setRows] = useState<Row[]>([])
	const [columns, setColumns] = useState<Column[]>([])
	const [loading, setLoading] = useState(false)
	const { guildId, gridSlug } = useParams()

	const notifyError = (error: any) => {
		toast.error(`Error: ${error.message}`)
	}

	async function loadGridData() {
		const { data, error } = await supabase
			.from('gg_cells')
			.select('*')
			.eq('guild_id', guildId)
			.eq('grid_slug', gridSlug)

		const rows: Row[] = []
		const columns: Column[] = []

		for (let i = 0; i < 100; i++) {
			rows.push({
				rowId: `R-${i}`,
				cells: Array(100)
					.fill({})
					.map((c, x) => {
						const cellData = data?.find(
							(d) => d.gg_row === i && d.gg_column === x
						)
						return {
							type: 'text',
							text: cellData?.gg_value || '',
							id: cellData?.id, // Store the id of the cell
						}
					}),
			})
			columns.push({ columnId: `C-${i}` })
		}
		setRows(rows)
		setColumns(columns)
	}
	async function handleCellsChanged(changes: CellChange[]) {
		let newRows = [...rows]
		let deleteRequests = []
		let updateRequests = []

		for (const change of changes) {
			if (change.type === 'text') {
				const { rowId, columnId, newCell } = change
				const rowIndex = parseInt((rowId as string).split('-')[1])
				const columnIndex = parseInt((columnId as string).split('-')[1])
				const existingCell = newRows[rowIndex].cells[columnIndex]

				if (newCell.text === '') {
					// Prepare the delete request for cleared cells
					deleteRequests.push({
						grid_slug: gridSlug,
						guild_id: guildId,
						gg_row: rowIndex.toString(),
						gg_column: columnIndex.toString(),
					})
				} else {
					// Prepare the update request for cells with content
					const updateRequest = {
						grid_slug: gridSlug,
						guild_id: guildId,
						gg_row: rowIndex.toString(),
						gg_column: columnIndex.toString(),
						gg_value: newCell.text,
					}
					if (existingCell.id) {
						updateRequest.id = existingCell.id
					}
					updateRequests.push(updateRequest)
				}

				// Update local state optimistically
				newRows[rowIndex].cells[columnIndex] = {
					...newRows[rowIndex].cells[columnIndex],
					type: 'text',
					text: newCell.text,
					validator: (text: string) => true,
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
		setLoading(true)
		loadGridData().finally(() => setLoading(false))
		subscribeToChanges()
	}, [])

	function subscribeToChanges() {
		const cellsSubscription = supabase
			.channel('supabase_realtime')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'gg_cells' },
				(payload) => {
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
					text: newRowData.gg_value,
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
			.map((_, columnIndex) => ({
				type: 'text' as const, // Explicitly specify the cell type as a literal
				text: columnIndex === rowData.gg_column ? rowData.gg_value : '',
			}))

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

	if (loading) {
		return
	}

	return (
		<div id="grid-main">
			<ReactGrid
				rows={rows}
				columns={columns}
				onCellsChanged={handleCellsChanged}
				enableRangeSelection
				enableFillHandle
			/>
			<ToastContainer />
		</div>
	)
}

export default Grid
