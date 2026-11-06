import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

// Utility function to get nested value from an object
const getNestedValue = (obj: any, path: string) => {
	return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

type SortableField = {
	title: string
	field: string
}

type TableSortProps = {
	sortableFields: SortableField[]
	sort: string
	sortOrder: string
	onSortChange: (sort: string, sortOrder: 'asc' | 'desc') => void
	disableSortFields?: string[]
}

type TableProps = {
	data: any[]
	columns: { title: string; field: string }[]
	sort: string
	sortOrder: 'asc' | 'desc'
	onSortChange: (field: string, sortOrder: 'asc' | 'desc') => void
	renderRow: (item: any, index: number, actualIndex: number, isVisible: boolean) => JSX.Element
	visibleDetails?: string | null
	pagination: { page: number; itemsPerPage: number }
	setPagination: React.Dispatch<React.SetStateAction<{ page: number; itemsPerPage: number }>>
	loading: boolean
	disableSortFields?: string[]
	manualSearch?: string
	removeAction?: boolean
	actionsWidth?: string
}

const Table: React.FC<TableProps> = ({
	data,
	columns,
	sort = 'createdAt',
	sortOrder = 'desc',
	onSortChange,
	renderRow,
	visibleDetails,
	pagination,
	setPagination,
	loading,
	disableSortFields = [],
	manualSearch = '',
	removeAction,
	actionsWidth,
}) => {
	const handleSort = (field: string) => {
		if (disableSortFields.includes(field)) return
		const newSortOrder = sort === field && sortOrder === 'asc' ? 'desc' : 'asc'
		onSortChange(field, newSortOrder)
	}

	const filteredData = React.useMemo(() => {
		if (!data) return []
		if (!manualSearch) return data
		return data.filter((item) => {
			return columns.some((column) => {
				const value = getNestedValue(item, column.field)
				return value && value.toString().toLowerCase().includes(manualSearch.toLowerCase())
			})
		})
	}, [data, columns, manualSearch])

	const sortedData = React.useMemo(() => {
		if (!filteredData || filteredData.length === 0 || !sort) return filteredData || []
		if (disableSortFields.includes(sort)) return filteredData

		return [...filteredData].sort((a, b) => {
			let aVal = getNestedValue(a, sort)
			let bVal = getNestedValue(b, sort)

			if (aVal === undefined || aVal === null) aVal = ''
			if (bVal === undefined || bVal === null) bVal = ''

			// Both numbers
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
			}

			// Numeric strings (e.g. salary, total_present, count, codes)
			const aTrim = String(aVal).trim()
			const bTrim = String(bVal).trim()
			const aNum = Number(aTrim)
			const bNum = Number(bTrim)
			if (!isNaN(aNum) && !isNaN(bNum) && aTrim !== '' && bTrim !== '') {
				return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
			}

			// Date strings
			const aDate = Date.parse(aTrim)
			const bDate = Date.parse(bTrim)
			if (!isNaN(aDate) && !isNaN(bDate) && (aTrim.includes('-') || aTrim.includes('/'))) {
				return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
			}

			// Natural string comparison
			return sortOrder === 'asc'
				? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
				: String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' })
		})
	}, [filteredData, sort, sortOrder, disableSortFields])

	return (
		<div className='gz-inv-table-card' style={{ borderRadius: '16px', background: '#ffffff', border: '1px solid #E4EAF2', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)', overflow: 'hidden' }}>
			<div className='table-responsive'>
				<table
					id='kt_table_users'
					className='gz-inv-table table-hover align-middle mb-0'
					style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}
				>
					<thead>
						<tr style={{ background: '#F8FAFD', borderBottom: '1px solid #E4EAF2' }}>
							<th className='text-center ps-4' style={{ width: '50px', padding: '16px 20px', color: '#71809A', fontSize: '12px', fontWeight: 650, letterSpacing: '0.02em', borderBottom: '1px solid #E4EAF2' }}>#</th>
							{columns.map((field) => {
								let className = 'hide-on-mobile'
								if (columns.indexOf(field) === columns.length - 1) className += ' hide-on-1024'
								if (columns.indexOf(field) === columns.length - 2) className += ' hide-on-768'
								if (columns.indexOf(field) === columns.length - 3) className += ' hide-on-490'
								if (columns.indexOf(field) === 0) className = 'show-on-mobile'

								const isSortable = !disableSortFields.includes(field.field)

								return (
									<th
										key={field.field}
										onClick={() => isSortable && handleSort(field.field)}
										className={`sortable ${field.field} ${className}`}
										style={{
											cursor: isSortable ? 'pointer' : 'default',
											userSelect: 'none',
											padding: '16px 20px',
											color: '#71809A',
											fontSize: '12px',
											fontWeight: 650,
											letterSpacing: '0.02em',
											borderBottom: '1px solid #E4EAF2',
											whiteSpace: 'nowrap',
										}}
									>
										<span>{field.title}</span>
										{isSortable && (
											<FontAwesomeIcon
												icon={
													sort === field.field
														? sortOrder === 'asc'
															? faSortUp
															: faSortDown
														: faSort
												}
												className='ms-2'
												style={{
													fontSize: '11px',
													color: sort === field.field ? '#172B4D' : '#9ca3af',
													verticalAlign: 'middle',
												}}
											/>
										)}
									</th>
								)
							})}
							<th className='text-center pe-4' style={{ width: actionsWidth || '130px', minWidth: actionsWidth || '130px', padding: '16px 20px', color: '#71809A', fontSize: '12px', fontWeight: 650, letterSpacing: '0.02em', borderBottom: '1px solid #E4EAF2' }}>{removeAction ? '' : 'Actions'}</th>
						</tr>
					</thead>
					<tbody>
						{loading &&
							Array.from({ length: Math.min(pagination?.itemsPerPage || 5, 8) }).map(
								(_, rIdx) => (
									<tr key={`gz-skeleton-row-${rIdx}`} className='gz-inv-skeleton-row'>
										<td className='text-center ps-4 py-4' style={{ borderBottom: '1px solid #EEF2F6' }}>
											<div
												className='gz-inv-skeleton'
												style={{
													width: '28px',
													height: '14px',
													borderRadius: '4px',
													margin: '0 auto',
												}}
											/>
										</td>
										{columns.map((col, cIdx) => (
											<td key={`gz-skeleton-col-${cIdx}`} className='py-4' style={{ borderBottom: '1px solid #EEF2F6' }}>
												<div
													className='gz-inv-skeleton'
													style={{
														width:
															cIdx === 0
																? '75%'
																: cIdx % 2 === 0
																? '60%'
																: '85%',
														height: '14px',
														borderRadius: '4px',
													}}
												/>
											</td>
										))}
										{!removeAction && (
											<td className='ps-4 py-4 text-center' style={{ borderBottom: '1px solid #EEF2F6' }}>
												<div
													className='gz-inv-skeleton'
													style={{
														width: '56px',
														height: '24px',
														borderRadius: '8px',
														margin: '0 auto',
													}}
												/>
											</td>
										)}
									</tr>
								)
							)}
						{!loading &&
							sortedData?.map((item, index) => {
								const actualIndex =
									(pagination.page - 1) * pagination.itemsPerPage + index + 1
								const isVisible = visibleDetails === item._id
								return (
									<React.Fragment key={item._id || `${index}-${actualIndex}`}>
										{renderRow(item, index, actualIndex, isVisible)}
									</React.Fragment>
								)
							})}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default Table
