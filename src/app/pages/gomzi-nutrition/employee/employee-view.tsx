import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup, GetGlsEmployees, UpdateGlsEmployee } from '../../../Functions/FGGroup'
import '../common-management.css'

const EmployeeView = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const employee_id: any = searchParams.get('employee_id')
    const [loading, setLoading] = useState(false)
    const [documentLoading, setDocumentLoading] = useState(false)
    const [sort, setSort] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [memberData, setMemberData] = useState<any>([])
    const [memberDetailData, setMemberDetailData] = useState<any>({
        admin_id: '',
        employee_code: '',
        name: '',
        photo: '',
        position: '',
        mobile: '',
        bank_name: '',
        account_details: '',
        IFSC: '',
        salary: '',
        account_detail: '',
        blood_group: '',
        address: '',
        in_time: '',
        out_time: '',
        joining_date: '',
    })

    const [family_details, setFamilyDetails] = useState([{
        name: '',
        mobile: ''
    }])

    const handleFamilyChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        const updatedDetails = [...family_details];

        // Ensure 'name' is a valid key of FamilyMember
        if (name in updatedDetails[index]) {
            updatedDetails[index] = {
                ...updatedDetails[index],
                [name]: value,
            };
            setFamilyDetails(updatedDetails);
        }
    };

    const addPlan = (event: any) => {
        event.preventDefault()
        setFamilyDetails([
            ...family_details,
            {
                name: '',
                mobile: ''
            },
        ])
    }

    const removePlan = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        let copy = [...family_details]
        copy.splice(index, 1);
        setFamilyDetails(copy);
    }

    const validateFamilyDetails = (): boolean => {
        for (let i = 0; i < family_details.length; i++) {
            const member = family_details[i];

            if (!member.name.trim()) {
                toast.error(`Family Details is required`);
                return false;
            }

            if (!member.mobile) {
                toast.error(`Family Details Contact number is required`);
                return false;
            }
        }

        return true;
    };

    const [memberDetailAddData, setMemberDetailAddData] = useState({
        document_type: '',
        upload_photo: '',
        file_url: '',
        editImage: false,
        selectedFile: null as File | null,
        joining_date: '',
        expiry_date: '',
    })
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [joiningTime, setJoiningTime] = useState<any>(null)

    const fetchEmployeeData = async () => {
        setLoading(true)
        try {
            const response: any = await GetGlsEmployees({ id: employee_id })
            const filteredData: any = response.data[0]

            const joiningDate = filteredData?.joining_date

            let joiningDuration = ''
            if (joiningDate) {
                const start = DayJS(joiningDate)
                const now = DayJS()
                const years = now.diff(start, 'year')
                const months = now.diff(start, 'month') % 12
                const days = now.diff(start, 'day') % 30

                if (years > 0) joiningDuration += `${years} Years `
                if (months > 0) joiningDuration += `${months} Months`
                if (years === 0 && months === 0) joiningDuration = `${days} Days`
            }

            setMemberDetailData({
                id: filteredData?._id,
                employee_code: filteredData?.employee_code,
                name: filteredData?.full_name,
                photo: filteredData?.photo,
                position: filteredData?.position,
                mobile: filteredData?.mobile,
                bank_name: filteredData?.account_details?.bank_name,
                account_details: filteredData?.account_details?.account_number,
                IFSC: filteredData?.account_details?.IFSC,
                salary: filteredData?.salary,
                blood_group: filteredData?.blood_group,
                address: filteredData?.address,
                document: filteredData?.document,
                proof: filteredData?.proof,
                in_time: filteredData?.in_time,
                out_time: filteredData?.out_time,
                joining_date: joiningDate,
            })

            if (
                Array.isArray(filteredData?.family_details) &&
                filteredData.family_details.length > 0
            ) {
                setFamilyDetails(filteredData.family_details)
            } else {
                setFamilyDetails([{ name: '', mobile: '' }])
            }

            setJoiningTime(joiningDuration)
            setMemberData(filteredData?.document || [])
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchEmployeeData()
    }, [])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target

        setMemberDetailData((prevData: any) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, name, value } = event.target
        if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
            const file = event.target.files[0]
            setMemberDetailAddData((prevData) => ({
                ...prevData,
                selectedFile: file,
                file_url: URL.createObjectURL(file),
                editImage: true,
            }))
        }
        
        setMemberDetailAddData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, files } = event.target as HTMLInputElement
        if (files && files[0]) {
            setMemberDetailData((prevData: any) => ({
                ...prevData,
                [name]: files[0],
            }))
        }
    }

    const sortableFields = [
        { title: 'Document Type', field: 'document_type' },
        { title: 'Joining Date', field: 'joining_date' },
        { title: 'Expiry Date', field: 'expiry_date' },
        { title: 'Preview', field: 'link' },
    ]

    const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
        setSort(newSort)
        setSortOrder(newSortOrder)
    }

    const handleRowClick = (id: string) => {
        if (window.innerWidth <= 1024) {
            setVisibleDetails(visibleDetails === id ? null : id)
        }
    }

    const handleUpdateDocument = async (data: any) => {

        if (!validateFamilyDetails()) {
            return;
        }
        setDocumentLoading(true)

        try {
            let imgUrl = ''

            if (data === 'Document') {
                if (!memberDetailAddData.document_type) {
                    toast.error('Please select a document type')
                    setDocumentLoading(false)
                    return
                }
                if (!memberDetailAddData.selectedFile) {
                    toast.error('Please select a file to upload')
                    setDocumentLoading(false)
                    return
                }

                if (memberDetailAddData.selectedFile) {
                    const imageUrl: any = await FileUploadToFGGroup([memberDetailAddData.selectedFile], {
                        directory: 'books',
                    })
                    imgUrl = imageUrl.data?.fileURLs[0]
                    toast.success('Document uploaded successfully')
                }
            }

            const {
                id,
                employee_code,
                name,
                position,
                salary,
                mobile,
                bank_name,
                account_details,
                IFSC,
                blood_group,
                address,
                in_time,
                out_time,
                joining_date,
            } = memberDetailData

            const payload: any = {
                id,
                name,
                position,
                salary,
                blood_group,
                family_details,
                mobile,
                account_details: {
                    bank_name,
                    account_number: account_details,
                    IFSC,
                },
                address,
                in_time,
                out_time,
                joining_date,
                document: (data === 'Document'
                    ? [
                            ...memberData,
                            {
                                document_type: memberDetailAddData.document_type || 'Joining Letter ',
                                link: imgUrl,
                                joining_date: memberDetailAddData.joining_date,
                                expiry_date: memberDetailAddData.expiry_date,
                            },
                      ]
                    : memberData
                ).filter((doc: any) => doc.document_type && doc.link),
            }

            await UpdateGlsEmployee(payload)

            if (data === 'Document') {
                toast.success('Document Updated Successfully')
            } else {
                toast.success('Employee Data Updated Successfully')
            }

            // Clear form data after successful update
            setMemberDetailAddData({
                document_type: '',
                upload_photo: '',
                file_url: '',
                editImage: false,
                selectedFile: null,
                joining_date: '',
                expiry_date: '',
            })

            fetchEmployeeData()
        } catch (error: any) {
            toast.error(error.message)
            console.error(error)
        }
        setDocumentLoading(false)
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Employee Profile</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/employees'>Staff Management</Link>
				<span className='sep'>/</span>
				<span className='current'>{memberDetailData.name || 'Employee Profile'}</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Employee Profile & Documents</h1>
					<p className='gz-mgmt-subtitle'>View staff credentials, payroll parameters, identity documents, and contract records</p>
				</div>
				<Link to='/rag/employees' className='gz-mgmt-btn-secondary text-decoration-none'>
					Back to Staff
				</Link>
			</div>

			<div className='gz-mgmt-form-card mb-8'>
				<div className='d-flex justify-content-between align-items-center flex-wrap gap-3 pb-6 mb-6' style={{ borderBottom: '1px solid #F1F5F9' }}>
					<div>
						<h2 className='fw-bold mb-1' style={{ fontSize: '18px', color: '#172B4D' }}>
							Member Details
						</h2>
						<div className='text-muted fs-7'>
							{memberDetailData.position || 'Staff'} • {memberDetailData.employee_code || '-'}
						</div>
					</div>
					{joiningTime && (
						<span className='gz-mgmt-pill info' style={{ fontSize: '13px', padding: '6px 12px' }}>
							Tenure: {joiningTime}
						</span>
					)}
				</div>

							<div className='row'>
								<div className='col-md-3 d-md-block d-flex mb-md-0 mb-5'>
									<div>
										<label
											htmlFor='proof'
											className='fw-bold ms-md-0 ms-6 fs-6 mb-md-5 mb-2'>
											Profile :
										</label>
										<br />
										<div className=' d-md-block d-flex justify-content-center'>
											<img
												src={'https://files.fggroup.in/' + memberDetailData?.photo}
												className='w-75'
												style={{ borderRadius: '5px' }}
												alt='Image preview'
											/>
										</div>
									</div>
									<div className='mt-md-5'>
										<label
											htmlFor='proof'
											className='fw-bold ms-md-0 ms-6 fs-6 mb-md-5 mb-2'>
											Proof :
										</label>
										<br />
										<div className=' d-md-block d-flex justify-content-center'>
											<img
												src={'https://files.fggroup.in/' + memberDetailData?.proof}
												className='w-75'
												alt='Image preview'
												style={{ borderRadius: '5px' }}
											/>
										</div>
									</div>
								</div>
								<div className='col-md-9'>
									<div className='row'>
										<div className='col-md-4'>
											<InputField
												className='col-12 fv-row'
												placeholder='Employee Code'
												type='text'
												name='employee_code'
												label='Employee Code'
												htmlFor='employee_code'
												value={memberDetailData.employee_code}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4'>
											<InputField
												className='col-12 fv-row'
												placeholder='Name'
												type='text'
												name='name'
												label='Name'
												htmlFor='name'
												value={memberDetailData.name}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4'>
											<SelectField
												className='col-12 fv-row'
												name='position'
												label='Position'
												htmlFor='position'
												value={memberDetailData?.position}
												onChange={handleInputChange}
												options={[
													'Web Developer',
													'Web Designer',
													'Digital marketing',
													'Franchise Owner',
													'Graphics Designer',
													'Sales manager',
													'Video Editor',
													'Back Office',
													'faculty',
													'Trainer',
													'Dietitian',
													'Admin',
													'Receptionist',
													'Worker',
													'Branch Manager',
													'Human Resources',
													'Team Leader',
													'Manager',
													'Director',
													'Social Media Assistant',
													'Fitness Counselor',
													'Production Manager',
													'Seo',
													'Junior Production Manager',
													'Content Creator',
													'R&D and Procurement Manager',
													'R&D and Procurement Jr. Manager',
												]}
											/>
										</div>
										<div className='col-md-4'>
											<InputField
												className='col-12 fv-row'
												placeholder='Mobile'
												type='text'
												name='mobile'
												label='Mobile'
												htmlFor='mobile'
												value={memberDetailData.mobile}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4'>
											<InputField
												className='col-12 fv-row'
												placeholder='Salary'
												type='text'
												name='salary'
												label='Salary'
												htmlFor='salary'
												value={memberDetailData.salary}
												onChange={handleInputChange}
											/>
										</div>
										<SelectField
											className='col-2 fv-row'
											name='blood_group'
											label='Blood Group'
											htmlFor='bloodGroup'
											value={memberDetailData?.blood_group}
											onChange={handleInputChange}
											options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
										/>
										<div className='col-md-6'>
											<InputField
												className='col-12 fv-row'
												placeholder='Address'
												type='text'
												name='address'
												label='Address'
												htmlFor='address'
												value={memberDetailData.address}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4'>
											<InputField
												className='col-12 fv-row'
												placeholder='Joining Date'
												type='date'
												name='joining_date'
												label={`Joining Date (${joiningTime})`}
												htmlFor='joining_date'
												value={memberDetailData?.joining_date}
												onChange={handleInputChange}
											/>
										</div>

										{family_details && (
											<div className='col-md-12 mt-3'>
												<h2 className='mb-5'>Family Details:</h2>
												<div className='row'>
													{family_details.map((family, index) => (
														<div
															className='row'
															key={index}>
															<div className='col-md-5 fv-row'>
																<InputField
																	placeholder='Name'
																	type='text'
																	className='col-12 fv-row'
																	name='name'
																	label='Name'
																	htmlFor='name'
																	value={family.name}
																	onChange={(e: any) => handleFamilyChange(index, e)}
																/>
															</div>
															<div className='col-md-5 fv-row'>
																<InputField
																	placeholder='Contact Number'
																	type='number'
																	className='col-12 fv-row'
																	name='mobile'
																	label='Contact Number'
																	htmlFor='number'
																	value={family.mobile}
																	onChange={(e: any) => handleFamilyChange(index, e)}
																/>
															</div>
															{family_details.length > 1 && index != 0 ? (
																<div className='col-2 d-flex  align-items-center'>
																	<div className='d-flex mt-5 justify-content-center align-items-center'>
																		<TableButton
																			action='remove'
																			backgroundDark={true}
																			onClick={(e) => removePlan(index, e)}
																		/>
																	</div>
																</div>
															) : (
																''
															)}
														</div>
													))}
												</div>
											</div>
										)}
										{family_details && (
											<div className='col-12 my-3 d-flex justify-content-end'>
												<button
													className='btn-primary btn gap-2 mx-2 btn-sm me-1'
													onClick={(e) => addPlan(e)}>
													<strong>
														<big>+</big>
													</strong>{' '}
													Add
												</button>
											</div>
										)}

										<div className='col-md-12 mt-3'>
											<h2 className='mb-5'>Account Details:</h2>
											<div className='row'>
												<div className='col-md-4 fv-row mb-md-7'>
													<CopyableInput
														placeholder='Bank Name'
														type='text'
														className='col-12 fv-row mb-7'
														name='bank_name'
														label='Bank Name'
														htmlFor='bank_name'
														value={memberDetailData.bank_name}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-md-7'>
													<CopyableInput
														placeholder='Account No.'
														type='text'
														className='col-12 fv-row mb-7'
														name='account_details'
														label='Account No.'
														htmlFor='account_details'
														value={memberDetailData.account_details}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-md-7'>
													<CopyableInput
														placeholder='IFSC Code'
														type='text'
														className='col-12 fv-row mb-7'
														name='IFSC'
														label='IFSC Code'
														htmlFor='IFSC'
														value={memberDetailData.IFSC}
														onChange={handleInputChange}
													/>
												</div>
											</div>
										</div>

										<div className='col-md-12 mt-3'>
											<h2 className='mb-5'>Shift Time:</h2>
											<div className='row'>
												<div className='col-md-4 fv-row mb-md-7'>
													<InputField
														placeholder='In-Time'
														type='time'
														className='col-12 fv-row mb-7'
														name='in_time'
														label='In-Time'
														htmlFor='in_time'
														value={memberDetailData.in_time}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-md-7'>
													<InputField
														placeholder='Out-Time'
														type='time'
														className='col-12 fv-row mb-7'
														name='out_time'
														label='Out-Time'
														htmlFor='out_time'
														value={memberDetailData.out_time}
														onChange={handleInputChange}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className='col-12 d-flex justify-content-end pt-4' style={{ borderTop: '1px solid #F1F5F9' }}>
									<button
										type='button'
										className='gz-mgmt-btn-primary'
										onClick={() => handleUpdateDocument('Employee')}>
										<i className='bi bi-check2-circle me-2'></i>
										Save Profile Changes
									</button>
								</div>
							</div>
						</div>
					{documentLoading && (
						<div className='loader-background'>
							<div
								className='spinner-border spinner-border-1 text-white'
								style={{ width: '50px', height: '50px' }}
								role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
						</div>
					)}
					<div className='row'>
						<div className='col-12 mt-6'>
							<div className='gz-mgmt-card'>
								<div className='card-body px-10 py-10'>
									<div
										className='mb-10 p-8 rounded-3'
										style={{ backgroundColor: '#f5f5f5ff', border: '1px solid #f5f3f3ff' }}>
										<div className='mb-7'>
											<h3 className='fw-bold text-dark fs-3'>
												<i className='ki-duotone ki-file-up fs-1 text-primary me-2'>
													<span className='path1'></span>
													<span className='path2'></span>
												</i>
												Upload Documents
											</h3>
										</div>
										<div className='row'>
											{(() => {
												const isDateVisible =
													memberDetailAddData.document_type === 'Joining Letter ' ||
													memberDetailAddData.document_type === 'HR Agreement '
												const colSize = isDateVisible ? 'col-lg-3' : 'col-lg-6'

												return (
													<>
														<div className={`${colSize} col-md-6 fv-row mb-md-7 mb-3`}>
															<SelectField
																className='col-12'
																name='document_type'
																label='Document Type'
																htmlFor='document_type'
																value={memberDetailAddData.document_type}
																onChange={handleSelectChange}
																options={[
																	'Joining Letter ',
																	'Termination Letter ',
																	'HR Agreement ',
																	'Experience Letter ',
																	'Google Pay QR Code',
																]}
															/>
														</div>
														<div className={`${colSize} col-md-6 fv-row mb-md-7 mb-3`}>
															<InputField
																placeholder='Upload Photo'
																type='file'
																className='col-12'
																name='upload_photo'
																id='fileInput'
																label='Upload Photo'
																htmlFor='upload_photo'
																onChange={(e) => handleSelectChange(e)}
															/>
														</div>
														{isDateVisible && (
															<>
																<div className='col-lg-3 col-md-6 fv-row mb-md-7 mb-3'>
																	<InputField
																		className='col-12'
																		placeholder='Joining Date'
																		type='date'
																		name='joining_date'
																		label='Joining Date'
																		htmlFor='joining_date'
																		value={memberDetailAddData?.joining_date}
																		onChange={handleSelectChange}
																	/>
																</div>
																<div className='col-lg-3 col-md-6 fv-row mb-md-7 mb-3'>
																	<InputField
																		className='col-12'
																		placeholder='Expiry Date'
																		type='date'
																		name='expiry_date'
																		label='Expiry Date'
																		htmlFor='expiry_date'
																		value={memberDetailAddData?.expiry_date}
																		onChange={handleSelectChange}
																	/>
																</div>
															</>
														)}
													</>
												)
											})()}
										</div>
										<div className='d-flex justify-content-end'>
											<button
												type='button'
												onClick={() => handleUpdateDocument('Document')}
												className='btn btn-primary px-10'>
												<i className='ki-duotone ki-cloud-upload fs-2 me-2'>
													<span className='path1'></span>
													<span className='path2'></span>
												</i>
												Upload Document
											</button>
										</div>
									</div>

									<div className='table-responsive'>
										<Table
											data={memberData}
											columns={sortableFields}
											sort={sort}
											sortOrder={sortOrder}
											onSortChange={handleSortChange}
											removeAction={true}
											renderRow={(
												member: any,
												index: number,
												actualIndex: number,
												isVisible: boolean
											) => {
												const isPdf = member.link.endsWith('.pdf')
												const fileUrl = 'https://files.fggroup.in/' + member.link
												return (
													<React.Fragment key={member._id}>
														<tr
															onClick={() => handleRowClick(member._id)}
															className='data-row'>
															<td className='text-center'>
																<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																	{actualIndex}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																	{member.document_type}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																	{member.joining_date
																		? DayJS(member.joining_date).format('DD MMM YYYY')
																		: '-'}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																	{member.expiry_date
																		? DayJS(member.expiry_date).format('DD MMM YYYY')
																		: '-'}
																</span>
															</td>

															<td width={'40%'}>
																<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																	{isPdf ? (
																		<>
																			<a
																				href={fileUrl}
																				target='_blank'
																				rel='noopener noreferrer'>
																				<embed
																					src={fileUrl}
																					className='w-75'
																				/>
																			</a>
																			<div>
																				<button
																					type='button'
																					onClick={() => window.open(fileUrl)}
																					className='btn btn-success mx-2 mt-md-7 my-4'>
																					View PDF
																				</button>
																			</div>
																		</>
																	) : (
																		<a
																			href={fileUrl}
																			target='_blank'
																			rel='noopener noreferrer'>
																			<img
																				src={fileUrl}
																				className='w-50'
																				alt='Image preview'
																			/>
																		</a>
																	)}
																</span>
															</td>
														</tr>
														{isVisible && (
															<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
																<td colSpan={12}>
																	<div>
																		<strong>{sortableFields[0].title}:</strong>{' '}
																		{member.document_type}
																	</div>
																</td>
															</tr>
														)}
													</React.Fragment>
												)
											}}
											visibleDetails={visibleDetails}
											pagination={pagination}
											setPagination={setPagination}
											loading={loading}
										/>
									</div>
									{memberData.length === 0 && !loading && (
										<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
											<b>No records found</b>
										</div>
									)}
									{memberData.length > 0 && (
										<UsersListPagination
											totalPages={Math.ceil(memberData.length / pagination.itemsPerPage)}
											currentPage={pagination.page}
											onPageChange={handlePageChange}
										/>
									)}
								</div>
							</div>
						</div>
					</div>
		</div>
	)
}

export default EmployeeView