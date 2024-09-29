import { Heart } from 'react-feather';

const Footer = () => {
	return (
		<footer className="footer spad">
			<div className="container">
				<div className="footer__copyright">
					<div className="footer__copyright__text">
						<p>Last Updated: Sep 29, 2024 (v1.4)</p>
						<p>
							Copyright &copy;{new Date().getFullYear()} All rights reserved | This template is made with <Heart /> by{' '}
							<a href="https://colorlib.com" target="_blank" rel="noreferrer">
								Colorlib
							</a>
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
