# wellness-score-api
Determines risk associated with an individual entering the workplace or other location

## Implementation notes
- Caching will be delegated to [dhp-cache-lib](https://github.com/digitalhealthpass/dhp-cache-lib) *(decided on 2020/08/04)*
- Logging will be delegated to [dhp-logging-lib](https://github.com/digitalhealthpass/dhp-logging-lib) *(decided on 2020/08/04)*
- HTTP calls will be delegated to [dhp-http-lib](https://github.com/digitalhealthpass/dhp-http-lib) *(decided on 2020/08/04)*
- [jose](https://www.npmjs.com/package/jose) will be used for JWS verification *(decided on 2020/08/04)*
- [json-rules-engine](https://www.npmjs.com/package/json-rules-engine) will be used for business rule processing *(decided on 2020/08/04)*
- [json-path](https://www.npmjs.com/package/jsonpath) will be used for selecting input data for fact generation *(decided on 2020/08/04)*
- [node-eval](https://github.com/node-eval/node-eval) will be used for expression evaluation during fact generation *(decided on 2020/08/24)*

## AppID

Wellness Score uses AppID for user authentication and authorization. Each user must be registered to the relevant AppID instance.

The following scopes should be configured in AppID:
- wellnessscore.read
- wellnessscore.write
- calculate_wellness

Each AppID user will need:
- A role or roles encompassing any of the desired scopes listed above
- A custom attribute called `tenant_id`, which will be used to link all users, input schemas, and rule configurations created for an individual instance of Wellness Score

### Deployment convention
Following are the Default roles created in AppID instance:
- wellness-admin 
  - with scopes: wellnesscore.read, wellnessscore.write, calculate_wellness 
- wellness-reader 
  - with scopes: wellnesscore.read, calculate_wellness

### Custom attribute in access token
Configure the AppID instance to include the `tenant_id` value in its access tokens using the following curl command:


```
curl --location --request PUT 'https://us-south.appid.cloud.ibm.com/management/v4/<App ID Tenant ID>/config/tokens' \
--header 'Authorization: Bearer <IAM token>' \
--header 'Content-Type: application/json' \
--data-raw '{
 "access": {
     "expires_in": <expiry time in seconds>
 },
 "refresh": {
     "enabled": false
 },
 "anonymousAccess": {
     "enabled": false
 },
 "accessTokenClaims": [
      {
        "source": "attributes",
        "sourceClaim": "tenant_id",
        "destinationClaim": "tenant_id"
      }
 ]
}'
```

Once the token configuration is set, use the [security-api](https://github.ibm.com/HealthPass/security-api)'s `/security/token` API (configured with the same instance of AppID) to generate an access token for a particular user.


## Environment Variables

|Name|Required|Description|
| -- | ------ | --------- |
|APP_ID_OAUTH_SERVER_URL|yes|AppID oauth url used to generate access tokens|
|OAUTH_SERVICE_CLIENT_ID|yes|App ID service client ID|
|OAUTH_SERVICE_CLIENT_SECRET|yes|App ID service client secret|
|OAUTH_TOKEN_VERIFICATION_URL|yes|https://us-south.appid.cloud.ibm.com/oauth/v4/< App ID Tenant ID >/introspect|
|OAUTH_APP_CLIENT_ID|for integration tests|App ID application client ID|
|CLOUDANT_URL|yes|Cloudant instance host (prepend 'https://' to the value listed in Service credentials)
|CLOUDANT_API_KEY|yes|Cloudant instance apikey
|CLOUDANT_DATABASE|yes|database in Cloudant instance
|SECURITY_API|for integration tests|Security API URL|

## Healthpass Libraries

The wellness-score-api uses libraries that are maintained in private git repositories in the [HealthPass organization](https://github.com/digitalhealthpass):
- [dhp-cache-lib](https://github.com/digitalhealthpass/dhp-cache-lib)
- [dhp-logging-lib](https://github.com/digitalhealthpass/dhp-logging-lib)
- [dhp-http-lib](https://github.com/digitalhealthpass/dhp-http-lib)

If you are a developer who would like to run the wellness-score-api on your local machine, first ensure that you have a personal ssh key added to your Github account.  If you have write access to the above healthpass library repositories, you should then be able to successfully run `npm install`.

## Operation details

### calculateWellness

1. API will retrieve the rule configuration specified by `$.rule_configuration_id` in the request, validating that the client is authorized to use the requested configuration
2. API will get the input schema referenced by the rule configuration in Step 1
3. API will validate the contents of `$.input` from the request against the input schema in Step 2
4. API will generate facts from the input using the fact specifications in `ruleConfiguration.facts`, performing any pre-processing required per `ruleConfiguration.pre_processing`
5. API will initialize a rule engine, adding the rules defined in `ruleConfiguration.rules`, and setting the facts from Step 4
6. API will run the engine and return the output, per the specification

### getRuleConfiguration

1. API will retrieve the tenant information associated with the client's token
2. API will validate that the client is entitled to view the requested rule configuration
3. API will return the rule configuration, per the specification

### Future APIs

The following APIs are not yet implemented:
- addSchema
- getSchema
- getSchemas
- replaceSchema
- deleteSchema
- addRuleConfiguration
- getRuleConfiguration
- getRuleConfigurations
- replaceRuleConfiguration
- deleteRuleConfiguration
- validateRuleConfiguration

In the meantime, to successfully calculate a wellness score, manually add an input schema document, a rule configuration document, and a tenant document to the specified Cloudant DB.

Example JSON for each of the above can be found in the `testdata` directory.
