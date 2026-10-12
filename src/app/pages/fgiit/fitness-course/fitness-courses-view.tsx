import { set } from 'date-fns'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import {
	CreateMaterialOfFitnessCourse,
	DeleteMaterialOfFitnessCourse,
	FileUploadToFGGroup,
	GetFitnessCourse,
	UpdateFitnessCourse,
	UpdateMaterialOfFitnessCourse,
} from '../../../Functions/FGGroup'

const FitnessCoursesView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const course_id = searchParams.get('course_id')

	let [materiallength, setMaterialLength] = useState(0)
	let [updateloading, setUpdateLoading] = useState(false)

	let [loading, setLoading] = useState(false)

	const [course, setCourse] = useState<any>({
		_id: '',
		course_name: '',
		image_url: '',
		description: '',
		currency: '',
		amount: '',
		selectedFile: null,
		imagePreview: null,
	})

	const [materialList, setMaterialList] = useState<any[]>([
		{
			_id: '',
			title: '',
			description: '',
			language: [],
			file_url: null,
			file: null,
			thumbnail: null, // can be a File or a string (URL)
			isNew: false,
		},
	])

	const handleMaterialChange = (index: number, field: string, value: any) => {
		const updatedList = [...materialList]
		updatedList[index][field] = field === 'language' ? [value] : value
		setMaterialList(updatedList)
	}

	const addMaterial = () => {
		// Check if there's already a new material being added
		const hasNewMaterial = materialList.some((material) => material.isNew)

		if (!hasNewMaterial) {
			setMaterialList([
				...materialList,
				{
					_id: '',
					title: '',
					description: '',
					language: [],
					file: null,
					file_url: null,
					thumbnail: null,
					isNew: true,
				},
			])
		} else {
			toast.error('Please complete adding the current material first')
		}
	}

	const createMaterial = async () => {
		setLoading(true)
		try {
			const lastMaterial = materialList[materialList.length - 1]
			const { title, description, language, file, file_url, thumbnail } = lastMaterial

			// validation
			if (!title || !description || !language || (!file_url && !file)) {
				toast.error('Please fill all fields for the proceeding.')
				return
			}

			let uploadedFileUrl = file_url
			if (!file_url && file) {
				const uploadRes: any = await FileUploadToFGGroup([file], {
					directory: 'fitness_materials',
				})
				uploadedFileUrl = uploadRes?.data?.fileURLs?.[0] || ''
			}

			let uploadedThumbnailUrl = thumbnail
			if (thumbnail instanceof File) {
				const uploadRes: any = await FileUploadToFGGroup([thumbnail], {
					directory: 'fitness_materials/thumbnails',
				})
				uploadedThumbnailUrl = uploadRes?.data?.fileURLs?.[0] || ''
			}

			await CreateMaterialOfFitnessCourse({
				course_id: course_id as string,
				material: [
					{
						title,
						description,
						file_url: uploadedFileUrl,
						thumbnail: uploadedThumbnailUrl,
						language: Array.isArray(language) ? language : [language],
					},
				],
			})

			// Show success toast
			toast.success('Material added successfully')

			// Refresh the course data to get the updated material list
			await fetchCourse()
		} catch (err: any) {
			console.error(err)

			if (err?.response?.data?._developer?.length) {
				err.response.data._developer.forEach((devError: any) => {
					toast.error(devError.message)
				})
			} else if (err?.response?.data?.message) {
				toast.error(err.response.data.message)
			} else if (err?.message) {
				toast.error(err.message)
			} else {
				toast.error('Error creating material')
			}
		} finally {
			setLoading(false)
		}
	}

	const removeMaterial = async (index: number) => {
		const item = materialList[index]

		const result = await Swal.fire({
			title: 'Are you sure?',
			text: 'This material will be permanently deleted.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		})

		if (result.isConfirmed) {
			let updatedList = [...materialList]
			updatedList.splice(index, 1)

			if (index === 0 && updatedList.length === 0) {
				updatedList = [
					{
						title: '',
						description: '',
						type: '',
						url: '',
						_id: undefined,
					},
				]
			}

			setMaterialList(updatedList)
			setMaterialLength(0)
			set
			if (item._id) {
				await DeleteMaterialOfFitnessCourse(course._id, item._id)
			}

			Swal.fire('Deleted!', 'The material has been removed.', 'success')
		}
	}

	const fetchCourse = async () => {
		try {
			const res: any = await GetFitnessCourse({ id: course_id || '' })
			if (res?.data?.length > 0) {
				const courseData = res.data[0]

				setCourse((prev: any) => ({ ...prev, ...courseData }))

				if (Array.isArray(courseData.material) && courseData.material.length > 0) {
					const normalizedMaterials = courseData.material.map((item: any) => ({
						_id: item._id || '',
						title: item.title || '',
						description: item.description || '',
						language: Array.isArray(item.language) ? item.language[0] : item.language || '',
						file_url: item.file_url || null,
						file: null,
						thumbnail: item.thumbnail || null,
						isNew: false,
					}))

					setMaterialList(normalizedMaterials)
					setMaterialLength(normalizedMaterials.length)
				} else {
					setMaterialList([
						{
							_id: '',
							title: '',
							description: '',
							language: [],
							file_url: null,
							file: null,
							thumbnail: null,
							isNew: true,
						},
					])
					setMaterialLength(0)
				}
			}
		} catch (err: any) {
			toast.error('Error fetching course')
			console.error(err)
		}
	}

	useEffect(() => {
		if (course_id) fetchCourse()
	}, [course_id])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, files, type } = event.target

		if (type === 'file') {
			const file = files?.[0] || null

			setCourse((prevData: any) => ({
				...prevData,
				[name]: file,
				selectedFile: file,
				imagePreview: file ? URL.createObjectURL(file) : prevData.imagePreview,
			}))
		} else {
			setCourse((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleUpdateFitnessCourse = async () => {

		try {
			setUpdateLoading(true)
			let imgUrl = course.image_url

			if (course.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([course.selectedFile], {
					directory: 'files',
				})
				imgUrl = imageUrl.data?.fileURLs?.[0] || course.image_url
				toast.success('Fitness Course Image uploaded successfully')
			}

			const coursepayload: any = {
				id: course._id,
				course_name: course.course_name,
				image_url: imgUrl,
				description: course.description,
				amount: course.amount,
			}

			await UpdateFitnessCourse(coursepayload)
			toast.success('Fitness Course Updated Successfully')

            
			// material Update
			if (materiallength) {
                for (const material of materialList) {
                    try {
                        const materialpayload: any = {
                            course_id: course._id,
                            material_id: material._id,
                            title: material.title,
                            description: material.description,
                            language: Array.isArray(material.language) ? material.language : [material.language],
                            file_url: material.file_url,
                            thumbnail: material.thumbnail,
                        }

                        // Handle PDF file upload
                        if (material.file instanceof File) {
                            const fileUploadRes: any = await FileUploadToFGGroup([material.file], {
                                directory: 'fitness_materials',
                            })
                            if (fileUploadRes?.data?.fileURLs?.[0]) {
                                materialpayload.file_url = fileUploadRes.data.fileURLs[0]
                            }
                        }
                        
                        // Handle thumbnail upload
                        if (material.thumbnail instanceof File) {
                            const thumbUploadRes: any = await FileUploadToFGGroup([material.thumbnail], {
                                directory: 'fitness_materials/thumbnails',
                            })
                            if (thumbUploadRes?.data?.fileURLs?.[0]) {
                                materialpayload.thumbnail = thumbUploadRes.data.fileURLs[0]
                            }
                        } else if (typeof material.thumbnail === 'string') {
                            materialpayload.thumbnail = material.thumbnail
                        }
                        
                        await UpdateMaterialOfFitnessCourse(materialpayload)
                    } catch (error: any) {
                        console.error('Error updating material:', error)
                        toast.error(`Failed to update material: ${error.message}`)
                    }
                }

                toast.success('Materials Updated Successfully')
                // Refresh the data to get updated content
                await fetchCourse()
			}
		} catch (error: any) {
			toast.error(error.message || 'Update failed')
			console.error(error)
		} finally {
			setUpdateLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Fitness Course</PageTitle>
			<KTCard>
				<div className='card-body'>
					<h2 className='fw-bolder mb-10 mt-5'>Fitness Course</h2>
					<div className='row'>
						<CopyableInput
							placeholder='Course Id'
							type='text'
							className='col-4 fv-row mb-7 input-bg'
							name='_id'
							label='Course Id'
							htmlFor='_id'
							value={course._id}
							readOnly
						/>
						<InputField
							placeholder='Course Name'
							type='text'
							className='col-4 fv-row mb-7 input-bg'
							name='course_name'
							label='Course Name'
							htmlFor='course_name'
							value={course.course_name}
							onChange={(e: any) => handleInputChange(e)}
						/>
						<InputField
							placeholder='Amount'
							type='number'
							className='col-4 fv-row mb-7 input-bg'
							name='amount'
							label='Amount'
							htmlFor='amount'
							value={course.amount}
							onChange={(e: any) => handleInputChange(e)}
						/>

						<div className='col-6 fv-row mb-7 '>
							<h5 className=' fs-6 fw-bold mb-md-5 mb-2 text-start'>Image Preview</h5>
							<div className='d-flex flex-column align-items-center justify-content-center'>
								<img
									alt='Course'
									src={
										course.imagePreview
											? course.imagePreview
											: course.image_url
											? `https://files.fggroup.in/${course.image_url}`
											: 'https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg'
									}
									style={{ borderRadius: '10px', width: '60%' }}
								/>
							</div>
						</div>
						<div className='col-6 fv-row mb-7'>
							<h5 className=' fs-6 fw-bold mb-md-5 mb-2'>Description</h5>
							<textarea
								placeholder='Description'
								name='description'
								id='description'
								className='form-control'
								rows={7}
								value={course?.description}
								onChange={(e: any) => handleInputChange(e)}
							/>
						</div>

						<InputField
							placeholder='Course Image'
							type='file'
							className='col-6 fv-row mb-7'
							name='image_url'
							label='Upload File'
							htmlFor='image_url'
							onChange={(e: any) => handleInputChange(e)}
						/>
						<InputField
							placeholder='Currency'
							type='text'
							className='col-6 fv-row mb-7 input-bg'
							name='currency'
							label='Currency (Contact developer to change currency)'
							htmlFor='currency'
							value={course.currency}
							disabled
						/>
					</div>
					<div className='mt-5 text-end'>
						<TableButton
                            action='edit'
                            onClick={handleUpdateFitnessCourse}
                            text={updateloading ? 'Please wait...' : 'Update'}
                            disabled={updateloading}
                            backgroundDark={true}
                            className={updateloading ? 'text-black' : ''}
          				/>
					</div>
				</div>
			</KTCard>

			<div className='card mt-10'>
				<div className='card-body'>
					<h2 className='fw-bolder mb-10 mt-5'>Fitness Course Material</h2>
					{materialList.map((material, index) => (
						<div
							key={index}
							className='row align-items-end mb-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='Title'
									type='text'
									name='title'
									label='Title'
									htmlFor='title'
									value={material?.title}
									onChange={(e: any) => handleMaterialChange(index, 'title', e.target.value)}
								/>
							</div>
							<div className='col-md-4 mt-4'>
								<h5 className='mb-md-5 mb-2'>Language</h5>
								<SelectField
									className='w-100 fv-row mb-7 me-5'
									label='Language'
									showLabel={false}
									name='Filter Language'
									value={
										Array.isArray(material?.language) ? material.language[0] : material.language
									}
									onChange={(e: any) => handleMaterialChange(index, 'language', e.target.value)}
									htmlFor='Filter Language'
									options={['English', 'Hindi', 'Gujarati']}
								/>
							</div>
							{material?.isNew && (
								<div className='col-md-1 text-center'>
									<button
										className='btn btn-primary fv-row mb-7 input-bg d-flex align-items-center justify-content-center gap-2 fade show'
										type='button'
										disabled={loading}
										onClick={createMaterial}>
										{loading ? (
											<span
												className='spinner-border'
												role='status'
												aria-hidden='true'
											/>
										) : (
											'Add'
										)}
									</button>
								</div>
							)}

							<div className='col-md-1 text-center'>
								<button
									className='btn btn-danger fv-row mb-7 input-bg'
									type='button'
									onClick={() => removeMaterial(index)}>
									Delete
								</button>
							</div>

							<div className='col-12 fv-row'>
								<h5 className=' fs-6 fw-bold mb-md-5 mb-2'>Description</h5>
								<textarea
									placeholder='Description'
									name='description'
									id='description'
									className='form-control'
									rows={3}
									value={material?.description}
									onChange={(e: any) => handleMaterialChange(index, 'description', e.target.value)}
								/>
							</div>

							<div className='col-md-6 mt-6'>
								<h5 className=' fs-6 fw-bold mb-md-5 mb-2'>Book Material Preview</h5>
								{material?.file_url || material?.file ? (
									<>
										<div className='border p-3 rounded mb-3 d-flex flex-column align-items-center justify-content-center gap-5  '>
											<embed
												src={
													material?.file instanceof File
														? URL.createObjectURL(material.file)
														: material.file_url
														? `https://files.fggroup.in/${material.file_url}`
														: ''
												}
												id='file_pdf_preview'
												width={'280px'}
												height={'200px'}
											/>
											<a href={`https://files.fggroup.in/${material.file_url}`} target='_blank'>
												<TableButton
													action='view'
													text='View PDF'
													backgroundDark={true}
												/>
											</a>
										</div>
									</>
								) : (
									<div className='text-muted fst-italic'>No PDF uploaded yet</div>
								)}

								<div className='col-md-6 mt-6  w-100 d-flex flex-column align-items-center justify-content-center '>
									<label
										htmlFor={`material_file_${index}`}
										className='form-label fw-bold'>
										Upload File (PDF only)
									</label>
									<div className='d-flex mt-3 align-items-center gap-3'>
										<TableButton
											action='edit'
											onClick={() => document.getElementById(`edit_pdf_input_${index}`)?.click()}
											text={material.file_url ? 'Update PDF' : 'Add PDf'}
											backgroundDark={true}
										/>
										{/* Hidden File Input */}
										<input
											type='file'
											id={`edit_pdf_input_${index}`}
											accept='application/pdf'
											style={{ display: 'none' }}
											onChange={(e: any) => {
												const file = e.target.files?.[0] || null
												if (file && file.type !== 'application/pdf') {
													toast.error('Only PDF files are allowed!')
													return
												}
												handleMaterialChange(index, 'file', file)
											}}
										/>
									</div>
								</div>
							</div>

							{/* Thumbnail Preview Section */}
							<div className='col-md-6 mt-6'>
								<h5 className='fs-6 fw-bold mb-md-5 mb-2'>Thumbnail Preview</h5>
								{material?.thumbnail ? (
									<div className='border p-3 rounded mb-3 d-flex flex-column align-items-center justify-content-center gap-5'>
										<img
											src={
												material.thumbnail instanceof File
													? URL.createObjectURL(material.thumbnail)
													: material.thumbnail
													? `https://files.fggroup.in/${material.thumbnail}`
													: ''
											}
											alt='Thumbnail Preview'
											width={'280px'}
											height={'200px'}
										/>
										<a
											href={`https://files.fggroup.in/${material.thumbnail}`}
											target='_blank'>
											<TableButton
												action='view'
												text='View Thumbnail'
												backgroundDark={true}
											/>
										</a>
									</div>
								) : (
									<div className='text-muted fst-italic'>No Thumbnail uploaded yet</div>
								)}

								<div className='col-md-6 mt-6 w-100 d-flex flex-column align-items-center justify-content-center'>
									<label className='form-label fw-bold'>Upload Thumbnail (image only)</label>
									<div className='d-flex mt-3 align-items-center gap-3'>
										<TableButton
											action='edit'
											onClick={() =>
												document.getElementById(`edit_thumbnail_input_${index}`)?.click()
											}
											text={material.thumbnail ? 'Update Thumbnail' : 'Add Thumbnail'}
											backgroundDark={true}
										/>
										<input
											type='file'
											id={`edit_thumbnail_input_${index}`}
											accept='image/*'
											style={{ display: 'none' }}
											onChange={(e: any) => {
												const file = e.target.files?.[0] || null
												if (file && !file.type.startsWith('image/')) {
													toast.error('Only image files are allowed!')
													return
												}
												handleMaterialChange(index, 'thumbnail', file)
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					))}

					<div className='text-end'>
						<button
							className='btn btn-primary'
							type='button'
							onClick={addMaterial}>
							+
						</button>
					</div>
				</div>
			</div>
		</>
	)
}

export default FitnessCoursesView
