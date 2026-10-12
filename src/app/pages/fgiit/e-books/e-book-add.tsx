import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { CreateEBook, FileUploadToFGGroup } from '../../../Functions/FGGroup'

const E_BookAdd = () => {
	const navigate = useNavigate()
	const [EBookAddData, setEBookAddData] = useState({
		_id: '',
		file_url: '',
		ebook_title: '',
		description: '',
		amount: '',
		editImage: false,
		selectedFile: null as File | null,
	})

	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setEBookAddData((prevData) => ({
				...prevData,
				selectedFile: file,
				file_url: URL.createObjectURL(file),
				editImage: true,
			}))
		} else {
			setEBookAddData((prevData) => ({
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
		if (!EBookAddData.ebook_title || !EBookAddData.description || !EBookAddData.amount) {
			toast.error('All Fields Required')
			return
		}

		try {
			setIsSubmitting(true)
			let imgUrl = ''

			if (EBookAddData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([EBookAddData.selectedFile], {
					directory: 'ebooks',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Book cover uploaded successfully')
			}

			const payload: any = {
				file_url: imgUrl,
				ebook_title: EBookAddData.ebook_title,
				description: EBookAddData.description,
				amount: EBookAddData.amount,
			}

			await CreateEBook(payload)

			toast.success('E-Book Created Successfully')
			setIsSubmitting(false)

			navigate('/fgiit/e-book')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>E-Book Details</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-3 text-center'>
										<embed
											src={
												EBookAddData.file_url
													? EBookAddData.editImage == true
														? EBookAddData.file_url
														: `https://files.fggroup.in/${EBookAddData.file_url}`
													: '/media/avatars/300-1.jpg'
											}
											id='file_pdf_preview'
											width={'200px'}
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
									<div className='col-md-9'>
										<div className='row'>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Book ID'
													type='text'
													className='col-12 fv-row mb-7'
													name='ebook_id'
													label='Book ID'
													htmlFor='ebook_id'
													value={EBookAddData._id}
													onChange={(e) => handleInputChange(e)}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Book Name'
													type='text'
													className='col-12 fv-row mb-7'
													name='ebook_title'
													label='Book Name'
													htmlFor='ebook_title'
													value={EBookAddData.ebook_title}
													onChange={(e) => handleInputChange(e)}
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
													value={EBookAddData.description}
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
													value={EBookAddData.amount}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
												<TableButton
													action='add'
													onClick={handleAddButtonClick}
													text={isSubmitting ? 'Please wait, Adding E-Book...' : 'Add E-Book'}
													showIcon={false}
													disabled={isSubmitting}
													className={`${isSubmitting ? 'disabled' : ''}`}
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
export { E_BookAdd }
