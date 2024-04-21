import { useState } from 'react';
import { Search, Settings } from 'react-feather';
import ChangeModal from './ChangeModal';

const ChangeButton = ({ fetchMenu, menu, page, availableSwapDays }) => {
	const [showChangeModal, setShowChangeModal] = useState(false);

	return (
		<>
			<span className="day-settings">
				<Settings onClick={() => setShowChangeModal(true)} />
			</span>
			{showChangeModal && (
				<ChangeModal menu={menu} page={page} availableSwapDays={availableSwapDays} fetchMenu={fetchMenu} closeModalHandler={() => setShowChangeModal(false)} />
			)}
		</>
	);
};

export default ChangeButton;
