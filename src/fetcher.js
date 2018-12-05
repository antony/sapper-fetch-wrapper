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
  prepareRequest (method, url, data, overrides = {}) {
    const endpoint = url.includes('://') ? url : `${base}/${url}`
    const body = formatBody(data)

    return [endpoint, {
      method,
      ...defaults,
      ...overrides,
      ...body
    }]
  }

  callWithQuery (method, endpoint, query = {}) {
    const qs = querystring.stringify(query)
    return this.prepareRequest(method, `${endpoint}${qs ? `?${qs}` : ''}`)
  }

  prepareGet (endpoint, query = {}) {
    return this.callWithQuery('get', endpoint, query)
  }

  preparePost (endpoint, payload) {
    return this.prepareRequest('post', endpoint, payload)
  }

  preparePut (endpoint, payload) {
    return this.prepareRequest('put', endpoint, payload)
  }

  prepareDel (endpoint, query) {
    return this.callWithQuery('delete', endpoint, query)
  }
}

const api = new Api()

export {
  api,
  AccessDeniedError,
  NotFoundError,
  HttpError,
  ConflictError
}
