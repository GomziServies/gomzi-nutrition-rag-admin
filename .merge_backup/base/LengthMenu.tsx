import React from 'react'

type LengthMenuProps = {
	expenseData: any[]
	handleItemsPerPageChange: (value: number) => void
}

const LengthMenu: React.FC<LengthMenuProps> = ({ expenseData, handleItemsPerPageChange }) => {
	return (
		<>
			<div className='me-3'>
				{expenseData?.length > 0 && (
					<div className='d-flex align-items-center justify-content-between'>
						<div>
							<select
								className='form-select form-select mx-3'
								onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
								<option value='10'>10</option>
								<option value='50'>50</option>
								<option value='100'>100</option>
							</select>
						</div>
					</div>
				)}
			</div>
		</>
	)
}

export default LengthMenu
