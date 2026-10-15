import React from 'react'

type LengthMenuProps = {
	data: any[]
	options: string[]
	handleItemsPerPageChange: (value: number) => void
}

const LengthMenuManual: React.FC<LengthMenuProps> = ({
	data,
	options,
	handleItemsPerPageChange,
}) => {
	return (
		<>
			<div className='me-3'>
				{data.length > 0 && (
					<div className='d-flex align-items-center justify-content-between'>
						<div>
							<select
								className='form-select form-select mx-3'
								onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
								{options.map((option, index) => (
									<option
										key={index}
										value={option}>
										{option}
									</option>
								))}
							</select>
						</div>
					</div>
				)}
			</div>
		</>
	)
}

export default LengthMenuManual
