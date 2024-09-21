import { NavLink, Outlet, useLocation } from 'react-router-dom';

import '../ShoppingList.css';
import './ConfigurationPage.scss';

const ConfigurationPage = () => {
	const location = useLocation();

	console.log('WRONG', location);
	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Configuration</h2>
				</div>

				<div class="row">
					<div class="col-lg-3">
						<div class="hero__categories">
							<div class="hero__categories__all">
								<span>Edit</span>
							</div>
							<ul>
								<li>
									<NavLink to="books" activeClassName="active">
										Books
									</NavLink>
								</li>
								<li>
									<NavLink to="ingredients" activeClassName="active">
										Ingredients
									</NavLink>
								</li>
								<li>
									<NavLink to="departments" activeClassName="active">
										Department
									</NavLink>
								</li>
								<li>
									<NavLink to="stores" activeClassName="active">
										Stores
									</NavLink>
								</li>
								<li>
									<NavLink to="import-failures" activeClassName="active">
										Import Failures
									</NavLink>
								</li>
								<li>
									<NavLink to="migration" activeClassName="active">
										Migration
									</NavLink>
								</li>
							</ul>
						</div>
					</div>
					<div class="col-lg-9">
						<Outlet />
					</div>
				</div>
			</div>
		</section>
	);
};

export default ConfigurationPage;
