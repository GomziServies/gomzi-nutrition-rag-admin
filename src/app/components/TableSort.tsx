import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

type SortableField = {
	title: string
	field: string
}

type TableSortProps = {
	sortableFields: SortableField[]
	sort: string
	sortOrder: 'asc' | 'desc'
	onSortChange: (sort: string, sortOrder: 'asc' | 'desc') => void
	disableSortFields?: string[]
}

const TableSort: React.FC<TableSortProps> = ({
	disableSortFields = [],
	sortableFields,
	sort,
	sortOrder,
	onSortChange,
}) => {
	const handleSort = (field: string) => {
		if (!disableSortFields.includes(field)) {
			const newSortOrder = sort === field && sortOrder === 'asc' ? 'desc' : 'asc'
			onSortChange(field, newSortOrder)
		}
	}

	return (
		<thead className='table-hide-th'>
			<tr className='fw-bold text-muted bg-light border-bottom-0'>
				<th className='text-center rounded-start'>No.</th>
				{sortableFields.map((field) => (
					<th
						key={field.field}
						onClick={() => handleSort(field.field)}
						className={disableSortFields.includes(field.field) ? 'disable-sort' : 'sortable'}>
						{field.title}	
						{!disableSortFields.includes(field.field) && (
							<FontAwesomeIcon
								icon={sort === field.field ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort}
								className='ms-2'
							/>
						)}
					</th>
				))}
				<th className='ps-4 rounded-end'>Action</th>
			</tr>
		</thead>
	)
}

export default TableSort
