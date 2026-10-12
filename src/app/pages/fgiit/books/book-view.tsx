/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup, GetBooks, RemoveBook, UpdateBook } from '../../../Functions/FGGroup'

const BookView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const book_id: string | any = searchParams.get('book_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [bookViewData, setBookViewData] = useState({
		_id: '',
		book_title: '',
		cover_image: '',
		description: '',
		amount: '',
		updatedAt: '',
		createdAt: '',
		editImage: false,
		selectedFile: null as File | null,
	})
	const navigate = useNavigate()

	const fetchBookData = async () => {
		try {
			const response = await GetBooks({ book_id })

			if (Array.isArray(response.data) && response.data.length > 0) {
				const filteredData: any = response.data[0]
				setBookViewData(filteredData)
			} else {
				toast.error('No book data found')
			}
		} catch (error) {
			console.error(error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setBookViewData((prevData) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
				cover_image: URL.createObjectURL(file),
				editImage: true,
			}))
		} else {
			setBookViewData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleUpdateButtonClick = async () => {
		try {
			setIsSubmitting(true)
			let imgUrl = ''

			if (bookViewData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([bookViewData.selectedFile], {
					directory: 'books',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Book cover uploaded successfully')
			}

			const payload: any = {
				book_id: bookViewData._id,
				book_title: bookViewData.book_title,
				cover_image: imgUrl,
				description: bookViewData.description,
				amount: bookViewData.amount,
				updatedAt: bookViewData.updatedAt,
				createdAt: bookViewData.createdAt,
			}
			await UpdateBook(payload)

			toast.success('Book Updated Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	useEffect(() => {
		fetchBookData()
	}, [])

	const deleteBook = async () => {
		try {
			await RemoveBook({ book_id })
			fetchBookData()
			toast.success('book remove successfully')

			navigate('/fgiit/books')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Book View</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-2 text-center'>
										<img
											alt='Users'
											src={
												bookViewData.cover_image
													? bookViewData.editImage == true
														? bookViewData.cover_image
														: `https://files.fggroup.in/${bookViewData.cover_image}`
													: '/media/avatars/300-1.jpg'
											}
											style={{ borderRadius: '10px', width: '90%' }}
										/>
										<div>
											<button
												type='button'
												className='mt-5 px-2 py-1 mb-2 btn btn-success'
												onClick={handleFileButtonClick}>
												Change cover
											</button>
											<input
												type='file'
												id='fileInput'
												className='d-none'
												onChange={handleInputChange}
											/>
										</div>
									</div>
									<div className='col-md-10'>
										<div className='row'>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Book ID'
													type='text'
													className='col-12 fv-row mb-7'
													name='book_ID'
													label='Book ID'
													htmlFor='book_ID'
													value={bookViewData._id}
													onChange={(e) => handleInputChange(e)}
													readOnly
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Book Name'
													type='text'
													className='col-12 fv-row mb-7'
													name='book_title'
													label='Book Name'
													htmlFor='book_title'
													value={bookViewData.book_title}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Description'
													type='text'
													className='col-12 fv-row mb-7'
													name='description'
													label='Description'
													htmlFor='description'
													value={bookViewData.description}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Amount'
													type='number'
													className='col-12 fv-row mb-7'
													name='amount'
													label='Amount'
													htmlFor='amount'
													value={bookViewData.amount}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Created On'
													type='text'
													className='col-12 fv-row mb-7'
													name='created_on'
													label='Created On'
													htmlFor='created_on'
													value={bookViewData.createdAt}
													onChange={(e) => handleInputChange(e)}
													readOnly
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Last Modification'
													type='text'
													className='col-12 fv-row mb-7'
													name='last_modification'
													label='Last Modification'
													htmlFor='last_modification'
													value={bookViewData.updatedAt}
													onChange={(e) => handleInputChange(e)}
													readOnly
												/>
											</div>

											<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
												<TableButton
													action='edit'
													onClick={handleUpdateButtonClick}
													text={isSubmitting ? 'Please wait, Update...' : 'Update'}
													disabled={isSubmitting}
													backgroundDark={true}
													className={` ${isSubmitting ? 'disabled' : ''}`}
												/>
												<div
													data-bs-toggle='modal'
													data-bs-target='#kt_modal_exercise'>
													<TableButton
														action='remove'
														text='Remove Book'
														backgroundDark={true}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div
					className='modal fade'
					id='kt_modal_exercise'
					aria-hidden='true'>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content border-0'>
							<div className='modal-header border-0 justify-content-end'>
								<button
									type='button'
									className='btn-close'
									data-bs-dismiss='modal'
									aria-label='Close'></button>
							</div>
							<div className='text-center mb-4'>
								<h2
									className='fw-bold mt-3'
									style={{ fontSize: '25px' }}>
									Are you sure?
								</h2>
							</div>
							<div className='modal-body p-5'>
								<h3 className='text-center fw-20'>This Book will be removed from the portal</h3>
							</div>
							<div className='modal-footer border-0 d-flex justify-content-center'>
								<button
									className='btn btn-danger me-3 fs-24'
									onClick={() => deleteBook()}
									style={{ padding: '12px 24px', fontSize: '20px' }}>
									<FontAwesomeIcon
										className='me-2'
										icon={faCheck}
									/>
									Okay
								</button>
								<button
									className='btn btn-success fs-29'
									data-bs-dismiss='modal'
									style={{ padding: '12px 24px', fontSize: '20px' }}>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}
export { BookView }
