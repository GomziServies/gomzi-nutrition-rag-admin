import React, { useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import {
	CreateMotivationSong,
	GetMotivationSong,
	RemoveMotivationSong,
	UpdateMotivationSong,
} from '../../../Functions/FWG/MotivationSong'
import Swal from 'sweetalert2'

const SongPage: React.FC = () => {
	const [showModal, setShowModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [assignSongData, setAssignSongData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [addSongData, setAddSongData] = useState<any>({})
	const [updateSongData, setUpdateSongData] = useState<any>({})
	const [updateId, setUpdateId] = useState<any>('')

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name } = event.target

		if (
			event.target instanceof HTMLInputElement &&
			event.target.type === 'file' &&
			event.target.files
		) {
			const file = event.target.files[0]
			if (file) {
				setAddSongData((prevData: any) => ({
					...prevData,
					[name]: file, // Store the File object directly
				}))
			}
		} else {
			setAddSongData((prevData: any) => ({
				...prevData,
				[name]: event.target.value,
			}))
		}
	}

	const handleEditInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name } = event.target

		if (
			event.target instanceof HTMLInputElement &&
			event.target.type === 'file' &&
			event.target.files
		) {
			const file = event.target.files[0]
			if (file) {
				setUpdateSongData((prevData: any) => ({
					...prevData,
					[name]: file, // Store the File object directly
				}))
			}
		} else {
			setUpdateSongData((prevData: any) => ({
				...prevData,
				[name]: event.target.value,
			}))
		}
	}

	const fetchAssignSongData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetMotivationSong()
			let filteredData: any = response.data

			setAssignSongData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchAssignSongData()
	}, [])

	const handleSubmit = async () => {
		try {
			const { title, url, description, thumbnail_url } = addSongData

			let fileUrl = ''
			if (url instanceof File) {
				const response: any = await FileUploadToFGGroup([url], {
					directory: 'files',
				})
				fileUrl = response.data?.fileURLs[0]
				toast.success('Music uploaded successfully')
			}

			let thumbnail_fileUrl = ''
			if (thumbnail_url instanceof File) {
				const response: any = await FileUploadToFGGroup([thumbnail_url], {
					directory: 'files',
				})
				thumbnail_fileUrl = response.data?.fileURLs[0]
				toast.success('Thumbnail uploaded successfully')
			}

			const payload: any = {
				title,
				url: fileUrl,
				description,
				thumbnail_url: thumbnail_fileUrl,
			}

			await CreateMotivationSong(payload)

			setShowModal(false)
			toast.success('Song Created Successfully')
			fetchAssignSongData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleUpdate = async (id: any) => {
		try {
			const { title, url, description, thumbnail_url, _id } = updateSongData

			let fileUrl = ''
			if (url instanceof File) {
				const response: any = await FileUploadToFGGroup([url], {
					directory: 'files',
				})
				fileUrl = response.data?.fileURLs[0]
				toast.success('Music uploaded successfully')
			}

			let thumbnail_fileUrl = ''
			if (thumbnail_url instanceof File) {
				const response: any = await FileUploadToFGGroup([thumbnail_url], {
					directory: 'files',
				})
				thumbnail_fileUrl = response.data?.fileURLs[0]
				toast.success('Thumbnail uploaded successfully')
			}

			const payload: any = {
				title,
				url: fileUrl ? fileUrl : url,
				description,
				thumbnail_url: thumbnail_fileUrl ? thumbnail_fileUrl : thumbnail_url,
				id: _id,
			}

			await UpdateMotivationSong(payload)

			setShowUpdateModal(false)
			toast.success('Song Updated Successfully')
			fetchAssignSongData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleDelete = async (_id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveMotivationSong({ id: _id })
					toast.success('Song Deleted Successfully')
					fetchAssignSongData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const ShowDocument = (document: any) => {
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
	}

	const handleFileButtonClick = (id: any) => {
		const fileInput = document.getElementById(id) as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Song Details</PageTitle>
			<KTCard>
				<div className='row card-header border-0 pt-0 align-items-center ms-0 mx-md-6 p-0'>
					<div className='col-md-12'>
						<div className='row mt-3 justify-content-between'>
							<div className='col-md-12 mt-md-7 d-flex justify-content-end align-items-center card-toolbar'>
								<div className='d-md-flex'>
									<div className='mt-md-0 mt-4 me-md-3 me-0'>
										<button
											onClick={() => setShowModal(true)}
											className='ms-md-3 mt-md-1 btn btn-primary btn-sm w-md-20 w-100'>
											<KTIcon
												iconName='plus'
												className='fs-2'
											/>
											Add Song
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Song</th>
									<th>Description</th>
									<th>Thumbnail</th>
									<th>Music</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									assignSongData.slice().map((data: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1

										return (
											<tr key={actualIndex}>
												<td className='text-center'>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.title || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.description || '-'}
													</span>
												</td>
												<td>
													{data.thumbnail_url ? (
														<img
															onClick={() => ShowDocument(data.thumbnail_url)}
															src={`https://files.fggroup.in/${data.thumbnail_url}`}
															alt='song file'
															style={{ width: '150px', height: 'auto' }}
															role='button'
														/>
													) : (
														'No file'
													)}
												</td>
												<td>
													{data.url ? (
														<audio
															controls
															src={`https://files.fggroup.in/${data.url}`}
															style={{ width: '250px' }}
														/>
													) : (
														'No file'
													)}
												</td>
												<td>
													<TableButton
														action='edit'
														onClick={() => {
															setShowUpdateModal(true)
															setUpdateSongData(data)
														}}
													/>
													<TableButton
														action='remove'
														onClick={() => handleDelete(data._id)}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>

					{assignSongData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}

					{assignSongData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(assignSongData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>

				<Modal
					show={showModal}
					onHide={() => setShowModal(false)}
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Add Song</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						{/* Form fields */}
						<InputField
							placeholder='Song Thumbnail'
							type='file'
							className='fv-row mb-7'
							name='thumbnail_url'
							label='Song Thumbnail'
							htmlFor='thumbnail_url'
							onChange={handleInputChange}
						/>
						<InputField
							placeholder='Song Title'
							type='text'
							className='fv-row mb-7'
							name='title'
							label='Song Title'
							htmlFor='title'
							value={addSongData.title}
							onChange={handleInputChange}
						/>
						<InputField
							placeholder='Description'
							type='text'
							className='fv-row mb-7'
							name='description'
							label='Description'
							htmlFor='description'
							value={addSongData.description}
							onChange={handleInputChange}
						/>
						<InputField
							placeholder='Music'
							type='file'
							className='fv-row mb-7'
							name='url'
							label='Music'
							htmlFor='url'
							onChange={handleInputChange}
						/>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant='secondary'
							onClick={() => setShowModal(false)}>
							Close
						</Button>
						<Button
							variant='primary'
							onClick={handleSubmit}>
							Add Song
						</Button>
					</Modal.Footer>
				</Modal>

				<Modal
					show={showUpdateModal}
					onHide={() => setShowUpdateModal(false)}
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Update Song</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						{/* Form fields */}
						<label
							htmlFor='thumbnail_url'
							className={`fw-bold fs-6 mb-md-5 mb-2 ${
								updateSongData.thumbnail_url instanceof File ? 'd-none' : 'd-block'
							}`}>
							Song Thumbnail
						</label>
						<div className={`mb-6`}>
							{updateSongData.thumbnail_url ? (
								<img
									onClick={() => ShowDocument(updateSongData.thumbnail_url)}
									src={`https://files.fggroup.in/${updateSongData.thumbnail_url}`}
									alt='song file'
									style={{ width: '150px', height: 'auto' }}
									role='button'
									className={` ${
										updateSongData.thumbnail_url instanceof File ? 'd-none' : 'd-block'
									}`}
								/>
							) : (
								'No file'
							)}
							<InputField
								placeholder='Song Thumbnail'
								type='file'
								className={`fv-row ${
									updateSongData.thumbnail_url instanceof File ? 'd-block' : 'd-none'
								}`}
								name='thumbnail_url'
								label='Song Thumbnail'
								htmlFor='thumbnail_url'
								id='thumbnail_url'
								marginRemove={true}
								// value={updateSongData.thumbnail_url}
								onChange={handleEditInputChange}
							/>
							<div>
								<button
									type='button'
									className='mt-5 px-2 py-1 mb-2 btn btn-success'
									onClick={() => handleFileButtonClick('thumbnail_url')}>
									Change Thumbnail
								</button>
							</div>
						</div>
						<InputField
							placeholder='Song Title'
							type='text'
							className='fv-row mb-7'
							name='title'
							label='Song Title'
							htmlFor='title'
							value={updateSongData.title}
							onChange={handleEditInputChange}
						/>
						<InputField
							placeholder='Description'
							type='text'
							className='fv-row mb-7'
							name='description'
							label='Description'
							htmlFor='description'
							value={updateSongData.description}
							onChange={handleEditInputChange}
						/>

						<label
							htmlFor='url'
							className={`fw-bold fs-6 mb-md-5 mb-2 ${
								updateSongData.url instanceof File ? 'd-none' : 'd-block'
							}`}>
							Music
						</label>
						<div className='mb-6'>
							{updateSongData.url ? (
								<audio
									controls
									src={`https://files.fggroup.in/${updateSongData.url}`}
									style={{ width: '250px' }}
									className={` ${updateSongData.url instanceof File ? 'd-none' : 'd-block'}`}
								/>
							) : (
								'No file'
							)}
							<InputField
								placeholder='Music'
								type='file'
								className={`fv-row ${updateSongData.url instanceof File ? 'd-block' : 'd-none'}`}
								name='url'
								label='Music'
								htmlFor='url'
								id='url'
								marginRemove={true}
								// value={updateSongData.url}
								onChange={handleEditInputChange}
							/>
							<div>
								<button
									type='button'
									className='mt-5 px-2 py-1 mb-2 btn btn-success'
									onClick={() => handleFileButtonClick('url')}>
									Change Music
								</button>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant='secondary'
							onClick={() => setShowUpdateModal(false)}>
							Close
						</Button>
						<Button
							variant='primary'
							onClick={handleUpdate}>
							Update Song
						</Button>
					</Modal.Footer>
				</Modal>
			</KTCard>
		</>
	)
}

export default SongPage
