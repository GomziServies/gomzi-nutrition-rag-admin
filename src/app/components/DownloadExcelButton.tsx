import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { DayJS } from '../../_metronic/helpers/Utils'

type Props = {
	onClick?: () => void | Promise<void>
	data?: any[]
	columns?: { title: string; field: string }[]
	filename?: string
	fileName?: string
	sheetName?: string
	disabled?: boolean
	loading?: boolean
	title?: string
	className?: string
}

const DownloadExcelButton: React.FC<Props> = ({
	onClick,
	data,
	columns,
	filename,
	fileName,
	sheetName = 'Sheet1',
	disabled = false,
	loading = false,
	title = 'Download Excel',
	className = '',
}) => {
	const exportFilename = fileName || filename || 'ExportData'
	const [exporting, setExporting] = useState(false)

	const handleExport = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (disabled || exporting || loading) return

		if (onClick) {
			try {
				setExporting(true)
				await onClick()
			} catch (err) {
				console.error('Export error:', err)
			} finally {
				setExporting(false)
			}
			return
		}

		if (!data || data.length === 0) {
			toast.error('No records available to export')
			return
		}

		try {
			setExporting(true)
			const toastId = toast.loading('Exporting Excel...')

			let worksheetData: any[] = []

			if (columns && columns.length > 0) {
				worksheetData = data.map((item, index) => {
					const row: any = { 'No.': index + 1 }
					columns.forEach((col) => {
						if (!col.field || col.field === 'action' || col.field === 'select' || col.field === 'image') return
						// Handle nested paths like employee_details.full_name
						const val = col.field.split('.').reduce((obj: any, key: string) => obj?.[key], item)
						row[col.title || col.field] = val !== undefined && val !== null ? String(val) : '-'
					})
					return row
				})
			} else {
				worksheetData = data.map((item, index) => {
					const cleanItem: any = { 'No.': index + 1 }
					Object.entries(item).forEach(([k, v]) => {
						if (k.startsWith('_') || typeof v === 'function' || typeof v === 'object') return
						cleanItem[k] = v ?? '-'
					})
					return cleanItem
				})
			}

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
			const finalFilename = `${exportFilename}_${DayJS().format('YYYY-MM-DD')}.xlsx`
			XLSX.writeFile(workbook, finalFilename)

			toast.dismiss(toastId)
			toast.success(`${data.length} records exported successfully`)
		} catch (error) {
			console.error('Error generating Excel:', error)
			toast.error('Failed to export Excel')
		} finally {
			setExporting(false)
		}
	}

	const isSpinning = exporting || loading

	return (
		<div className={`d-inline-block ${className}`}>
			<button
				type='button'
				onClick={handleExport}
				disabled={disabled || isSpinning}
				className='gz-excel-download-btn'
				title={title}
				style={{
					width: '38px',
					height: '38px',
					minWidth: '38px',
					padding: 0,
					borderRadius: '8px',
					fontSize: '14px',
					backgroundColor: '#ffffff',
					border: '1px solid #DFE7F0',
					color: '#1E3A5F',
					boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
					transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
					cursor: disabled || isSpinning ? 'not-allowed' : 'pointer',
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onMouseEnter={(e) => {
					if (!disabled && !isSpinning) {
						e.currentTarget.style.backgroundColor = '#1E3A5F'
						e.currentTarget.style.borderColor = '#1E3A5F'
						e.currentTarget.style.color = '#ffffff'
						e.currentTarget.style.boxShadow = '0 4px 10px rgba(30, 58, 95, 0.25)'
						e.currentTarget.style.transform = 'translateY(-1px)'
					}
				}}
				onMouseLeave={(e) => {
					if (!disabled && !isSpinning) {
						e.currentTarget.style.backgroundColor = '#ffffff'
						e.currentTarget.style.borderColor = '#DFE7F0'
						e.currentTarget.style.color = '#1E3A5F'
						e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
						e.currentTarget.style.transform = 'translateY(0)'
					}
				}}>
				{isSpinning ? (
					<span
						className='spinner-border spinner-border-sm'
						role='status'
						aria-hidden='true'
						style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
				) : (
					<FontAwesomeIcon icon={faDownload} />
				)}
			</button>
		</div>
	)
}

export default DownloadExcelButton
