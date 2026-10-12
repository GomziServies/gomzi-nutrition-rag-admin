import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import Cropper from 'react-easy-crop'
import { useLocation } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import getCroppedImg from '../../../utils/getPhotoCrop'

const loadFonts = async () => {
	try {
		const vivaldi = new FontFace('Vivaldi', 'url(/font/Vivaldi_Regular.ttf)')
		const cambria = new FontFace('Cambria', 'url(/font/Cambria-Font-For Android.ttf)')
		const algerian = new FontFace('Algerian', 'url(/font/Algeria-mZ9.ttf)')

		await Promise.all([vivaldi.load(), cambria.load(), algerian.load()])

		document.fonts.add(vivaldi)
		document.fonts.add(cambria)
		document.fonts.add(algerian)
	} catch (error) {
		console.error('Error loading fonts:', error)
	}
}

const CreateCertificate: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const certificate_id: string | any = searchParams.get('certificate_id')
	const user_name: string | any = searchParams.get('user_name')
	const [formData, setFormData] = useState<any>({
		name: '',
		certificateId: '',
		certificateNumber: '',
		certificateYear: '',
		certificate_type: 'Online/Offline Course',
		selectedCertificate: '',
		date: '',
		profilePhoto: '',
		qrCode: '',
	})
	const [certificateSign, setCertificateSign] = useState<any>(true)
	const [imgUrl, setImgUrl] = useState('')
	const [profilePhoto, setProfilePhoto] = useState<any | null>(null)
	const [qrCodePhoto, setQrCodePhoto] = useState<string | null>(null)
	const [imageSrc, setImageSrc] = useState<any>(null)
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	const [zoom, setZoom] = useState(1)
	const [show, setShow] = useState(false)
	const [certificateImg, setCertificateImg] = useState('/media/certificate/certificate.jpg')
	const [distanceCertificateImg, setDistanceCertificateImg] = useState(
		'/media/certificate/distance-learning-certificate.png'
	)

	const handleClose = () => {
		setShow(false)
	}

	const onCropComplete = useCallback((croppedArea: any, profilePhoto: any) => {
		setProfilePhoto(profilePhoto)
	}, [])

	const handleCropComplete = async () => {
		if (imageSrc && profilePhoto) {
			const croppedImg = await getCroppedImg(imageSrc, profilePhoto)
			setProfilePhoto(croppedImg)
			setShow(false)
		}
	}

	const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value })
		// if (e.target.name == "selectedCertificate") {
		// 	if (e.target.value == "Anabolic Androgenic's Steroids Masterclass") {
		// 		setCertificateImg('/media/certificate/certificate.png')
		// 	} else {
		// 		setCertificateImg('/media/certificate/certificate.jpg')
		// 	}
		// }
	}

	const handleSignInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		if (e.target.value === 'yes_sign') {
			setCertificateSign(true)
			setCertificateImg('/media/certificate/certificate.png')
			setDistanceCertificateImg('/media/certificate/distance-learning-certificate.png')
		} else if (e.target.value === 'no_sign') {
			setCertificateSign(false)
			setCertificateImg('/media/certificate/certificate.jpg')
			setDistanceCertificateImg('/media/certificate/distance-learning-certificate.jpg')
		}
	}

	useEffect(() => {
		loadFonts()
	}, [])

	useEffect(() => {
		if (user_name && certificate_id) {
			setFormData((prevData: any) => ({
				...prevData,
				name: user_name,
				certificateId: certificate_id,
				certificate_type: 'Online/Offline Course',
			}))
		}
	}, [user_name, certificate_id])

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = () => {
				setImageSrc(reader.result as string)
				setShow(true) // Show crop modal if cropping is needed
			}
			reader.readAsDataURL(file)
		}
	}

	const handleQrCodeUpload = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = () => {
				setQrCodePhoto(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const generateCertificate = (data: any) => {
		const width = 2480
		const height = 3508

		const canvas = document.createElement('canvas')
		const certificateImgId =
			formData.certificate_type === 'Flexible Course' ? 'distanceCertificateImg' : 'certificateImg'

		const img = document.getElementById(certificateImgId) as HTMLImageElement

		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

		// Scale image drawing
		ctx.drawImage(img, 0, 0, width, height)

		// Define relative positions as percentages
		const relativePosition = {
			name: { x: 0.2, y: 0.335 },
			certificateId: { x: 0.42, y: 0.546 },
			certificateNumber: { x: 0.51, y: 0.581 },
			certificateYear: { x: 0.572, y: 0.51 },
			selectedCertificate: { x: 0.089, y: 0.45 },
			date: { x: 0.415, y: 0.78 },
			profilePhoto: { x: 0.1585, y: 0.815, width: 0.144, height: 0.121 },
			qrCodePhoto: { x: 0.4408, y: 0.842, width: 0.119, height: 0.085 },
			staticImage: { x: 0.245, y: 0.845, width: 0.14, height: 0.1 },
		}

		const finishDrawingText = () => {
			let text = data.name
			ctx.font = '200px "Vivaldi"'
			ctx.fillText(text, width * relativePosition.name.x, height * relativePosition.name.y)

			ctx.font = 'bold 65px "Cambria"'
			ctx.fillText(
				data.certificateId,
				width * relativePosition.certificateId.x,
				height * relativePosition.certificateId.y
			)
			ctx.font = 'bold 82px "Cambria"'
			ctx.fillText(
				data.certificateNumber.toString(),
				width * relativePosition.certificateNumber.x,
				height * relativePosition.certificateNumber.y
			)
			ctx.font = 'bold 75px "Cambria"'
			ctx.fillText(
				data.certificateYear.toString(),
				width * relativePosition.certificateYear.x,
				height * relativePosition.certificateYear.y
			)

			ctx.font = 'bold 100px Vivaldi'
			ctx.fillStyle = '#00000'
			const filteredDate = DayJS(data.date).format('DD/MM/YYYY')
			ctx.fillText(filteredDate, width * relativePosition.date.x, height * relativePosition.date.y)

			ctx.font = '135px Algerian'
			ctx.fillStyle = '#B88848'
			let course = data.selectedCertificate
			let courseX = 0.089
			let courseY = 0.43

			if (course === "Anabolic Androgenic's Steroids Masterclass") {
				ctx.font = '90px Algerian'
				courseX = 0.07
				courseY = 0.445
			} else if (course === 'Diploma In Personal Trainer') {
				ctx.font = '135px Algerian'
				courseX = 0.093
				courseY = 0.45
			} else if (course === 'Diploma In Nutrition') {
				ctx.font = '135px Algerian'
				courseX = 0.22
				courseY = 0.45
			} else if (course === 'Group Instructor Masterclass') {
				ctx.font = '130px Algerian'
				courseX = 0.072
				courseY = 0.45
			} else if (course === 'Injury Rehabilitation Masterclass') {
				ctx.font = '110px Algerian'
				courseX = 0.088
				courseY = 0.448
			} else if (course === 'Diploma In Advance Clinical Nutrition') {
				ctx.font = '110px Algerian'
				courseX = 0.07
				courseY = 0.448
			} else if (course === 'Powerlifting Coach masterclass') {
				ctx.font = '120px Algerian'
				courseX = 0.079
				courseY = 0.448
			} else if (course === 'Diploma in Gym Management') {
				ctx.font = '130px Algerian'
				courseX = 0.12
				courseY = 0.45
			} else if (course === 'Diploma In Business Management') {
				ctx.font = '120px Algerian'
				courseX = 0.09
				courseY = 0.448
			} else {
				ctx.font = '135px Algerian'
				courseX = 0.07
				courseY = 0.45
			}

			ctx.fillText(course, width * courseX, height * courseY)

			// Convert canvas to image and set it back to img element
			const dataURL = canvas.toDataURL('image/png')
			img.src = dataURL
			// generateImage(dataURL)
			setImgUrl(dataURL)
			setFormData({
				name: '',
				certificateId: '',
				certificateNumber: '',
				certificateYear: '',
				certificate_type: formData.certificate_type,
				selectedCertificate: '',
				date: '',
				profilePhoto: '',
				qrCode: '',
			})
		}

		if (profilePhoto) {
			const profileImg = new Image()
			profileImg.onload = () => {
				ctx.drawImage(
					profileImg,
					width * relativePosition.profilePhoto.x,
					height * relativePosition.profilePhoto.y,
					width * relativePosition.profilePhoto.width,
					height * relativePosition.profilePhoto.height
				)

				// Load and draw the static image
				const staticImg = new Image()
				staticImg.onload = () => {
					ctx.drawImage(
						staticImg,
						width * relativePosition.staticImage.x,
						height * relativePosition.staticImage.y,
						width * relativePosition.staticImage.width,
						height * relativePosition.staticImage.height
					)

					// Load and draw the QR code image (if available)
					if (qrCodePhoto) {
						const qrCodeImg = new Image()
						qrCodeImg.onload = () => {
							ctx.drawImage(
								qrCodeImg,
								width * relativePosition.qrCodePhoto.x,
								height * relativePosition.qrCodePhoto.y,
								width * relativePosition.qrCodePhoto.width,
								height * relativePosition.qrCodePhoto.height
							)
							finishDrawingText()
						}
						qrCodeImg.src = qrCodePhoto
					} else {
						finishDrawingText()
					}
				}
				staticImg.src = '/media/certificate/stamp.png'
			}
			profileImg.src = profilePhoto
		} else if (qrCodePhoto) {
			const qrCodeImg = new Image()
			qrCodeImg.onload = () => {
				ctx.drawImage(
					qrCodeImg,
					width * relativePosition.qrCodePhoto.x,
					height * relativePosition.qrCodePhoto.y,
					width * relativePosition.qrCodePhoto.width,
					height * relativePosition.qrCodePhoto.height
				)
				finishDrawingText()
			}
			qrCodeImg.src = qrCodePhoto
		} else {
			finishDrawingText()
		}
	}

	const downloadImage = () => {
		const link = document.createElement('a')
		link.href = imgUrl
		link.download =
			formData.certificate_type === 'Flexible Course'
				? 'distance-learning-certificate.png'
				: 'certificate.jpg'
		link.click()

		clearFormDataAndImage()
	}

	const clearFormDataAndImage = () => {
		setImgUrl('')

		// Reset the form data
		setFormData({
			name: '',
			certificateId: '',
			certificateNumber: '',
			certificateYear: '',
			certificate_type: formData.certificate_type,
			selectedCertificate: '',
			date: '',
			profilePhoto: '',
			qrCode: '',
		})

		// Reset the certificate image
		const certificateImgId =
			formData.certificate_type === 'Flexible Course' ? 'distanceCertificateImg' : 'certificateImg'
		const imgElement = document.getElementById(certificateImgId) as HTMLImageElement
		if (imgElement) {
			imgElement.src =
				formData.certificate_type === 'Flexible Course' ? distanceCertificateImg : certificateImg
		}
	}

	const handleCreateCertificate = async () => {
		await handleCropComplete()
		generateCertificate(formData)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Certificate</PageTitle>

			<div className='row'>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-5'>Create Certificate</p>
							<div className='row'>
								<InputField
									className='col-md-12 fv-row'
									label='Student Name'
									placeholder='Enter Student Name'
									type='text'
									name='name'
									htmlFor='name'
									value={formData.name}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-12 fv-row'
									label='Certificate ID'
									placeholder='Enter Certificate ID'
									type='text'
									name='certificateId'
									disabled
									htmlFor='certificateId'
									value={formData.certificateId}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-12 fv-row'
									label='Certificate UIN No.'
									placeholder='Enter Certificate Number'
									type='text'
									name='certificateNumber'
									htmlFor='certificateNumber'
									value={formData.certificateNumber}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-12 fv-row'
									label='Certificate Year'
									placeholder='Enter Certificate Year'
									type='text'
									name='certificateYear'
									htmlFor='certificateYear'
									value={formData.certificateYear}
									onChange={handleInputChange}
								/>
								<div>
									<div>
										<label
											htmlFor='Upload'
											className='fw-bold fs-6 mb-md-5 mb-2'>
											Select Certificate Type
										</label>
									</div>
									<div>
										<span className='me-4'>
											<input
												onChange={handleInputChange}
												type='radio'
												id='normal'
												name='certificate_type'
												value='Online/Offline Course'
												className='mb-3 mb-lg-0 me-2'
												checked={formData.certificate_type === 'Online/Offline Course'}
											/>
											<label
												htmlFor='normal'
												className='fw-bold fs-6 mb-md-5 mb-2'>
												Online/Offline Course
											</label>
										</span>
										<span>
											<input
												onChange={handleInputChange}
												type='radio'
												name='certificate_type'
												id='distance'
												value='Flexible Course'
												className='mb-3 mb-lg-0 me-2'
												checked={formData.certificate_type === 'Flexible Course'}
											/>
											<label
												htmlFor='distance'
												className='fw-bold fs-6 mb-md-5 mb-2'>
												Flexible Course
											</label>
										</span>
									</div>
								</div>
								<div>
									<div>
										<label
											htmlFor='Upload'
											className='fw-bold fs-6 mb-md-5 mb-2'>
											You want sign in certificate?
										</label>
									</div>
									<div>
										<span className='me-4'>
											<input
												onChange={handleSignInputChange}
												type='radio'
												id='yes'
												name='certificate_sign'
												value='yes_sign'
												className='mb-3 mb-lg-0 me-2'
												checked={certificateSign === true}
											/>
											<label
												htmlFor='yes'
												className='fw-bold fs-6 mb-md-5 mb-2'>
												Yes
											</label>
										</span>
										<span>
											<input
												onChange={handleSignInputChange}
												type='radio'
												name='certificate_sign'
												id='no'
												value='no_sign'
												className='mb-3 mb-lg-0 me-2'
												checked={certificateSign === false}
											/>
											<label
												htmlFor='no'
												className='fw-bold fs-6 mb-md-5 mb-2'>
												No
											</label>
										</span>
									</div>
								</div>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Select Course'
									name='selectedCertificate'
									value={formData.selectedCertificate}
									onChange={handleInputChange}
									htmlFor='txt_company'
									options={[
										"Anabolic Androgenic's Steroids Masterclass",
										'Diploma In Personal Trainer',
										'Diploma In Nutrition',
										'Group Instructor Masterclass',
										'Injury Rehabilitation Masterclass',
										'Advance Clinical Nutrition',
										'Powerlifting Coach masterclass',
										'Diploma in Gym Management',
										'Diploma In Business Management',
									]}
								/>
								<InputField
									className='col-md-12 fv-row'
									label='Certificate Date'
									placeholder='Date'
									type='date'
									name='date'
									htmlFor='date'
									value={formData.date}
									onChange={handleInputChange}
								/>
								<div className='mb-5'>
									<label
										htmlFor='Upload'
										className='fw-bold fs-6 mb-md-5 mb-2'>
										Upload Profile
									</label>
									<input
										onChange={handleFileUpload}
										type='file'
										name='profilePhoto'
										className='form-control mb-3 mb-lg-0'
									/>
								</div>

								<div className='mb-5'>
									<label
										htmlFor='Upload'
										className='fw-bold fs-6 mb-md-5 mb-2'>
										Upload QR
									</label>
									<input
										onChange={handleQrCodeUpload}
										type='file'
										name='qrCode'
										className='form-control mb-3 mb-lg-0'
									/>
								</div>

								<div className='col-md-12 fv-row mb-7 mt-7'>
									<TableButton
										action='add'
										onClick={handleCreateCertificate}
										text={'Create Certificate and Download'}
										showIcon={false}
										disabled={false}
										className='btn-block mb-4 w-100'
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div className='col-md-12 fv-row mt-10 text-center'>
								{formData.certificate_type === 'Flexible Course' ? (
									<img
										id='distanceCertificateImg'
										src={distanceCertificateImg}
										alt='certificate'
										className='w-100'
									/>
								) : (
									<img
										id='certificateImg'
										src={certificateImg}
										alt='certificate'
										className='w-100'
									/>
								)}
								<button
									type='button'
									className='btn btn-success mt-5 mb-4'
									onClick={downloadImage}>
									Download Certificate
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Modal
				show={show}
				onHide={handleClose}
				size='lg'
				centered>
				<Modal.Header closeButton>
					<Modal.Title>Crop Image</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div style={{ position: 'relative', width: '100%', height: 400 }}>
						<Cropper
							image={imageSrc}
							crop={crop}
							zoom={zoom}
							aspect={6 / 8}
							onCropChange={setCrop}
							onCropComplete={onCropComplete}
							onZoomChange={setZoom}
						/>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={handleClose}>
						Close
					</Button>
					<Button
						variant='primary'
						onClick={handleCropComplete}
						style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}>
						Crop Image
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default CreateCertificate
