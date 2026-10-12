import React, { useState } from 'react';
import { PageTitle } from '../../../../../_metronic/layout/core';
import InputField from '../../../../components/InputField';
import toast from 'react-hot-toast';
import { CreateUser } from '../../../../Functions/FGGroup';
import TableButton from '../../../../components/TableButton';
import { useNavigate } from 'react-router-dom';

const AddUserForm = () => {

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        mobile: '',
        email: '',
    })
    const navigate = useNavigate();
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target
        setFormData({ ...formData, [name]: value })
    }

    const handleAddButtonClick = async () => {

        try {
            setIsSubmitting(true)

            const payload: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                mobile: formData.mobile,
                email: formData.email,
            }
            await CreateUser(payload)
            toast.success('User Add Successfully')
            setFormData({
                first_name: '',
                last_name: '',
                mobile: '',
                email: '',
            })
            setIsSubmitting(false)

            navigate('/fgiit/users')
        } catch (error: any) {
            toast.error(error.message)
            setIsSubmitting(false)
            console.error(error)
        }
    }


    return (
        <>
            <PageTitle breadcrumbs={[]}>User</PageTitle>
            <div>
                <div className='row'>
                    <div className="col-md-12 mt-3">
                        <div className='card py-10'>
                            <h1 className='fw-bold text-dark fs-1 m-6 mt-0 '>Add User</h1>
                            <div className='card-body row'>
                                <InputField
                                    className="col-md-3 fv-row"
                                    label="First Name"
                                    placeholder="Enter Your First Name"
                                    type="text"
                                    name="first_name"
                                    htmlFor='first_name'
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                />
                                <InputField
                                    className="col-md-3 fv-row"
                                    label="Last Name"
                                    placeholder="Enter Your Last Name"
                                    type="text"
                                    name="last_name"
                                    htmlFor='last_name'
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                />
                                <InputField
                                    className="col-md-3 fv-row"
                                    label="Mobile No."
                                    placeholder="Enter Your Mobile No."
                                    type="number"
                                    name="mobile"
                                    htmlFor='mobile'
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                />
                                <InputField
                                    className="col-md-3 fv-row"
                                    label="Email"
                                    placeholder="Enter Your Email"
                                    type="text"
                                    name="email"
                                    htmlFor='email'
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                                <div className='col-md-12 mt-3 d-flex justify-content-end'>
                                    <TableButton
                                        action="add"
                                        onClick={handleAddButtonClick}
                                        text={isSubmitting ? 'Please wait, Adding User...' : 'Add User'}
                                        showIcon={false}
                                        disabled={isSubmitting}
                                        className={`btn-block mt-4 ${isSubmitting ? 'disabled' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default AddUserForm;
