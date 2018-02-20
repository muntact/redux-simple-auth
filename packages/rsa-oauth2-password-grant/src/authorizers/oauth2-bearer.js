import isEmpty from 'lodash.isempty'

// TODO: get this from the RSA authorizer when it's merged.
const authorizer = ({ access_token: accessToken = '' }, block) => {
  if (!isEmpty(accessToken)) {
    block('Authorization', `Bearer ${accessToken}`)
  }
}

export default authorizer
