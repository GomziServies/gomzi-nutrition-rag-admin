/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { CreateBook, FileUploadToFGGroup } from '../../../Functions/FGGroup'

const BookAdd = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [bookAddData, setBookAddData] = useState({
		cover_image: '',
		book_title: '',
		description: '',
		amount: '',
		selectedFile: null as File | null,
	})
	const navigate = useNavigate()

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setBookAddData((prevData) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
				cover_image: URL.createObjectURL(file),
				editImage: true,
			}))
		} else {
			setBookAddData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleAddButtonClick = async () => {
		if (!bookAddData.book_title || !bookAddData.description || !bookAddData.amount) {
			toast.error('All Fields Required')
			return
		}

		try {
			setIsSubmitting(true)
			let imgUrl = ''

			if (bookAddData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([bookAddData.selectedFile], {
					directory: 'books',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Book cover uploaded successfully')
			}

			const payload: any = {
				cover_image: imgUrl,
				book_title: bookAddData.book_title,
				description: bookAddData.description,
				amount: bookAddData.amount,
			}

			await CreateBook(payload)

			toast.success('Book Created Successfully')
			setIsSubmitting(false)

			navigate('/fgiit/books')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Book Details</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-2 text-center'>
										<img
											alt='Photos'
											src={bookAddData.cover_image || '/media/avatars/300-1.jpg'}
											style={{ borderRadius: '10px', width: '70%' }}
										/>
										<div>
											<button
												type='button'
												className='mt-5 px-2 py-1 mb-2 btn btn-success'
												onClick={handleFileButtonClick}>
												Upload Photo
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
										<div className='row justify-content-end'>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Book Name'
													type='text'
													className='col-12 fv-row mb-7'
													name='book_title'
													label='Book Name'
													htmlFor='book_title'
													value={bookAddData.book_title}
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
													value={bookAddData.description}
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
													value={bookAddData.amount}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-2 fv-row mt-4 mb-2 d-flex justify-content-end'>
												<TableButton
													action='add'
													onClick={handleAddButtonClick}
													text={isSubmitting ? 'Please wait, Adding Book...' : 'Add Book'}
													showIcon={false}
													disabled={isSubmitting}
													className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}
export { BookAdd }
