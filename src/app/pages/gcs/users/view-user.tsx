import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import InputField from '../../../components/InputField'
import { GetUser, RemoveUser } from '../../../Functions/GCS'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const GCSUserView = () => {
	const navigate = useNavigate();
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const id: string | any = searchParams.get('user_id')

	const [userResponseData, setUserResponseData] = useState({
		_id: '',
		uid: '',
		first_name: '',
		last_name: '',
		email: '',
		mobile: '',
		createdAt: '',
		updatedAt: '',
	})

	const fetchUserData = async () => {
		try {
			const response: any = await GetUser({ id: id })
			const filteredData: any = response.data[0]

			setUserResponseData({
				_id: filteredData._id,
				uid: filteredData.uid,
				first_name: filteredData.first_name,
				last_name: filteredData.last_name,
				email: filteredData.email,
				mobile: filteredData.mobile,
				createdAt: filteredData.createdAt,
				updatedAt: filteredData.updatedAt,
			})
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	const delete_user = async () => {
		try {
			const confirmDelete = await Swal.fire({
				title: 'Are you sure?',
				text: 'This user will be removed from the portal and will no longer access it.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes, delete',
			})

			if (confirmDelete.isConfirmed) {
				await RemoveUser({ id })
				fetchUserData()
				toast.success('User removed successfully')

				navigate('/gcs/users')
			}
		} catch (error) {
			console.error(error)
		}
	}

	return (
		<>
			<h1 className='fw-bold text-dark fs-1 mb-6 '>User Details</h1>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-12'>
									<div className='row'>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='User ID'
												type='text'
												className='col-12 fv-row mb-7'
												name='uid'
												label='User ID'
												htmlFor='uid'
												value={userResponseData._id}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='First Name'
												type='text'
												className='col-12 fv-row mb-7'
												name='first_name'
												label='First Name'
												htmlFor='first_name'
												value={userResponseData.first_name}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Last Name'
												type='text'
												className='col-12 fv-row mb-7'
												name='last_name'
												label='Last Name'
												htmlFor='last_name'
												value={userResponseData.last_name}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Email'
												type='email'
												className='col-12 fv-row mb-7'
												name='email'
												label='Email'
												htmlFor='email'
												value={userResponseData.email || 'N/A'}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Mobile Number'
												type='text'
												className='col-12 fv-row mb-7'
												name='mobile'
												label='Mobile Number'
												htmlFor='mobile'
												value={userResponseData.mobile}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Registration Date'
												type='text'
												className='col-12 fv-row mb-7'
												name='createdAt'
												label='Registration Date'
												htmlFor='createdAt'
												value={DayJS(userResponseData.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Last Modification'
												type='text'
												className='col-12 fv-row mb-7'
												name='updatedAt'
												label='Last Modification'
												htmlFor='updatedAt'
												value={DayJS(userResponseData.updatedAt).format('DD/MM/YYYY hh:mm:ss A')}
											/>
										</div>

										<div className='col-md-12 fv-row mb-2 d-flex justify-content-end'>
											<button
												type='button'
												className='btn btn-danger mx-2'
												onClick={delete_user}>
												Remove user
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export { GCSUserView }
