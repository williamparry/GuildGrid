import { useEffect, useState } from 'react';
import { ReactGrid, Highlight, Column, Row, CellChange } from "@silevis/reactgrid";
import { createClient } from '@supabase/supabase-js';
import { ToastContainer, toast } from 'react-toastify';
import {
    useParams
} from "react-router-dom";
import "@silevis/reactgrid/styles.css";
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function Grid() {
    const [rows, setRows] = useState<Row[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [loading, setLoading] = useState(false);
    const { guildId, gridSlug } = useParams();

    const notifyError = (error: any) => {
        toast.error(`Error: ${error.message}`);
    };

    async function loadGridData() {
        
        const { data, error } = await supabase
            .from('gg_cells')
            .select('*')
            .eq('guild_id', guildId); // Add And

        let rows: Row[] = [];
        let columns: Column[] = [];

        for (var i = 0; i < 100; i++) {
            rows.push({
                rowId: `R-${i}`,
                cells: Array(100).fill({}).map((c, x) => ({ type: "text", text: data?.find(d => d.gg_row == i && d.gg_column == x)?.gg_value || "" }))
            })
            columns.push({ columnId: `C-${i}` })
        }
        setRows(rows)
        setColumns(columns)
    }

    async function handleCellsChanged(changes: CellChange[]) {
        // Prepare the new rows for optimistic update
        let newRows = [...rows];
    
        // Prepare the data for batch server update
        let updates = [];
    
        for (const change of changes) {
            if (change.type === 'text') {
                const { rowId, columnId, newCell } = change;
                const rowIndex = parseInt((rowId as string).split('-')[1]);
                const columnIndex = parseInt((columnId as string).split('-')[1]);
    
                // Update the local state optimistically
                newRows[rowIndex].cells[columnIndex] = { ...newRows[rowIndex].cells[columnIndex], type: 'text', text: newCell.text, validator: (text: string) => true };
    
                // Prepare the update for server
                updates.push({
                    grid_slug: gridSlug,
                    guild_id: guildId,
                    gg_row: rowIndex.toString(),
                    gg_column: columnIndex.toString(),
                    gg_value: newCell.text
                });
            }
        }
    
        // Update the local state
        setRows(newRows);
    
        // Batch update to the server
        const { error } = await supabase.from('gg_cells').upsert(updates);
    
        if (error) {
            // Handle error: Notify user and potentially revert changes
            notifyError(error);
            setRows([...rows]); // Reverting to original rows
        }
    }
    

    useEffect(() => {

        setLoading(true);
        loadGridData().finally(() => setLoading(false));
        subscribeToChanges();

    }, []);

    

    function subscribeToChanges() {
        const cellsSubscription = supabase
            .channel('supabase_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gg_cells' }, payload => {
                loadGridData();
            })
            .subscribe();

        

        // Clean up and unsubscribe when the component unmounts
        return () => {
            cellsSubscription.unsubscribe();
        };
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <ReactGrid
                rows={rows}
                columns={columns}
                onCellsChanged={handleCellsChanged}
                enableRangeSelection
                enableFillHandle
            />
            <ToastContainer />
        </>
    );
}

export default Grid;
