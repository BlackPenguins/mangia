import LoadingText from 'components/Common/LoadingText';
import { DaysAgo } from 'components/Recipes/RecipeCard';
import { useToast } from 'context/toast-context';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Flag } from 'react-feather';
import { Button, Col, Input, Row } from 'reactstrap';
import { NameInput } from './BasicEditPanel';
import { useAuth, useBetterModal } from '@blackpenguins/penguinore-common-ext';

const SuggestionsTab = () => {
	const [suggestions, setSuggestions] = useState(null);
	const [expirationDate, setExpirationDate] = useState(null);

	const authContext = useAuth();
	const tokenFromStorage = authContext.tokenFromStorage;

	const addSuggestionInputRef = useRef();

	const onAddSuggestionHandler = async () => {
		const newSuggestion = {
			name: addSuggestionInputRef.current.value,
			days: expirationDate,
		};

		const response = await fetch('/api/suggestions', {
			method: 'PUT',
			body: JSON.stringify(newSuggestion),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		const data = await response.json();
		if (data.success) {
			fetchSuggestions();
		}

		addSuggestionInputRef.current.value = '';
	};

	const fetchSuggestions = useCallback(async () => {
		const response = await fetch('/api/suggestions', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		setSuggestions(data.result);
	}, []);

	useEffect(() => {
		fetchSuggestions();
	}, [fetchSuggestions]);

	return (
		<div className="container book-list ingredient-list">
			<h3>Suggestions</h3>
			<Row className="add-config-button">
				<Col lg={6}>
					<div className="form-floating">
						<Input id="item-name" type="text" placeholder="Item Name" innerRef={addSuggestionInputRef}></Input>
						<label htmlFor="item-name">Suggestion Name</label>
					</div>
				</Col>
				<Col lg={3}>
					<div className="form-floating">
						<ExpirationDropdown label="Expiration Date" setExpirationDays={setExpirationDate} />
					</div>
				</Col>
				<Col lg={3} className="recipe-edit-btn">
					<Button size="sm" onClick={onAddSuggestionHandler} className="mangia-btn success">
						Add Suggestion
					</Button>
				</Col>
			</Row>
			<div class="shoping__cart__table">
				{suggestions == null && <LoadingText text={`Loading Suggestions`} />}
				{suggestions && suggestions?.length === 0 && <div>No Suggestions found</div>}
				<table>
					<tbody>
						{suggestions &&
							suggestions.map((suggestion) => <SuggestionRow fetchSuggestions={fetchSuggestions} suggestion={suggestion} tokenFromStorage={tokenFromStorage} />)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const SuggestionRow = ({ fetchSuggestions, suggestion, tokenFromStorage }) => {
	const showToast = useToast();

	const madeHandler = async (closeModal) => {
		const update = {
			id: suggestion.SuggestionID,
			isMade: 1,
		};

		await fetch(`/api/suggestions`, {
			method: 'PATCH',
			body: JSON.stringify(update),
			headers: {
				// This is required. NodeJS server won't know how to read it without it.
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});

		fetchSuggestions();
		closeModal();
	};

	const setExpirationDays = async (option) => {
		const update = {
			id: suggestion.SuggestionID,
			days: option,
		};

		await fetch('/api/suggestions', {
			method: 'PATCH',
			body: JSON.stringify(update),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${tokenFromStorage}`,
			},
		});
		showToast('Configuration', `Expiration date extended`);

		fetchSuggestions();
	};

	const { modal, openModal } = useBetterModal({
		title: 'Make Suggestion',
		size: 'md',
		footer: (closeModal) => (
			<>
				<Button
					className="mangia-btn"
					onClick={() => {
						madeHandler(closeModal);
					}}
				>
					Mark as Made
				</Button>
			</>
		),
		content: (closeModal) => <div>Are you sure you want to make this suggestion?</div>,
	});

	const classes = [];

	if (suggestion.IsMade) {
		classes.push('checked');
	}
	return (
		<tr className={classes.join(' ')} key={suggestion['SuggestionID']}>
			<td className="shoping__cart__item">
				{modal}
				<Row>
					<Col lg={6} sm={12}>
						<NameInput label={'Suggestion'} item={suggestion} apiUpdate={'/api/suggestions'} idColumn={'SuggestionID'} tokenFromStorage={tokenFromStorage} />
						{!suggestion.IsMade && <DaysAgo label="Expires" lastMade={suggestion.ExpirationDate} recentDayThreshold={14} />}
					</Col>
					<Col lg={4} sm={12}>
						<ExpirationDropdown label="Extension Date" setExpirationDays={setExpirationDays} />
					</Col>
					<Col lg={2}>
						{!suggestion.IsMade && (
							<Button className="mangia-btn" onClick={() => openModal()}>
								<Flag />
							</Button>
						)}
					</Col>
				</Row>
			</td>
		</tr>
	);
};
const ExpirationDropdown = ({ label, setExpirationDays }) => {
	const expirations = [
		{
			label: '1 Week',
			days: 7,
		},
		{
			label: '2 Weeks',
			days: 14,
		},
		{
			label: '1 Month',
			days: 30,
		},
		{
			label: '3 Months',
			days: 90,
		},
		{
			label: '6 Months',
			days: 180,
		},
		{
			label: '1 Year',
			days: 365,
		},
	];

	const classes = ['edit-book-dropdown'];

	return (
		<span className="form-floating store-department">
			<Input
				className={classes.join(' ')}
				type="select"
				onChange={(e) => {
					setExpirationDays(e.target.value);
				}}
			>
				<option value={0}>None</option>
				{expirations &&
					expirations.map((expiration) => {
						return <option value={expiration.days}>{expiration.label}</option>;
					})}
			</Input>
			<label htmlFor="edit-book-dropdown">{label}</label>
		</span>
	);
};

export default SuggestionsTab;
