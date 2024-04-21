import { Heart } from 'react-feather';

const Footer = () => {
	return (
		<footer class="footer spad">
			<div class="container">
				<div class="footer__copyright">
					<div class="footer__copyright__text">
						<p>
							Copyright &copy;{new Date().getFullYear()} All rights reserved | This template is made with <Heart /> by{' '}
							<a href="https://colorlib.com" target="_blank">
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
