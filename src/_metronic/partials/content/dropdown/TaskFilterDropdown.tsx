/* eslint-disable jsx-a11y/anchor-is-valid */

export function TaskFilterDropdown() {
	return (
		<div
			className='menu menu-sub menu-sub-dropdown w-250px w-md-300px'
			data-kt-menu='true'>
			<div className='px-7 py-5'>
				<div className='fs-5 text-dark fw-bolder'>Filter Options</div>
			</div>

			<div className='separator border-gray-200'></div>

			<div className='px-7 py-5'>
				<div className='mb-10'>
					<label
						htmlFor='dfsf'
						className='form-label fw-bold'>
						Filter by Status:
					</label>
					<div>
						<select
							className='form-select form-select-solid'
							data-kt-select2='true'
							data-placeholder='Select option'
							data-allow-clear='true'
							defaultValue={'1'}>
							<option></option>
							<option value='1'>Pending</option>
							<option value='2'>In Progress</option>
							<option value='3'>Completed</option>
						</select>
					</div>
				</div>
				<div className='d-flex justify-content-end'>
					<button
						type='reset'
						className='btn btn-sm btn-light btn-active-light-primary me-2'
						data-kt-menu-dismiss='true'>
						Reset
					</button>

					<button
						type='submit'
						className='btn btn-sm btn-primary'
						data-kt-menu-dismiss='true'>
						Apply
					</button>
				</div>
			</div>
		</div>
	)
}
