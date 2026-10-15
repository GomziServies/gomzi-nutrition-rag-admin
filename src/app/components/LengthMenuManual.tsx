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
		<div className='d-inline-flex align-items-center'>
			{data.length > 0 && (
				<div className='d-flex align-items-center gap-2'>
					<span className='fs-8 text-muted fw-semibold d-none d-sm-inline'>Show:</span>
					<select
						className='form-select form-select-sm gz-pagination-select'
						style={{
							width: '82px',
							height: '38px',
							borderRadius: '10px',
							border: '1px solid #ded8d2',
							backgroundColor: '#ffffff',
							fontSize: '13px',
							fontWeight: 600,
							color: '#1e293b',
							boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
							cursor: 'pointer',
						}}
						onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
						{options.map((option, index) => (
							<option key={index} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			)}
		</div>
		</>
	)
}

export default LengthMenuManual
