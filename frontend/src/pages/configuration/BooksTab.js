import BasicEditPanel from './BasicEditPanel';

const BooksTab = () => {
	return <BasicEditPanel label="Books" apiFetch="/api/books" apiInsert="/api/books" apiUpdate="/api/books" idColumn="BookID" />;
};

export default BooksTab;
