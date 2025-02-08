import { FileText } from 'react-feather';
import { useRef, useState } from 'react';
import { Button, Input } from 'reactstrap';
import './ChangeModal.scss';
import { useToast } from 'context/toast-context';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';

const DailyNotesButton = ({ fetchMenu, menu, page }) => {
	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;
	const inputRef = useRef(null);
	const menuID = menu.menuID;

	const [value, setValue] = useState(menu.dailyNotes);

	const showToast = useToast();

    const notesHandler = async (closeModal) => {
        await fetch(`/api/menu/notes/${menuID}`, {
            method: 'POST',
            body: JSON.stringify({ dailyNotes: value }),
            headers: {
                // This is required. NodeJS server won't know how to read it without it.
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenFromStorage}`,
            },
        });

        fetchMenu(page);
        showToast('Menu', `Notes saved for ${menu.date}`);
        closeModal();
	};

	const { modal, openModal } = useBetterModal({
		title: 'Edit Daily Notes',
		size: 'sm',
        footer: (closeModal) => (
			<Button className="mangia-btn muted" onClick={() => notesHandler(closeModal)}>
				Save
			</Button>
		),
		content: (closeModal) => (
            <Input
                className="editInput"
                id="recipe-steps"
				innerRef={inputRef}
				autoFocus
				name="text"
				placeholder="Daily Notes"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						notesHandler(closeModal);
					}
				}}
				value={value}
			/>
		),
		inputRef,
	});

	return (
		<>
			{modal}
			<span className="note-settings">
				<FileText onClick={openModal} />
			</span>
		</>
	);
};

export default DailyNotesButton;
