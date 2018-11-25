slm = require('slm')

# Things to replace
replaces = [
	[/(?<=\s)if="/g, ' v-if="']
	[/(?<=\s)else(?=\s)/g, 'v-else']
	[/else-if="/g, 'v-else-if="']
	[/model="/g, 'v-model="']
	[/drag="/g, 'v-drag="']
	[/drop="/g, 'v-drop="']
	# each=products translates to v-for="product in products"
	[/(?<=\s)each="(\S+)"/g, 'v-for="$1 in $1s"']
	
	# Allow alternative syntax for event handlers: %click="myMethod" translates to @click="myMethod"
	#[/(?<=\s)%(?=[a-z.-]+=")/g, '@']
	
	# Allow alternative syntax for property binding: -src="mySrc" translates to :src="mySrc". / Ignore this quote: "
	#[/(?<=\s)-(?=[a-z.-]+=")/g, ':']
	
	# { to {{ and } to }}
	### [///
		(?<![{}])	# before: no { or }
		[{}]		# brace
		(?![{}])	# after: no { or }
	///g, '$1$1']	# double ###
	# $blub to {{blub}}
	[///
		(?<=\s)				# before: whitespace
		\$					# dollar
		([\w.\[\]$/="'+-]+)	# myVar_[0].$prop+12-5/7==="a"
	///g, '{{$1}}']
	# :class.myclass="condition" to :class="{myclass:condition}"
	[///
		(?<=		# before:
			\s			# whitespace
			:class		# :class
		)
		\.([\w-]+)	# .myclass
		="			# ="
		([^"]+)		# condition
		"			# "
		(?=\s)		# after: whitespace
	///g, '="{$1:$2}"']
]

# Keywords that should allowed to be followed and preceded by whitespace without anything else. This has the potential to break plain text horribly
standaloneKeywords = [
	'v-else'
	'required'
	'disabled'
	'draggable'
	'selected'
	'exact'
	'drag'
	'drop'
]

module.exports = (slmdoc) ->
	# Allow inline comments: # followed by whitespace
	slmdoc = slmdoc.replace(/# .*/g, '')
	
	# Allow attributes without quotes syntax. E.g: input @click=myMethod
	.replace(///
		(?<=\s[a-zA-Z.@%:-]+=)	# [WS]%src=
		([^\s"]+)			# mySrc				<- captured
		(?=\s|$)			# [WS]
	///g, '"$1"')			# Add quotes
	
	# All replace rules
	for rule from replaces
		slmdoc = slmdoc.replace(rule[0], rule[1])

	# All standalone keywords
	for keyword from standaloneKeywords
		slmdoc = slmdoc.replace(new RegExp(
			'(?<=\\s)(' \	# [WS]
			+ keyword \		# The keyword		<- captured
			+ ')(?=\\s|$)'	# [WS]
		, 'g'), '$1=""')

	# Should now be pure coffee
	slm.compile(slmdoc)()