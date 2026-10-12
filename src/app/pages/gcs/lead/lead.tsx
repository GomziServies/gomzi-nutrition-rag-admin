import { faDownload, faPlus, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { KTCard } from '../../../../_metronic/helpers';
import { PageTitle } from '../../../../_metronic/layout/core';
import InputField from '../../../components/InputField';
import LengthMenu from '../../../components/LengthMenu';
import SearchFilter from '../../../components/SearchFilter';
import Table from '../../../components/Table';
import TableButton from '../../../components/TableButton';
import UsersListPagination from '../../../components/TablePagination';
import { AddLead, GetLead, UpdateLead } from '../../../Functions/GCS/Lead';
import toast from 'react-hot-toast';
import { Modal, Button } from 'react-bootstrap';
import SelectField from '../../../components/SelectField';
import { DayJS } from '../../../../_metronic/helpers/Utils';

const GcsLead: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [leadData, setLeadData] = useState<any>([]);
	const [sort, setSort] = useState('createdAt');
	const [loading, setLoading] = useState(false);
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null);
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc');
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	});
	const [showAddModal, setShowAddModal] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [selectedDateRange] = useState<[Date, Date] | null>(null);
	const [leadViewData, setLeadViewData] = useState({
		name: '',
		service: '',
		leadType: '',
		date: '',
		phoneNumber: '',
		email: '',
		industryOrCompany: '',
		goalOrAnnualIncome: '',
		businessName: '',
		leadAddress: '',
		reference: '',
		notes: '',
	});
	const [leadUpdateData, setLeadUpdateData] = useState({
		id: '',
		name: '',
		service: '',
		leadType: '',
		date: '',
		phoneNumber: '',
		email: '',
		industryOrCompany: '',
		goalOrAnnualIncome: '',
		businessName: '',
		leadAddress: '',
		reference: '',
		notes: '',
	});

	useEffect(() => {
		fetchLeadData();
	}, [selectedDateRange, pagination.page, pagination.itemsPerPage]);

	const fetchLeadData = async (page?: number) => {
		try {
			const response: any = await GetLead({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			});
			let filteredData = response.data;

			if (selectedDateRange && Array.isArray(selectedDateRange)) {
				const [startDate, endDate] = selectedDateRange;
				filteredData = filteredData.filter((invoice: any) => {
					const createdAtDate = new Date(invoice.createdAt);
					return createdAtDate >= startDate && createdAtDate <= endDate;
				});
			}

			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

			setLeadData(filteredData);

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error) {
			console.error(error);
		}
	};

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page });
	};

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value });
	};

	const handleAddFood = async () => {
		try {
			const data: any = {
				fullName: leadViewData.name,
				service: leadViewData.service,
				leadType: leadViewData.leadType,
				date: DayJS(leadViewData.date).format('YYYY/MM/DD'),
				phoneNumber: leadViewData.phoneNumber,
				email: leadViewData.email,
				industryOrCompany: leadViewData.industryOrCompany,
				goalOrAnnualIncome: leadViewData.goalOrAnnualIncome,
				businessName: leadViewData.businessName,
				leadAddress: leadViewData.leadAddress,
				reference: leadViewData.reference,
				notes: leadViewData.notes,
			};
			await AddLead(data);
			toast.success('Lead Create Successfully');
			setLeadData([]);
			fetchLeadData();
			setShowAddModal(false);
		} catch (error: any) {
			toast.error(error.message);
			console.error(error);
		}
	};

	const handleUpdateFood = async (id: any) => {
		try {
			const data: any = {
				id,
				fullName: leadUpdateData.name,
				service: leadUpdateData.service,
				leadType: leadUpdateData.leadType,
				date: DayJS(leadUpdateData.date).format('YYYY/MM/DD'),
				phoneNumber: leadUpdateData.phoneNumber,
				email: leadUpdateData.email,
				industryOrCompany: leadUpdateData.industryOrCompany,
				goalOrAnnualIncome: leadUpdateData.goalOrAnnualIncome,
				businessName: leadUpdateData.businessName,
				leadAddress: leadUpdateData.leadAddress,
				reference: leadUpdateData.reference,
				notes: leadUpdateData.notes,
			};
			await UpdateLead(data);
			toast.success('Lead Update Successfully');
			setLeadData([]);
			fetchLeadData();
			setShowUploadModal(false);;
		} catch (error: any) {
			toast.error(error.message);
			console.error(error);
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target;
		setLeadViewData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};

	const handleUpdateInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target;
		setLeadUpdateData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort);
		setSortOrder(newSortOrder);
	};

	const sortableFields = [
		{ title: 'Full Name', field: 'fullName' },
		{ title: 'Service', field: 'service' },
		{ title: 'Leave Type', field: 'leadType' },
		{ title: 'Date', field: 'date' },
		{ title: 'Mobile', field: 'phoneNumber' },
		{ title: 'Reference', field: 'reference' },
		{ title: 'Company Name', field: 'industryOrCompany' },
	];

	return (
		<>
			<PageTitle breadcrumbs={[]}>Leads</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6 row justify-content-between'>
					<div className='col-4'>
						<LengthMenu
							expenseData={leadData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='col-8 d-flex justify-content-end'>
						<div className='me-3 mt-1'>
							<TableButton
								action='add'
								text='Add Leads'
								onClick={() => setShowAddModal(true)}
							/>
						</div>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={leadData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(
								lead: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => (
								<React.Fragment key={lead._id}>
									<tr key={actualIndex}>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.fullName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.service}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.leadType || '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(lead.date).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.phoneNumber}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.reference}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.industryOrCompany}
											</span>
										</td>
										<td>
											<div>
												<TableButton
													action='edit'
													onClick={() => {
														setShowUploadModal(true)
														setLeadUpdateData({
															id: lead._id,
															name: lead.fullName,
															service: lead.service,
															leadType: lead.leadType,
															date: lead.date,
															phoneNumber: lead.phoneNumber,
															email: lead.email,
															industryOrCompany: lead.industryOrCompany,
															goalOrAnnualIncome: lead.goalOrAnnualIncome,
															businessName: lead.businessName,
															leadAddress: lead.leadAddress,
															reference: lead.reference,
															notes: lead.notes,
														})
													}}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {lead.fullName}
													<br />
													<strong>{sortableFields[1].title}:</strong> {lead.service}
													<br />
													<strong>{sortableFields[2].title}:</strong> {lead.leadType}
													<br />
													<strong>{sortableFields[3].title}:</strong> {DayJS(lead.date).format('DD/MM/YYYY hh:mm:ss A')}
													<br />
													<strong>{sortableFields[4].title}:</strong> {lead.phoneNumber}
													<br />
													<strong>{sortableFields[5].title}:</strong> {lead.reference}
													<br />
													<strong>{sortableFields[6].title}:</strong> {lead.industryOrCompany}

												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				</div>
			</KTCard>

			{/* Add Lead Modal */}
			<Modal
				size='lg'
				show={showAddModal}
				onHide={() => setShowAddModal(false)}
			>
				<Modal.Header closeButton>
					<Modal.Title>
						Add Lead
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>

					<div className="row">
						<InputField
							htmlFor='name'
							type='text'
							label='Name'
							name='name'
							value={leadViewData.name}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter name'
						/>
						<InputField
							htmlFor='Service'
							type='text'
							label='Service'
							name='service'
							value={leadViewData.service}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter Service'
						/>
						<InputField
							htmlFor='Client Type'
							type='text'
							label='Client Type'
							name='leadType'
							value={leadViewData.leadType}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter leadType'
						/>
						<InputField
							type='date'
							label='Date'
							name='date'
							htmlFor='date'
							value={leadViewData.date}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter date'
						/>
						<InputField
							type='number'
							label='Mobile'
							name='phoneNumber'
							htmlFor='phoneNumber'
							value={leadViewData.phoneNumber}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter mobile number'
						/>
						<InputField
							htmlFor='email'
							type='text'
							label='Email'
							name='email'
							value={leadViewData.email}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter email'
						/>
						<InputField
							type='text'
							label='Company'
							name='industryOrCompany'
							htmlFor='industryOrCompany'
							value={leadViewData.industryOrCompany}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter Company'
						/>
						<InputField
							type='text'
							label='Goal/AnnualIncome'
							name='goalOrAnnualIncome'
							htmlFor='goalOrAnnualIncome'
							value={leadViewData.goalOrAnnualIncome}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter Goal/AnnualIncome'
						/>
						<InputField
							type='text'
							label='Business Name'
							name='businessName'
							htmlFor='businessName'
							value={leadViewData.businessName}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter Business Name'
						/>
						<InputField
							type='text'
							label='Place'
							name='leadAddress'
							htmlFor='leadAddress'
							value={leadViewData.leadAddress}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter Place'
						/>
						<SelectField
							className='col-md-6 fv-row mb-7'
							label='Reference'
							name='reference'
							value={leadViewData.reference}
							onChange={handleInputChange}
							htmlFor='reference'
							options={['<120', '120-129', '130-139', '>140']}
						/>
						<InputField
							type='text'
							label='Note'
							name='notes'
							htmlFor='notes'
							value={leadViewData.notes}
							onChange={handleInputChange}
							className='col-md-6'
							placeholder='Enter Note'
						/>
					</div>

				</Modal.Body>
				<Modal.Footer>
					<Button variant='secondary' onClick={() => setShowAddModal(false)}>
						<FontAwesomeIcon icon={faXmark} /> Close
					</Button>
					<Button variant='primary' onClick={handleAddFood}>
						<FontAwesomeIcon icon={faPlus} /> Add Lead
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Upload Lead Modal */}
			<Modal
				size='lg'
				show={showUploadModal}
				onHide={() => setShowUploadModal(false)}
			>
				<Modal.Header closeButton>
					<Modal.Title>
						Update Lead
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>

					<div className="row">
						<InputField
							htmlFor='name'
							type='text'
							label='Name'
							name='name'
							value={leadUpdateData.name}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter name'
						/>
						<InputField
							htmlFor='Service'
							type='text'
							label='Service'
							name='service'
							value={leadUpdateData.service}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter Service'
						/>
						<InputField
							htmlFor='Client Type'
							type='text'
							label='Client Type'
							name='leadType'
							value={leadUpdateData.leadType}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter leadType'
						/>
						<InputField
							type='date'
							label='Date'
							name='date'
							htmlFor='date'
							value={DayJS(leadUpdateData.date).format('YYYY-MM-DD')}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter date'
						/>
						<InputField
							type='number'
							label='Mobile'
							name='phoneNumber'
							htmlFor='phoneNumber'
							value={leadUpdateData.phoneNumber}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter mobile number'
						/>
						<InputField
							htmlFor='email'
							type='text'
							label='Email'
							name='email'
							value={leadUpdateData.email}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter email'
						/>
						<InputField
							type='text'
							label='Company'
							name='industryOrCompany'
							htmlFor='industryOrCompany'
							value={leadUpdateData.industryOrCompany}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter Company'
						/>
						<InputField
							type='text'
							label='Goal/AnnualIncome'
							name='goalOrAnnualIncome'
							htmlFor='goalOrAnnualIncome'
							value={leadUpdateData.goalOrAnnualIncome}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter Goal/AnnualIncome'
						/>
						<InputField
							type='text'
							label='Business Name'
							name='businessName'
							htmlFor='businessName'
							value={leadUpdateData.businessName}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter Business Name'
						/>
						<InputField
							type='text'
							label='Place'
							name='leadAddress'
							htmlFor='leadAddress'
							value={leadUpdateData.leadAddress}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter Place'
						/>
						<SelectField
							className='col-md-6 fv-row mb-7'
							label='Reference'
							name='reference'
							value={leadUpdateData.reference}
							onChange={handleUpdateInputChange}
							htmlFor='reference'
							options={['<120', '120-129', '130-139', '>140']}
						/>
						<InputField
							type='text'
							label='Note'
							name='notes'
							htmlFor='notes'
							value={leadUpdateData.notes}
							onChange={handleUpdateInputChange}
							className='col-md-6'
							placeholder='Enter Note'
						/>
					</div>

				</Modal.Body>
				<Modal.Footer>
					<Button variant='secondary' onClick={() => setShowUploadModal(false)}>
						<FontAwesomeIcon icon={faXmark} /> Close
					</Button>
					<Button variant='primary' onClick={() => handleUpdateFood(leadUpdateData.id)}>
						<FontAwesomeIcon icon={faPlus} /> Update Lead
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default GcsLead;
