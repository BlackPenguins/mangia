import { Button } from 'reactstrap';

const StoreFilters = ({ stores, selectedStore, setSelectedStore }) => {
	return (
		<div className="hero__categories">
			<div className="hero__categories__all">
				<span>Stores</span>
			</div>
			<ul>
				<li>
					<Button className={selectedStore === null ? 'active' : 'non-active'} color="link" onClick={() => setSelectedStore(null)}>
						All
					</Button>
				</li>

				{stores &&
					stores.map((store) => {
						return (
							<li key={store.storeID}>
								<Button className={selectedStore === store.storeID ? 'active' : 'non-active'} color="link" onClick={() => setSelectedStore(store.storeID)}>
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
