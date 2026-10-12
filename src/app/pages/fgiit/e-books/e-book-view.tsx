/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup, GetEBooks, UpdateEBook } from '../../../Functions/FGGroup'

const E_BookView = () => {
	const intl = useIntl()

	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const ebook_id: string | any = searchParams.get('book_id')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const [eBookData, setEBookData] = useState({
		_id: '',
		ebook_title: '',
		file_url: '',
		description: '',
		amount: '',
		updatedAt: '',
		createdAt: '',
		editImage: false,
		selectedFile: null as File | null,
	})

	const fetchUserData = async () => {
		try {
			const response = await GetEBooks({ ebook_id: ebook_id })
			if (Array.isArray(response.data) && response.data.length > 0) {
				const filteredData: any = response.data[0]
				setEBookData(filteredData)
			} else {
				console.error('No book data found')
			}
		} catch (error) {
			console.error(error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setEBookData((prevData) => ({
				...prevData,
				selectedFile: file,
				file_url: URL.createObjectURL(file),
				editImage: true,
			}))
		} else {
			setEBookData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleUpdateButtonClick = async () => {
		try {
			setIsSubmitting(true)
			let imgUrl = ''

			if (eBookData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([eBookData.selectedFile], {
					directory: 'ebooks',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('E-Book cover uploaded successfully')
			}

			const payload: any = {
				ebook_id: eBookData._id,
				ebook_title: eBookData.ebook_title,
				file_url: imgUrl ? imgUrl : eBookData.file_url,
				description: eBookData.description,
				amount: eBookData.amount,
				updatedAt: eBookData.updatedAt,
				createdAt: eBookData.createdAt,
			}
			await UpdateEBook(payload)

			toast.success('E-Book Updated Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>E-Book View</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-3 text-center'>
										<embed
											src={
												eBookData.file_url
													? eBookData.editImage == true
														? eBookData.file_url
														: `https://files.fggroup.in/${eBookData.file_url}`
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
													name='book_ID'
													label='Book ID'
													htmlFor='book_ID'
													value={eBookData._id}
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
													value={eBookData.ebook_title}
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
													value={eBookData.description}
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
													value={eBookData.amount}
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
													value={eBookData.createdAt}
													onChange={(e) => handleInputChange(e)}
													disabled
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
													value={eBookData.updatedAt}
													onChange={(e) => handleInputChange(e)}
													disabled
												/>
											</div>

											<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
												<TableButton
													action='edit'
													onClick={handleUpdateButtonClick}
													text={isSubmitting ? 'Please wait, Updating E-Book...' : 'Update E-Book'}
													showIcon={false}
													disabled={isSubmitting}
													backgroundDark={true}
													className={` ${isSubmitting ? 'disabled' : ''}`}
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
export { E_BookView }
