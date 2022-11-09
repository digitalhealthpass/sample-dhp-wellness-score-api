#!/usr/bin/env python3
# (c) Copyright Merative US L.P. and others 2020-2022
#
# SPDX-Licence-Identifier: Apache 2.0

import sys
import string
import requests
import json
import argparse

# Arg parser
parser = argparse.ArgumentParser()
parser.add_argument('--appid', action='store', dest='APPID_TID',
                    required=True, help='App ID tenant id')
parser.add_argument('--apikey', action='store', dest='API_KEY',
                    required=True, help='IBM Cloud API key')
parser.add_argument('--credentialname', action='store', dest='CREDENTIAL_NAME',
                    required=False, help='AppID Application Credential Name')
parser.add_argument('--region', action='store', dest='REGION', required=True, help='Service Default Region')
ARGS = parser.parse_args(sys.argv[1:])


def get_iam_token(apiKey):
    """
    Retrieve an IAM token for use with AppID using the provided IBM Cloud API key and the IAM API

    :param apiKey: IBM Cloud API key
    :type apiKey: str
    :return: IAM token prefixed with 'Bearer'
    :rtype: str
    """ 
    headers = {'Content-Type': 'application/x-www-form-urlencoded',
               'Accept': 'application/json'}
    data = 'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=' + apiKey
    r = requests.post("https://iam.cloud.ibm.com/oidc/token",
                      data=data, headers=headers)
    if r.status_code == requests.codes.ok:
        token = 'Bearer ' + r.json()['access_token']
        return token
    else:
        print(r.json)
        r.raise_for_status()

def create_tokenattrib(token, region, tenant):
    """
    Add healthpass roles to AppID

    :param token: IAM token to access AppID
    :type token: str
    :param region: Service Default Region
    :type region: str
    :param tenant: AppID tenant id
    :type tenant: str
    :return: None
    """

    # PUT for tenant_id attribute
    url = 'https://' + region + '.appid.cloud.ibm.com/management/v4/' + \
        tenant + '/config/tokens'
    print('Put call to add tenant_id to be returned as token attribute','calling appidurl ' + url)
    headers = {'Content-Type': 'application/json',
               'Accept': 'application/json', 
               'Authorization': token}
    with open('scripts/token_attrib_request.json', 'r') as f:
      reqdata = json.load(f)
    data_with_double_quotes = json.dumps(reqdata)

    r = requests.put(url, headers=headers, data=data_with_double_quotes)
    
    if r.status_code != requests.codes.ok:
      print("Failed to configure access tokens to include AppID custom attribute 'tenant_id'",r)
      r.raise_for_status()


def main():
    # Obtain an IAM token to access App ID instance
    iamtoken = get_iam_token(ARGS.API_KEY)

    # wellness-api: Put call to add tenant_id to be returned as token attribute    
    create_tokenattrib(iamtoken, ARGS.REGION, ARGS.APPID_TID)

if __name__ == "__main__":
    main()