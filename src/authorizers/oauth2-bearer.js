import isEmpty from 'lodash.isempty'

/**
    Authorizer that conforms to OAuth 2
    ([RFC 6749](http://tools.ietf.org/html/rfc6749)); includes the access token
    from the session data as a bearer token
    ([RFC 6750](http://tools.ietf.org/html/rfc6750)) in the `Authorization`
    header, e.g.:
    ```
    Authorization: Bearer 234rtgjneroigne4
    ```
    @method authorize
    @param {Object} data The data that the session currently holds
    @param {Function} block(headerName,headerContent) The callback to call with the authorization data; will receive the header name and header content as arguments
    @public
  */
const authorizer = ({ access_token: accessToken }, block) => {
  if (!isEmpty(accessToken)) {
    block('Authorization', `Bearer ${accessToken}`)
  }
}

export default authorizer
