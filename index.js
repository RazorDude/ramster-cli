#!node
'use strict'
const
	argv = require('yargs').argv,
	co = require('co'),
	chalk = require('chalk'),
	cwd = process.cwd(),
	fs = require('fs-extra'),
	path = require('path'),
	request = require('request-promise-native')
try {
	let ramster = null
	try {
		ramster = require(path.join(cwd, 'node_modules/ramster'))
	} catch(e) {
		console.log(chalk.red('[ramster-cli]: Error: Could not find ramster in this directory\'s node_modules folder. Please run this command from the project root directory.'))
		process.exit(1)
	}
	const {CodeGenerator} = ramster,
		command = argv._[0],
		subCommand = argv._[1],
		methodArguments = {
			codeGenerator: {
				buildLayoutFile: [{name: 'clientModuleName'}],
				generateImagesRedirectNGINXConfig: [{name: 'outputPath', addCWD: true, default: path.join(cwd, 'config/nginx')}],
				generateNGINXConfig: [{name: 'clientModuleName'}],
				generateLayoutFile: [{name: 'outputPath', addCWD: true}, {name: 'configProfile', optional: true}],
				generateBlankProject: [{name: 'outputPath', default: cwd}, {name: 'configProfile', optional: true}],
				generateBasicProject: [{name: 'outputPath', default: cwd}, {name: 'configProfile', optional: true}]
			},
			migrations: {
				seed: [{name: 'seedFolder', optional: true}, {name: 'seedFile', optional: true}],
				sync: [],
				generateSeed: [{name: 'seedFile', optional: true}],
				generateBackup: [],
				insertStaticData: [{name: 'fileName', optional: true}]
			}
		},
		getMethodArguments = (module, methodName, form) => {
			const mArgs = methodArguments[module][methodName]
			let output = form === 'array' ? [] : {}
			for (const i in mArgs) {
				const argData = mArgs[i]
				let value = argv[argData.name]
				if (typeof value === 'undefined') {
					if (typeof argData.default === 'undefined') {
						if (!argData.optional) {
							console.log(chalk.red(`[ramster-cli]: Error: Missing required argument "${argData.name}".`))
							process.exit(1)
						}
						if (form === 'array') {
							output.push(undefined)
							continue
						}
						output[argData.name] = undefined
						continue
					}
					if (form === 'array') {
						output.push(argData.default)
						continue
					}
					output[argData.name] = argData.default
					continue
				}
				if (argData.addCWD) {
					value = path.join(cwd, value)
				}
				if (form === 'array') {
					output.push(value)
					continue
				}
				output[argData.name] = value
			}
			return output
		}
	if ((typeof command !== 'string') || !command.length) {
		console.log(chalk.red('[ramster-cli]: Error: No command provided.'))
		process.exit(1)
	}
	if ((typeof subCommand !== 'string') || !subCommand.length) {
		console.log(chalk.red('[ramster-cli]: Error: No subCommand provided.'))
		process.exit(1)
	}
	if ((command === 'generate') || (command === 'build')) {
		let codeGenerator = new CodeGenerator(),
			methodName = `${command}${subCommand.charAt(0).toUpperCase()}${subCommand.substr(1, subCommand.length)}`
		if (typeof codeGenerator[methodName] !== 'function') {
			console.log(chalk.red(`[ramster-cli]: Error: Invalid codeGenerator subCommand - "${subCommand}".`))
			process.exit(1)
		}
		if (codeGenerator.configRequiredForMethods.indexOf(methodName) !== -1) {
			try {
				codeGenerator.config = require(path.join(cwd, 'config'))
			} catch(e) {
				console.log(chalk.red(`[ramster-cli]: Error: Could not find a valid config in this directory when requiring ./config/index.js. A project config is required for executing the "${subCommand}" codeGenerator subCommand. Please run this command from the project root directory.`))
				process.exit(1)
			}
		}
		codeGenerator[methodName].apply(codeGenerator, getMethodArguments('codeGenerator', methodName, 'array')).then((res) => {
				console.log(chalk.blue('[ramster-cli]: Command executed successfully.'))
				process.exit(0)
			}, (err) => {
				console.log(chalk.red('[ramster-cli]: Error: '), err)
				process.exit(1)
			}
		)
	} else if (command === 'migrations') {
		if (!methodArguments.migrations[subCommand]) {
			console.log(chalk.red(`[ramster-cli]: Error: Invalid migrations subCommand - "${subCommand}".`))
			process.exit(1)
		}
		let config = null
		try {
			config = require(path.join(cwd, 'config'))
		} catch(e) {
			console.log(chalk.red(`[ramster-cli]: Error: Could not find a valid config in this directory when requiring ./config/index.js. A project config is required for executing the "${subCommand}" migrations subCommand. Please run this command from the project root directory.`))
			process.exit(1)
		}
		co(function*() {
			let result = yield request({
				method: 'get',
				uri: `http://127.0.0.1:${config.migrations.serverPort}/${subCommand}`,
				qs: getMethodArguments('migrations', subCommand),
				resolveWithFullResponse: true
			})
			if (result.statusCode !== 200) {
				throw new Error(result.statusCode)
			}
			return true
		}).then((res) => {
				console.log(chalk.blue('[ramster-cli]: Command executed successfully.'))
				process.exit(0)
			}, (err) => {
				console.log(chalk.red('[ramster-cli]: Error: Execution error:'), err)
				process.exit(1)
			}
		)
	} else {
		console.log(chalk.red('[ramster-cli]: Error: Invalid command provided.'))
		process.exit(1)
	}
} catch(e) {
	console.log(chalk.red('[ramster-cli]: Error: An internal error has occurred:'), e)
	process.exit(1)
}
