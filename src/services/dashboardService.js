import api from './api'

const extract = (response) => response.data?.data

export const getOverview = async () => {
  const response = await api.get('/v1/dashboard/overview')
  return extract(response)
}

export default {
  getOverview,
}

