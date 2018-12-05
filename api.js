'use strict'

const Hapi = require('hapi')
const HapiAuthJwt2 = require('hapi-auth-jwt2')
const { promisify } = require('bluebird')
const jwt = require('jsonwebtoken')

let server

const jwtSeed = `wRnjBKd}ECd8.'yqA8[cK44!pN5ay2yCQ]!_JS7m[c~-=tpak>t^HPukh=.d@HHc`

const init = async () => {
  server = Hapi.server({
    port: process.env.PORT || 3001,
    host: 'localhost',
    debug: { request: ['error'] },
    routes: {
      cors: {
        credentials: true
      }
    },
    state: {
      clearInvalid: false,
      strictHeader: false
    }
  })

  await server.register([
    { plugin: HapiAuthJwt2 }
  ])

  async function validate (decoded) {
    return {
      isValid: true
    }
  }

  server.auth.strategy('jwt', 'jwt', {
    cookieKey: 'sapper-jwt',
    key: jwtSeed,
    validate,
    verifyOptions: {
      algorithms: [ 'HS256' ]
    }
  })

  server.auth.default('jwt')

  server.route({
    path: '/login',
    method: 'GET',
    options: {
      auth: false
    },
    handler: (request, h) => {
      const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 72)
      const sign = promisify(jwt.sign)

      const id = 1
      const sub = 'you@example.com'

      const token = sign({ id, sub, exp }, jwtSeed)

      return h
        .response({ authenticated: true })
        .state('sapper-jwt', token, {
          encoding: 'none',
          isHttpOnly: true,
          ttl: 1000 * 60 * 60 * 6,
          isSecure: false,
          isSameSite: false,
          domain: 'localhost',
          path: '/'
        })
    }
  })

  server.route({
    method: 'GET',
    path: '/profile',
    handler: request => {
      const { id, sub } = request.auth.credentials
      return {
        id,
        email: sub
      }
    }
  })

  await server.start()

  console.log(`Server running at: ${server.info.uri}`)
}

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})

init()