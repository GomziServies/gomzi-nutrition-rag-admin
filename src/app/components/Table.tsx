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
}) => {
	const handleSort = (field: string) => {
		if (disableSortFields.includes(field)) return
		const newSortOrder = sort === field && sortOrder === 'asc' ? 'desc' : 'asc'
		onSortChange(field, newSortOrder)
	}

	const filteredData = data?.filter((item) => {
		return columns.some((column) => {
			const value = getNestedValue(item, column.field)
			return value && value.toString().toLowerCase().includes(manualSearch.toLowerCase())
		})
	})

	return (
		<>
			<table
				id='kt_table_users'
				className='table align-middle table-row-dashed fs-6 gy-3 dataTable no-footer table-row-gray-200'
				style={{ borderCollapse: 'separate', borderSpacing: 0 }}
			>
				<thead className='table-hide-th'>
					<tr
						className='fw-bolder text-muted text-uppercase fs-8 border-bottom border-gray-200'
						style={{ background: '#f8fafc', height: '42px', verticalAlign: 'middle' }}
					>
						<th className='text-center ps-4 rounded-start' style={{ width: '50px' }}>No.</th>
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
									className={`sortable ${field.field} ${className} py-3`}
									style={{ cursor: isSortable ? 'pointer' : 'default', userSelect: 'none' }}
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
												color: sort === field.field ? '#2563eb' : '#9ca3af',
												verticalAlign: 'middle',
											}}
										/>
									)}
								</th>
							)
						})}
						<th className='text-center pe-4 rounded-end' style={{ width: '130px' }}>{removeAction ? '' : 'Action'}</th>
					</tr>
				</thead>
				<tbody>
					{loading &&
						Array.from({ length: Math.min(pagination?.itemsPerPage || 5, 8) }).map(
							(_, rIdx) => (
								<tr key={`gz-skeleton-row-${rIdx}`} className='gz-skeleton-tr'>
									<td className='text-center ps-4 py-4'>
										<div
											className='gz-skeleton'
											style={{
												width: '28px',
												height: '14px',
												margin: '0 auto',
											}}
										/>
									</td>
									{columns.map((col, cIdx) => (
										<td key={`gz-skeleton-col-${cIdx}`} className='py-4'>
											<div
												className='gz-skeleton'
												style={{
													width:
														cIdx === 0
															? '75%'
															: cIdx % 2 === 0
															? '60%'
															: '85%',
													height: '14px',
												}}
											/>
										</td>
									))}
									{!removeAction && (
										<td className='ps-4 py-4'>
											<div
												className='gz-skeleton'
												style={{
													width: '56px',
													height: '24px',
													borderRadius: '6px',
												}}
											/>
										</td>
									)}
								</tr>
							)
						)}
					{!loading &&
						filteredData?.map((item, index) => {
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
		</>
	)
}

export default Table
