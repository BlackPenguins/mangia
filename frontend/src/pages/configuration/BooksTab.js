import BasicEditPanel from './BasicEditPanel';

const BooksTab = () => {
	return <BasicEditPanel label="Book" apiFetch="/api/books" apiUpdate="/api/books" />;
};

export default BooksTab;
