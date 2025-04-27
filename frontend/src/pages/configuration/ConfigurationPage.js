import { NavLink, Outlet } from 'react-router-dom';

import './ConfigurationPage.scss';
import { Col, Row } from 'reactstrap';

const ConfigurationPage = () => {
	return (
		<section className="hero">
			<div className="container">
				<div className="section-title">
					<h2>Configuration</h2>
				</div>

				<Row>
					<Col lg={3}>
						<div className="hero__categories">
							<div className="hero__categories__all">
								<span>Manage</span>
							</div>
							<ul>
								<li>
									<NavLink to="audit">
										Audit
									</NavLink>
								</li>
								<li>
									<NavLink to="suggestions">
										Suggestions
									</NavLink>
								</li>
								<li>
									<NavLink to="import-failures">
										Import Failures
									</NavLink>
								</li>
								<li>
									<NavLink to="migration">
										Migration
									</NavLink>
								</li>
							</ul>
						</div>

						<div className="hero__categories">
							<div className="hero__categories__all">
								<span>Edit</span>
							</div>
							<ul>
								<li>
									<NavLink to="ingredients">
										Ingredients
									</NavLink>
								</li>
								<li>
									<NavLink to="departments">
										Department
									</NavLink>
								</li>
								<li>
									<NavLink to="stores">
										Stores
									</NavLink>
								</li>
								<li>
									<NavLink to="books">
										Books
									</NavLink>
								</li>
							</ul>
						</div>
					</Col>
					<Col lg={9}>
						<Outlet />
					</Col>

				</Row>
			</div>
		</section>
	);
};

export default ConfigurationPage;
