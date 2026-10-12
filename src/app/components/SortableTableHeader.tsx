// SortableTableHeader.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

type SortableTableHeaderProps = {
    title: string;
    field: string;
    sort: string;
    sortOrder: string;
    onSortChange: (field: string) => void;
};

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({ title, field, sort, sortOrder, onSortChange }) => {
    const handleSort = () => {
        onSortChange(field);
    };

    return (
        <th onClick={handleSort}>
            {title}
            <FontAwesomeIcon
                icon={
                    sort === field
                        ? sortOrder === 'asc'
                            ? faSortUp
                            : faSortDown
                        : faSort
                }
                className='ms-2'
            />
        </th>
    );
};

export default SortableTableHeader;
