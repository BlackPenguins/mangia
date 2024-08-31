import BasicEditPanel from './BasicEditPanel';

const BooksTab = () => {
	return <BasicEditPanel label="Book" apiFetch="/api/books" apiInsert="/api/books" apiUpdate="/api/books" idColumn="BookID" />;
};

export default BooksTab;
