import clsx from 'clsx'
import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { DrawerComponent, ScrollComponent, ToggleComponent } from '../../../assets/ts/components'
import { AsideMenuMain } from './AsideMenuMain'

type Props = {
	asideMenuCSSClasses: string[]
}

const AsideMenu: React.FC<Props> = ({ asideMenuCSSClasses }) => {
	const scrollRef = useRef<HTMLDivElement | null>(null)
	const { pathname } = useLocation()

	const hideEmptySections = () => {
		const menu = scrollRef.current?.querySelector('[id="#kt_aside_menu"]')
		if (!menu) return

		const items = Array.from(menu.children) as HTMLElement[]
		let currentSectionHeader: HTMLElement | null = null
		let hasVisibleItems = false

		items.forEach((item) => {
			const isHeader = item.querySelector('.menu-section') !== null
			if (isHeader) {
				if (currentSectionHeader) {
					currentSectionHeader.style.display = hasVisibleItems ? 'block' : 'none'
				}
				currentSectionHeader = item
				hasVisibleItems = false
			} else {
				const isVisible = window.getComputedStyle(item).display !== 'none'
				if (isVisible) {
					hasVisibleItems = true
				}
			}
		})

		if (currentSectionHeader) {
			;(currentSectionHeader as HTMLElement).style.display = hasVisibleItems ? 'block' : 'none'
		}
	}

	useEffect(() => {
		setTimeout(() => {
			DrawerComponent.reinitialization()
			ToggleComponent.reinitialization()
			ScrollComponent.reinitialization()
			if (scrollRef.current) {
				scrollRef.current.scrollTop = 0
			}
			hideEmptySections()
		}, 50)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])

	return (
		<div
			id='kt_aside_menu_wrapper'
			ref={scrollRef}
			className='hover-scroll-overlay-y px-2 my-5 my-lg-5'
			data-kt-scroll='true'
			data-kt-scroll-height='auto'
			data-kt-scroll-dependencies="{default: '#kt_aside_toolbar, #kt_aside_footer', lg: '#kt_header, #kt_aside_toolbar, #kt_aside_footer'}"
			data-kt-scroll-wrappers='#kt_aside_menu'
			data-kt-scroll-offset='5px'>
			<div
				id='#kt_aside_menu'
				data-kt-menu='true'
				className={clsx(
					'menu menu-column menu-title-gray-800 menu-state-title-primary menu-state-icon-primary menu-state-bullet-primary menu-arrow-gray-500',
					asideMenuCSSClasses.join(' ')
				)}>
				<AsideMenuMain />
			</div>
		</div>
	)
}

export { AsideMenu }
