/* eslint-disable react/jsx-no-target-blank */
import {
    faBriefcase,
    faComment,
    faDumbbell,
    faHeadset,
    faHome,
    faMapMarkerAlt,
    faMusic,
    faStar,
    faUtensils,
    faCartArrowDown,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function FwgloginAsidemenuItems() {
    return (
        <>
            <AsideMenuItem
                to='/fwg/dashboard'
                Icon={faHome}
                title='Dashboard'
            />

            <div className='menu-item'>
                <div className='menu-content pt-8 pb-2'>
                    <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Chat</span>
                </div>
            </div>
            <AsideMenuItem
                to='/fwg/chat'
                Icon={faComment}
                title='Chat'
            />

            {/* Fitness */}
            <div className='menu-item'>
                <div className='menu-content pt-8 pb-2'>
                    <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Fitness</span>
                </div>
            </div>
            <AsideMenuItem
                to='/fwg/all-order'
                Icon={faCartArrowDown}
                title='Orders'
            />

            <AsideMenuItemWithSub
                to='/crafted/pages'
                title='Feature & plan'
                Icon={faBriefcase}>
                <AsideMenuItem
                    to='features'
                    title='Features'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='plan-bundle-list'
                    title='Plan Bundle'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='membership-plan'
                    title='Membership Plan'
                    hasBullet={true}
                />
            </AsideMenuItemWithSub>

            <AsideMenuItemWithSub
                to=''
                title='General Diet'
                Icon={faUtensils}>
                <AsideMenuItem
                    to='food-details'
                    title='Food'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='food-time'
                    title='Food Time'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='food-category'
                    title='Food Category'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='food-bundle'
                    title='Food Bundle'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='diet-details'
                    title='Diet'
                    hasBullet={true}
                />
            </AsideMenuItemWithSub>

            <AsideMenuItemWithSub
                to='/crafted/pages'
                title='General Exercise'
                Icon={faDumbbell}>
                <AsideMenuItem
                    to='exercise-details'
                    title='Exercise'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='exercise-bundle'
                    title='Exercise Bundle'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='exercise-plan'
                    title='Exercise Plan'
                    hasBullet={true}
                />
                <AsideMenuItem
                    to='exercise-approve'
                    title='Exercise Approve'
                    hasBullet={true}
                />
            </AsideMenuItemWithSub>

            <div className='menu-item'>
                <div className='menu-content pt-8 pb-2'>
                    <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Other</span>
                </div>
            </div>

            <AsideMenuItem
                to='/fwg/complaint-assistant-fwg'
                Icon={faHeadset}
                title='Complaint or Assistant'
            />
            <AsideMenuItem
                Icon={faStar}
                to='app-feedback-fwg'
                title='App Feedback'
            />
            <AsideMenuItem
                Icon={faMusic}
                to='song'
                title='Song'
            />

            <AsideMenuItem
                Icon={faMapMarkerAlt}
                to='user-location'
                title='User Location'
            />
        </>
    )
}
