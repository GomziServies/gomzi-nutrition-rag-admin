import React, { useEffect, useState } from 'react'
import { KTIcon } from '../../_metronic/helpers'

const SearchFilter: React.FC<{
	searchTerm: string
	style?: React.CSSProperties
	setSearchTerm: React.Dispatch<React.SetStateAction<string>>
}> = ({ searchTerm, setSearchTerm, style }) => {
	const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

	useEffect(() => {
		const handler = setTimeout(() => {
			setSearchTerm(localSearchTerm)
		}, 700)

		return () => {
			clearTimeout(handler)
		}
	}, [localSearchTerm, setSearchTerm])

	return (
		<div className='me-3'>
			<div
				className='d-flex align-items-center position-relative'
				style={style}>
				<KTIcon
					iconName='magnifier'
					className='fs-1 position-absolute ms-6'
				/>
				<input
					type='text'
					data-kt-user-table-filter='search'
					className='form-control form-control-solid bg-secondary w-250px ps-14'
					placeholder='Search...'
					value={localSearchTerm}
					onChange={(e) => setLocalSearchTerm(e.target.value)}
				/>
			</div>
		</div>
	)
}

export default SearchFilter
