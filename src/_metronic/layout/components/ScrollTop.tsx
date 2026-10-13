import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
	DrawerComponent,
	ScrollTopComponent,
	StickyComponent,
	ToggleComponent,
} from '../../assets/ts/components'
import { KTIcon } from '../../helpers'

export function ScrollTop() {
	const { pathname } = useLocation()
	const isFirstRun = useRef(true)

	const pluginsReinitialization = () => {
		setTimeout(() => {
			StickyComponent.reInitialization()
			setTimeout(() => {
				ToggleComponent.reinitialization()
				DrawerComponent.reinitialization()
			}, 70)
		}, 140)
	}

	const scrollToTop = (e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault()
			e.stopPropagation()
		}
		try {
			ScrollTopComponent.goTop()
		} catch (err) {}
		window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
		document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
		document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
		const containers = document.querySelectorAll(
			'.post, #kt_post, #kt_content, #kt_wrapper, #root, [data-kt-scroll="true"]'
		)
		containers.forEach((el) => {
			try {
				el.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
			} catch (_) {
				el.scrollTop = 0
			}
		})
	}

	const updateHeaderSticky = () => {
		const stickyHeader = document.body.querySelectorAll(`[data-kt-sticky-name="header"]`)
		if (stickyHeader && stickyHeader.length > 0) {
			const sticky = StickyComponent.getInstance(stickyHeader[0] as HTMLElement)
			if (sticky) {
				sticky.update()
			}
		}
	}

	useEffect(() => {
		if (isFirstRun.current) {
			isFirstRun.current = false
		} else {
			pluginsReinitialization()
		}

		updateHeaderSticky()
		setTimeout(() => {
			scrollToTop()
		}, 0)

		const handleScroll = () => {
			const scrollPos =
				window.pageYOffset ||
				document.documentElement.scrollTop ||
				document.body.scrollTop ||
				0
			let containerMax = 0
			const containers = document.querySelectorAll(
				'.post, #kt_post, #kt_content, #kt_wrapper, #root, [data-kt-scroll="true"]'
			)
			containers.forEach((el) => {
				if (el.scrollTop > containerMax) {
					containerMax = el.scrollTop
				}
			})
			if (scrollPos > 120 || containerMax > 120) {
				document.body.setAttribute('data-kt-scrolltop', 'on')
			} else {
				document.body.removeAttribute('data-kt-scrolltop')
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
		return () => {
			window.removeEventListener('scroll', handleScroll, true)
		}
	}, [pathname])

	return (
		<div
			id='kt_scrolltop'
			className='scrolltop'
			data-kt-scrolltop='true'
			onClick={scrollToTop}
			style={{ cursor: 'pointer', zIndex: 1055 }}
			title='Scroll to top'>
			<KTIcon iconName='arrow-up' />
		</div>
	)
}
