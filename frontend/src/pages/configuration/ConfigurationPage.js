import { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardText, CardTitle, Col, Nav, NavItem, Row, TabContent, TabPane } from 'reactstrap';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import '../ShoppingList.css';
import './ConfigurationPage.scss';

const ConfigurationPage = () => {
	const navigate = useNavigate();

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
									<a href="#" onClick={() => navigate('books')}>
										Books
									</a>
								</li>
								<li>
									<a href="#" onClick={() => navigate('ingredients')}>
										Ingredients
									</a>
								</li>
								<li>
									<a href="#" onClick={() => navigate('departments')}>
										Department
									</a>
								</li>
								<li>
									<a href="#" onClick={() => navigate('stores')}>
										Stores
									</a>
								</li>
								<li>
									<a href="#" onClick={() => navigate('migration')}>
										Migration
									</a>
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
