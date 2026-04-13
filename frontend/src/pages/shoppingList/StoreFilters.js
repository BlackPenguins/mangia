import { Button } from 'reactstrap';

const StoreFilters = ({ stores, selectedStore, setSelectedStore, setCheckedForStore }) => {
	const handleLink = (store) => {
		setCheckedForStore([]);
		setSelectedStore(store);
	}
	
	return (
		<div className="hero__categories">
			<div className="hero__categories__all">
				<span>Stores</span>
			</div>
			<ul>
				<li>
					<Button className={selectedStore === null ? 'active' : 'non-active'} color="link" onClick={() => handleLink(null)}>
						All
					</Button>
				</li>

				{stores &&
					stores.map((store) => {
						return (
							<li key={store.storeID}>
								<Button className={selectedStore?.storeID === store.storeID ? 'active' : 'non-active'} color="link" onClick={() => handleLink(store)}>
									{store.storeName}
								</Button>
							</li>
						);
					})}
			</ul>
		</div>
	);
};

export default StoreFilters;
