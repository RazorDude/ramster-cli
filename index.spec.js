'use strict'
const
	argv = require('yargs').argv,
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	{codeGenerator} = require('ramster'),
	{spawn} = require('child_process'),
	spawnPromise = (args) => new Promise((resolve, reject) => {
		const proc = spawn('node', [path.join(__dirname, 'index.js')].concat(args))
		let log = [],
			error = null
		proc.stdout.on('data', (data) => {
			// const stringData = data.toString().replace(/\n/g, '')
			const stringData = data.toString()
			log.push(stringData)
			// console.log(stringData)
			if (stringData.indexOf('[ramster-cli]: Error:') !== -1) {
				error = stringData
				proc.kill()
			}
		})
		proc.stderr.on('err', (err) => {
			error = err
		})
		proc.on('close', (code) => {
			if (error) {
				reject(error)
				return
			}
			resolve({code, log})
		})
	})

let aTestHasFailed = false
afterEach(function() {
	if (!aTestHasFailed && (this.currentTest.state !== 'passed')) {
		aTestHasFailed = true
	}
})
after((function() {
	setTimeout(() => {
		if (aTestHasFailed) {
			process.exit(1)
		}
		process.exit(0)
	}, 1000)
}))
describe('ramster-cli', function() {
	describe('general', function() {
		it('should throw an error with the correct message if there is no node_modules/ramster in the current working directory', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				yield fs.rename(path.join(__dirname, 'node_modules/ramster'), path.join(__dirname, 'node_modules/ramster_temp'))
				try {
					yield spawnPromise([])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Could not find ramster in this directory\'s node_modules folder. Please run this command from the project root directory.')
				}
				yield fs.rename(path.join(__dirname, 'node_modules/ramster_temp'), path.join(__dirname, 'node_modules/ramster'))
				assert(didThrowAnError)
				return true
			})
		})
		it('should throw an error with the correct message if no command is provided', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise([])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: No command provided.')
				}
				assert(didThrowAnError)
				return true
			})
		})
		it('should throw an error with the correct message if no subCommand is provided', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise(['generate'])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: No subCommand provided.')
				}
				assert(didThrowAnError)
				return true
			})
		})
	})


	describe('build', function() {
		it('should throw an error with the correct message if the subCommand is invalid', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise(['build', 'invalidSubCommand'])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Invalid codeGenerator subCommand - "invalidSubCommand".')
				}
				assert(didThrowAnError)
				return true
			})
		})
		it('should throw an error with the correct message if the method (subCommand) requires a config file, but none exists in the current working directory', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise(['build', 'layoutFile'])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Could not find a valid config in this directory when requiring ./config/index.js. A project config is required for executing the "layoutFile" codeGenerator subCommand. Please run this command from the project root directory.')
				}
				assert(didThrowAnError)
				return true
			})
		})

		describe('layoutFile', function() {
			before(function() {
				return co(function*() {
					yield fs.mkdirp(path.join(__dirname, 'config/profiles'))
					yield fs.mkdirp(path.join(__dirname, 'clients/site'))
					yield fs.mkdirp(path.join(__dirname, 'public/site'))
					yield codeGenerator.generateIndexConfigFile(path.join(__dirname, 'config'))
					yield codeGenerator.generateCommonConfigFile(path.join(__dirname, 'config'))
					yield codeGenerator.generateProfileConfigFile(path.join(__dirname, 'config'), 'local')
					yield codeGenerator.generateLayoutFile(path.join(__dirname, 'clients/site'), 'local')
					return true
				})
			})
			it('should throw an error with the correct message if there is no clientModuleName argument', function() {
				this.timeout(5000)
				return co(function*() {
					let didThrowAnError = false
					try {
						yield spawnPromise(['build', 'layoutFile'])
					} catch(e) {
						// console.log(e)
						didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Missing required argument "clientModuleName".')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['build', 'layoutFile', '--clientModuleName=site'])
					assert(true)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield fs.remove(path.join(__dirname, 'config'))
					yield fs.remove(path.join(__dirname, 'clients'))
					yield fs.remove(path.join(__dirname, 'public'))
					return true
				})
			})
		})
	})


	describe('generate', function() {
		it('should throw an error with the correct message if the subCommand is invalid', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise(['generate', 'invalidSubCommand'])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Invalid codeGenerator subCommand - "invalidSubCommand".')
				}
				assert(didThrowAnError)
				return true
			})
		})
		it('should throw an error with the correct message if the method (subCommand) requires a config file, but none exists in the current working directory', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise(['generate', 'NGINXConfig'])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Could not find a valid config in this directory when requiring ./config/index.js. A project config is required for executing the "NGINXConfig" codeGenerator subCommand. Please run this command from the project root directory.')
				}
				assert(didThrowAnError)
				return true
			})
		})

		describe('imagesRedirectNGINXConfig', function() {
			before(function() {
				return co(function*() {
					yield fs.mkdirp(path.join(__dirname, 'config/nginx'))
					yield fs.mkdirp(path.join(__dirname, 'test/config/nginx'))
					return true
				})
			})
			it('should execute successfully and use the default path if all parameters are correct', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'imagesRedirectNGINXConfig'])
					let stat = yield fs.lstat(path.join(__dirname, 'config/nginx/images.conf'))
					assert(stat.isFile())
					return true
				})
			})
			it('should execute successfully and use the provided path if all parameters are correct', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'imagesRedirectNGINXConfig', '--outputPath=test/config/nginx'])
					let stat = yield fs.lstat(path.join(__dirname, 'test/config/nginx/images.conf'))
					assert(stat.isFile())
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield fs.remove(path.join(__dirname, 'config'))
					yield fs.remove(path.join(__dirname, 'test/config'))
					return true
				})
			})
		})

		describe('NGINXConfig', function() {
			before(function() {
				return co(function*() {
					yield fs.mkdirp(path.join(__dirname, 'config/profiles'))
					yield fs.mkdirp(path.join(__dirname, 'config/nginx'))
					yield codeGenerator.generateIndexConfigFile(path.join(__dirname, 'config'))
					yield codeGenerator.generateCommonConfigFile(path.join(__dirname, 'config'))
					yield codeGenerator.generateProfileConfigFile(path.join(__dirname, 'config'), argv.configProfile || 'local')
					yield codeGenerator.generateImagesRedirectNGINXConfig(path.join(__dirname, 'config/nginx'))
					codeGenerator.config = require('./config')
					return true
				})
			})
			it('should throw an error with the correct message if the clientModuleName argument is invalid', function() {
				this.timeout(5000)
				return co(function*() {
					let didThrowAnError = false
					try {
						yield spawnPromise(['generate', 'NGINXConfig', `--configProfile=${argv.configProfile || 'local'}`])
					} catch(e) {
						// console.log(e)
						didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Missing required argument "clientModuleName".')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'NGINXConfig', `--configProfile=${argv.configProfile || 'local'}`, '--clientModuleName=site'])
					let stat = yield fs.lstat(path.join(codeGenerator.config.wsConfigFolderPath, 'ramster_v1-site.conf'))
					assert(stat.isFile())
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield fs.remove(path.join(codeGenerator.config.wsConfigFolderPath, 'ramster_v1-site.conf'))
					yield fs.remove(path.join(__dirname, 'config'))
					delete codeGenerator.config
					return true
				})
			})
		})

		describe('layoutFile', function() {
			before(function() {
				return co(function*() {
					yield fs.mkdirp(path.join(__dirname, 'test/clients/site'))
					return true
				})
			})
			it('should throw an error with the correct message if the outputPath argument is invalid', function() {
				this.timeout(5000)
				return co(function*() {
					let didThrowAnError = false
					try {
						yield spawnPromise(['generate', 'layoutFile'])
					} catch(e) {
						// console.log(e)
						didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Missing required argument "outputPath".')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct and no configProfile is provided', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'layoutFile', '--outputPath=test/clients/site'])
					let stat = yield fs.lstat(path.join(__dirname, 'test/clients/site/layout_local.pug'))
					assert(stat.isFile())
					return true
				})
			})
			it('should execute successfully if all parameters are correct and a configProfile is provided', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'layoutFile', '--outputPath=test/clients/site', '--configProfile=local'])
					let stat = yield fs.lstat(path.join(__dirname, 'test/clients/site/layout_local.pug'))
					assert(stat.isFile())
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield fs.remove(path.join(__dirname, 'test/clients'))
					return true
				})
			})
		})

		describe('blankProject', function() {
			it('should execute successfully if all parameters are correct and no configProfile is provided', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'blankProject', '--outputPath=test'])
					assert(true)
					return true
				})
			})
			it('should execute successfully if all parameters are correct and a configProfile is provided', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'blankProject', '--outputPath=test', '--configProfile=local'])
					assert(true)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield fs.remove(path.join(__dirname, 'test'))
					yield fs.mkdirp(path.join(__dirname, 'test'))
					return true
				})
			})
		})

		describe('basicProject', function() {
			it('should execute successfully if all parameters are correct and no configProfile is provided', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'basicProject', '--outputPath=test'])
					assert(true)
					return true
				})
			})
			it('should execute successfully if all parameters are correct and a configProfile is provided', function() {
				this.timeout(5000)
				return co(function*() {
					yield spawnPromise(['generate', 'basicProject', '--outputPath=test', '--configProfile=local'])
					assert(true)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield fs.remove(path.join(__dirname, 'test'))
					yield fs.mkdirp(path.join(__dirname, 'test'))
					return true
				})
			})
		})
	})


	describe('migrations', function() {
		it('should throw an error with the correct message if the subCommand is invalid', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise(['migrations', 'invalidSubCommand'])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Invalid migrations subCommand - "invalidSubCommand".')
				}
				assert(didThrowAnError)
				return true
			})
		})
		it('should throw an error with the correct message if the method (subCommand) requires a config file, but none exists in the current working directory', function() {
			this.timeout(5000)
			return co(function*() {
				let didThrowAnError = false
				try {
					yield spawnPromise(['migrations', 'seed'])
				} catch(e) {
					// console.log(e)
					didThrowAnError = e && (e.replace(/\n/g, '') === '[ramster-cli]: Error: Could not find a valid config in this directory when requiring ./config/index.js. A project config is required for executing the "seed" migrations subCommand. Please run this command from the project root directory.')
				}
				assert(didThrowAnError)
				return true
			})
		})
	})
})
