import { Heart } from 'react-feather';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
	const navigate = useNavigate();

	return (
		<footer className="footer spad">
			<div className="container">
				<div className="footer__copyright">
					<div className="footer__copyright__text">
						<p><span className='about-link' onClick={() => navigate('about')}>Last Updated: Dec 30, 2025 (v2.4)</span></p>
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
