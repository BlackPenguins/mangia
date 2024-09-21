import BasicEditPanel from './BasicEditPanel';

const StoreTab = () => {
	return <BasicEditPanel label="Store" apiFetch="/api/stores" apiInsert="/api/stores" apiUpdate="/api/stores" idColumn="StoreID" />;
};

export default StoreTab;