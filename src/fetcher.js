import querystring from 'querystring'

const base = 'http://localhost:3001'

const defaults = {
  cors: true,
  credentials: 'include',
  headers: {
    'Accept': 'application/json'
  }
}

class HttpError extends Error {
}

class AccessDeniedError extends HttpError {
}

class NotFoundError extends HttpError {
}

class ConflictError extends HttpError {
}

const errors = {
  401: AccessDeniedError,
  404: NotFoundError,
  409: ConflictError
}

function formatBody (body) {
  if (!body) { return {} }
  if (body instanceof FormData) {
    return {
      headers: { 'Content-Type': 'multipart/form-data' },
      body
    }
  } else {
    return {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  }
}

class Api {
  constructor (client) {
    this.client = client
  }

  async send (method, url, data, overrides = {}) {
    console.log('sending', method, url)
    const endpoint = url.includes('://') ? url : `${base}/${url}`
    const body = formatBody(data)

    const options = {
      method,
      ...defaults,
      ...overrides,
      ...body
    }

    let r
    try {
      r = await this.client(endpoint, options)
    } catch (e) {
      throw new Error(e.message)
    }

    try {
      if (r.ok) {
        return await r.json()
      }
    } catch (e) {
      return undefined
    }

    if (Object.keys(errors).includes(`${r.status}`)) {
      throw new errors[r.status](r.statusText)
    }

    throw new HttpError(`${r.status}: ${r.statusText} - ${await r.text()}`)
  }

  async callWithQuery (method, endpoint, query = {}) {
    const qs = querystring.stringify(query)
    return this.send(method, `${endpoint}${qs ? `?${qs}` : ''}`)
  }

  async get (endpoint, query = {}) {
    return this.callWithQuery('get', endpoint, query)
  }

  async post (endpoint, payload) {
    return this.send('post', endpoint, payload)
  }

  async put (endpoint, payload) {
    return this.send('put', endpoint, payload)
  }

  async del (endpoint, query) {
    return this.callWithQuery('delete', endpoint, query)
  }
}

export {
  Api,
  AccessDeniedError,
  NotFoundError,
  HttpError,
  ConflictError
}
