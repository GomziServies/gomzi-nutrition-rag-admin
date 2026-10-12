import { useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { loadUserOptionsFGIITStudents } from '../../../components/loadUserOptionsFGIITStudents'
import TableButton from '../../../components/TableButton'
import { AllocateExam } from '../../../Functions/FGGroup'

type Student = {
	_id: string
	first_name: string
	last_name: string
	email: string
	mobile: string
}

const AddAllocation = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const exam_id: string = searchParams.get('exam_id') || ''
	const [dateTime, setDateTime] = useState<string>('')
	const [selected, setSelected] = useState<any[]>([])

	const handleAddAllocation = async () => {
		try {
			const attendees = selected.map((user: any) => ({
				user_id: user.value,
				start_time: new Date(dateTime),
			}))

			await AllocateExam({
				exam_id: exam_id,
				attendees: attendees,
			})

			setSelected([]) // Clear selection
			setDateTime('') // Clear dateTime input
			toast.success('Allocation added successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error('Error adding allocation:', error)
		}
	}

	const handleMultiSelectChange = (selectedOptions: any) => {
		setSelected(selectedOptions || []) // Update selected users
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Allocation</PageTitle>
			<div>
				<div className='row'>
					<div className='col-md-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body row'>
								<div className='col-md-6'>
									<label
										htmlFor='selected'
										className='required fw-bold fs-6 mb-5'>
										Allocated Students
									</label>
									<AsyncPaginate
										debounceTimeout={1000}
										value={selected}
										loadOptions={loadUserOptionsFGIITStudents}
										closeMenuOnSelect={false}
										onChange={handleMultiSelectChange}
										isMulti
									/>
								</div>
								<InputField
									placeholder='Date and time:'
									type='datetime-local'
									className='col-md-6 fv-row mb-7'
									name='dateTime'
									label='Enter Date and time:'
									htmlFor='dateTime'
									value={dateTime}
									onChange={(e) => setDateTime(e.target.value)}
								/>
								<div className='col-md-12 mt-3 d-flex justify-content-end'>
									<TableButton
										action='add'
										onClick={handleAddAllocation}
										text='Add Allocation'
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default AddAllocation
