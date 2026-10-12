/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { GetAdajanBranchEmployees, UpdateAdajanBranchEmployee, DeleteAdajanBranchEmployee } from '../../../Functions/FGGroup/AdajanBranchEmployee'
import { DayJS } from '../../../../_metronic/helpers/Utils'

// Add interfaces for location data
type Country = {
    id: number
    name: string
    iso2: string
}

type State = {
    id: number
    name: string
    country_id: number
    country_code: string
    state_code: string
}

type City = {
    id: number
    name: string
    state_id: number
    state_code: string
    country_id: number
    country_code: string
    latitude: string
    longitude: string
}

const AdajanBranchEmployeeView: React.FC = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const employee_id: any = searchParams.get('employee_id')
    const [loading, setLoading] = useState(false)
    const [documentLoading, setDocumentLoading] = useState(false)
    const [sort, setSort] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [memberData, setMemberData] = useState<any>([])

    // Add state variables for location data
    const [countries, setCountries] = useState<Country[]>([])
    const [states, setStates] = useState<State[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [loadingCountries, setLoadingCountries] = useState(false)
    const [loadingStates, setLoadingStates] = useState(false)
    const [loadingCities, setLoadingCities] = useState(false)

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
        email: '',
        salary: '',
        account_detail: '',
        blood_group: '',
        address: '',
        address_line_1: '',
        address_country: '',
        address_state: '',
        address_city: '',
        address_pin_code: '',
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
        const copy = [...family_details]
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
    })
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [joiningTime, setJoiningTime] = useState<any>(null)

    const fetchEmployeeData = async () => {
        if (!employee_id) return;
        setLoading(true)
        try {
            const response: any = await GetAdajanBranchEmployees({ id: employee_id })

            // Check if response contains Joi validation errors or is empty
            if (!response?.data || !Array.isArray(response.data) || (response.data.length > 0 && response.data[0].message && response.data[0].type)) {
                console.error("Invalid API response:", response);
                toast.error("Failed to fetch employee details");
                setLoading(false);
                return;
            }

            const filteredData: any = response.data[0]

            if (!filteredData) {
                setLoading(false);
                return;
            }

            const joiningDate = filteredData?.joining_date

            let joiningDuration = ''
            if (joiningDate) {
                const start = DayJS(joiningDate)
                const now = DayJS()
                const years = now.diff(start, 'year')
                const months = now.diff(start, 'month') % 12
                const days = now.diff(start, 'day') % 30

                if (years > 0) joiningDuration += `${years} Years`
                if (months > 0) joiningDuration += `${joiningDuration ? ', ' : ''}${months} Months`
                if (years === 0 && months === 0) joiningDuration = `${days} Days`
            }

            setMemberDetailData({
                admin_id: filteredData?._id,
                employee_code: filteredData?.employee_code || '',
                name: filteredData?.name || '',
                photo: filteredData?.photo || '',
                position: filteredData?.position || '',
                mobile: filteredData?.mobile || '',
                bank_name: filteredData?.account_details?.bank_name || '',
                account_details: filteredData?.account_details?.account_number || '',
                IFSC: filteredData?.account_details?.IFSC || '',
                email: filteredData?.email || '',
                salary: filteredData?.salary || '',
                blood_group: filteredData?.blood_group || '',
                address: filteredData?.address || '',
                address_line_1: filteredData?.address_details?.address_line_1 || '',
                address_country: filteredData?.address_details?.country || '',
                address_state: filteredData?.address_details?.state || '',
                address_city: filteredData?.address_details?.city || '',
                address_pin_code: filteredData?.address_details?.pin_code || '',
                document: filteredData?.document || [],
                proof: filteredData?.proof || '',
                in_time: filteredData?.in_time || '',
                out_time: filteredData?.out_time || '',
                joining_date: joiningDate || '',
            })

            // Load states and cities if country and state are already set
            if (filteredData?.address_details?.country) {
                await fetchStates(filteredData.address_details.country)
                if (filteredData?.address_details?.state) {
                    await fetchCities(
                        filteredData.address_details.country,
                        filteredData.address_details.state
                    )
                }
            }

            if (
                Array.isArray(filteredData?.family_details) &&
                filteredData.family_details.length > 0
            ) {
                setFamilyDetails(filteredData.family_details)
            } else {
                // Set default empty row
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
        fetchCountries() // Load countries on component mount
        fetchEmployeeData()
    }, [])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target

        // Handle country change - fetch states when country changes
        if (name === 'address_country') {
            const data = { ...memberDetailData, [name]: value }
            setMemberDetailData(data)
            fetchStates(value)
            // Reset state and city when country changes
            setMemberDetailData((prev: any) => ({
                ...prev,
                address_country: value,
                address_state: '',
                address_city: '',
            }))
            setStates([])
            setCities([])
            return
        }

        // Handle state change - fetch cities when state changes
        if (name === 'address_state') {
            const data = { ...memberDetailData, [name]: value }
            setMemberDetailData(data)
            // Find the selected state object to get the state name
            const selectedState = states.find((state) => state.name === value)
            if (selectedState && memberDetailData.address_country) {
                fetchCities(memberDetailData.address_country, selectedState.name)
            }
            // Reset city when state changes
            setMemberDetailData((prev: any) => ({
                ...prev,
                address_state: value,
                address_city: '',
            }))
            setCities([])
            return
        }

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
        { title: 'Preview', field: 'link' },
        // { title: 'Document Link', field: 'link' },
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
                if (memberDetailAddData.selectedFile) {
                    const imageUrl: any = await FileUploadToFGGroup([memberDetailAddData.selectedFile], {
                        directory: 'books',
                    })
                    imgUrl = imageUrl.data?.fileURLs[0]
                    toast.success('Document uploaded successfully')
                }
            }

            const {
                admin_id,
                employee_code,
                name,
                position,
                salary,
                mobile,
                bank_name,
                account_details,
                IFSC,
                blood_group,
                email,
                address,
                address_line_1,
                address_country,
                address_state,
                address_city,
                address_pin_code,
                in_time,
                out_time,
                joining_date,
            } = memberDetailData

            const payload: any = {
                id: admin_id,
                employee_code,
                name,
                position,
                salary,
                blood_group,
                family_details: family_details.map(detail => ({
                    ...detail,
                    mobile: String(detail.mobile)
                })),
                mobile,
                account_details: {
                    bank_name,
                    account_number: account_details,
                    IFSC,
                },
                email,
                address,
                address_details: {
                    address_line_1,
                    country: address_country,
                    state: address_state,
                    city: address_city,
                    pin_code: address_pin_code,
                },
                in_time,
                out_time,
                joining_date,
                document: [...memberData],
            }

            if (data === 'Document' && imgUrl) {
                payload.document.push({
                    document_type: memberDetailAddData.document_type,
                    link: imgUrl,
                })
            }

            await UpdateAdajanBranchEmployee(payload)

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
            })

            fetchEmployeeData()
        } catch (error: any) {
            const errorMessage = error.message
                ? (typeof error.message === 'object' ? JSON.stringify(error.message) : error.message)
                : 'Something went wrong';
            toast.error(errorMessage)
            console.error(error)
        }
        setDocumentLoading(false)
    }

    // Add API functions for fetching location data
    const fetchCountries = async () => {
        setLoadingCountries(true)
        try {
            // Using a free API for countries data
            const response = await fetch('https://countriesnow.space/api/v0.1/countries')
            const data = await response.json()
            if (data && data.data) {
                // Transform the data to match our Country interface
                const countriesData = data.data.map((country: any) => ({
                    id: country.iso2,
                    name: country.country,
                    iso2: country.iso2,
                }))
                setCountries(countriesData)
            }
        } catch (error) {
            console.error('Error fetching countries:', error)
            toast.error('Failed to load countries')
        } finally {
            setLoadingCountries(false)
        }
    }

    const fetchStates = async (countryCode: string) => {
        if (!countryCode) {
            setStates([])
            setCities([])
            return
        }

        setLoadingStates(true)
        try {
            // Using a free API for states data
            const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ country: countryCode }),
            })
            const data = await response.json()
            if (data && data.data && data.data.states) {
                // Transform the data to match our State interface
                const statesData = data.data.states.map((state: any, index: number) => ({
                    id: index,
                    name: state.name,
                    country_id: 0, // Not provided by API
                    country_code: countryCode,
                    state_code: state.state_code || '',
                }))
                setStates(statesData)
            }
        } catch (error) {
            console.error('Error fetching states:', error)
            toast.error('Failed to load states')
        } finally {
            setLoadingStates(false)
        }
    }

    const fetchCities = async (countryCode: string, stateName: string) => {
        if (!countryCode || !stateName) {
            setCities([])
            return
        }

        setLoadingCities(true)
        try {
            // Using a free API for cities data
            const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    country: countryCode,
                    state: stateName,
                }),
            })
            const data = await response.json()
            if (data && data.data) {
                // Transform the data to match our City interface
                const citiesData = data.data.map((city: string, index: number) => ({
                    id: index,
                    name: city,
                    state_id: 0, // Not provided by API
                    state_code: '',
                    country_id: 0, // Not provided by API
                    country_code: countryCode,
                    latitude: '',
                    longitude: '',
                }))
                setCities(citiesData)
            }
        } catch (error) {
            console.error('Error fetching cities:', error)
            toast.error('Failed to load cities')
        } finally {
            setLoadingCities(false)
        }
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Employee Detail</PageTitle>
            <>
                <div className='card pb-3'>
                    <div className='card-body'>
                        <h1 className='fw-bold text-dark fs-1 mb-6 mt-3 '>Member Detail</h1>

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
                                                'Trainer',
                                                'Yoga',
                                                'Zumba',
                                                'Admin',
                                                'Dietitian',
                                                'Other',
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
                                            placeholder='Email'
                                            type='email'
                                            name='email'
                                            label='Email'
                                            htmlFor='email'
                                            value={memberDetailData.email}
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
                                        className='col-md-4 fv-row'
                                        name='blood_group'
                                        label='Blood Group'
                                        htmlFor='bloodGroup'
                                        value={memberDetailData?.blood_group}
                                        onChange={handleInputChange}
                                        options={[
                                            'A+',
                                            'A-',
                                            'B+',
                                            'B-',
                                            'AB+',
                                            'AB-',
                                            'O+',
                                            'O-',
                                        ]}
                                    />
                                    {/* <div className='col-md-6'>
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
                                    </div> */}
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

                                    <div className='col-md-12 mt-3'>
                                        <h2 className='mb-5'>Address Details:</h2>
                                        <div className='row'>
                                            <SelectField
                                                className='col-md-4 fv-row mb-7'
                                                label='Country'
                                                name='address_country'
                                                value={memberDetailData.address_country}
                                                onChange={handleInputChange}
                                                htmlFor='address_country'
                                                options={countries.map((country) => country.name)}
                                                disabled={loadingCountries}
                                            />
                                            <SelectField
                                                className='col-md-4 fv-row mb-7'
                                                label='State'
                                                name='address_state'
                                                value={memberDetailData.address_state}
                                                onChange={handleInputChange}
                                                htmlFor='address_state'
                                                options={states.map((state) => state.name)}
                                                disabled={loadingStates || !memberDetailData.address_country}
                                            />
                                            <SelectField
                                                className='col-md-4 fv-row mb-7'
                                                label='City'
                                                name='address_city'
                                                value={memberDetailData.address_city}
                                                onChange={handleInputChange}
                                                htmlFor='address_city'
                                                options={cities.map((city) => city.name)}
                                                disabled={loadingCities || !memberDetailData.address_state}
                                            />
                                            <InputField
                                                className='col-md-8 fv-row mb-7'
                                                label='Address'
                                                placeholder='Enter Address'
                                                type='text'
                                                name='address_line_1'
                                                htmlFor='address_line_1'
                                                value={memberDetailData.address_line_1}
                                                onChange={handleInputChange}
                                            />
                                            <InputField
                                                className='col-md-4 fv-row mb-7'
                                                label='Postal/Zip Code'
                                                placeholder='Enter Postal/Zip Code'
                                                type='text'
                                                name='address_pin_code'
                                                htmlFor='address_pin_code'
                                                value={memberDetailData.address_pin_code}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {family_details && (<div className='col-md-12 mt-3'>
                                        <h2 className='mb-5'>Family Details:</h2>
                                        <div className='row'>
                                            {family_details.map((family, index) => (
                                                <div className='row' key={index}>
                                                    <div className='col-md-5 fv-row'>
                                                        <InputField
                                                            placeholder='Name'
                                                            type='text'
                                                            className='col-12 fv-row'
                                                            name="name"
                                                            label='Name'
                                                            htmlFor="name"
                                                            value={family.name}
                                                            onChange={(e: any) => handleFamilyChange(index, e)}
                                                        />
                                                    </div>
                                                    <div className='col-md-5 fv-row'>
                                                        <InputField
                                                            placeholder='Contact Number'
                                                            type='text'
                                                            className='col-12 fv-row'
                                                            name="mobile"
                                                            label='Contact Number'
                                                            htmlFor="number"
                                                            value={family.mobile}
                                                            onChange={(e: any) => handleFamilyChange(index, e)}
                                                        />
                                                    </div>
                                                    {family_details.length > 1 && index != 0 ? <div className='col-2 d-flex  align-items-center'>
                                                        <div className='d-flex mt-5 justify-content-center align-items-center'>
                                                            <TableButton
                                                                action='remove'
                                                                backgroundDark={true}
                                                                onClick={(e) => removePlan(index, e)}
                                                            />
                                                        </div>
                                                    </div> : ""}
                                                </div>
                                            ))}
                                        </div>
                                    </div>)}
                                    {family_details && (<div className='col-12 my-3 d-flex justify-content-end'>
                                        <button
                                            className='btn-primary btn gap-2 mx-2 btn-sm me-1'
                                            onClick={(e) => addPlan(e)}>
                                            <strong><big>+</big></strong> Add
                                        </button>
                                    </div>)}
                                    <div className='col-12 my-3 d-flex justify-content-end'>
                                        <button
                                            className='btn-danger btn gap-2 mx-2 btn-sm me-1'
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to delete this employee?')) {
                                                    try {
                                                        await DeleteAdajanBranchEmployee({ id: memberDetailData.admin_id })
                                                        toast.success('Employee Deleted Successfully')
                                                        // Redirect to list page
                                                        window.location.href = '/adajan-branch/employee/list'
                                                    } catch (error: any) {
                                                        const errorMessage = error.message
                                                            ? (typeof error.message === 'object' ? JSON.stringify(error.message) : error.message)
                                                            : 'Something went wrong';
                                                        toast.error(errorMessage)
                                                    }
                                                }
                                            }}>
                                            Delete
                                        </button>
                                        <button
                                            className='btn-primary btn gap-2 mx-2 btn-sm me-1'
                                            onClick={() => handleUpdateDocument('Data')}>
                                            Update
                                        </button>
                                    </div>

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

                            <div className='col-12 d-flex justify-content-end'>
                                <TableButton
                                    action='edit'
                                    onClick={() => handleUpdateDocument('Employee')}
                                    text='Save Changes'
                                    backgroundDark={true}
                                />
                            </div>
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
                    <div className='col-12 mt-7'>
                        <div className='card py-10'>
                            <div className='card-body'>
                                <div className='row'>
                                    <div className='col-md-12'>
                                        <div className='row'>
                                            <div className='col-md-4 fv-row mb-7'>
                                                <SelectField
                                                    className='col-12 fv-row'
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
                                            <div className='col-md-4 fv-row mb-md-7'>
                                                <InputField
                                                    placeholder='Upload Photo'
                                                    type='file'
                                                    className='col-12 fv-row mb-md-7'
                                                    name='upload_photo'
                                                    id='fileInput'
                                                    label='Upload Photo'
                                                    htmlFor='upload_photo'
                                                    value={memberDetailAddData.upload_photo}
                                                    onChange={(e) => handleSelectChange(e)}
                                                />
                                            </div>

                                            <div className='col-md-4 fv-row mb-7 d-flex align-items-center justify-content-center'>
                                                <button
                                                    type='button'
                                                    onClick={() => handleUpdateDocument('Document')}
                                                    className='btn btn-success mx-2 mt-md-7 my-4'>
                                                    Upload Document
                                                </button>
                                            </div>
                                        </div>
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
                                                            <div className='d-flex'>
                                                                <FontAwesomeIcon
                                                                    icon={faPlusCircle}
                                                                    className='mx-2 ms-5 mb-1 plus-icon'
                                                                    style={{ color: '#607D8B', fontSize: '18px' }}
                                                                />
                                                                <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                                    {actualIndex}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                                {member.document_type}
                                                            </span>
                                                        </td>
                                                        <td width={'50%'}>
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
                                                                    <strong>{sortableFields[0].title}:</strong> {member.document_type}
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
            </>
        </>
    )
}

export { AdajanBranchEmployeeView }
