if (!Object.create)
{
	Object.create = function(o)
	{
		if (arguments.length > 1)
		{
			throw new Error('Object.create implementation only accepts the first parameter.');
		}

		function F() {}
		F.prototype = o;
		return new F();
	};
}