const BottomButton = ({ Icon, action, buttonClass }) => {
	return (
		<span onClick={action} class={`d-flex justify-content-center align-items-center text-center ${buttonClass}`}>
			<Icon />
		</span>
	);
};

export default BottomButton;
