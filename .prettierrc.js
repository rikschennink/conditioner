module.exports = {
	printWidth: 100,
	tabWidth: 1,
	singleQuote: true,
	useTabs: true,
	overrides: [
		{
			files: '*.md',
			options: {
				useTabs: false,
				tabWidth: 2
			}
		}
	]
};
