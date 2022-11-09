#!/usr/bin/env python3
# (c) Copyright Merative US L.P. and others 2020-2022
#
# SPDX-Licence-Identifier: Apache 2.0
# Pre-req
#  pip install cloudant
import sys
import string
import requests
import json
import argparse
from cloudant.client import Cloudant
from cloudant.adapters import Replay429Adapter

# Arg parser
parser = argparse.ArgumentParser()
parser.add_argument('--url', action='store', dest='CLOUDANT_URL',
                    required=True, help='Cloudant Url')
parser.add_argument('--apikey', action='store', dest='API_KEY',
                    required=True, help='API key')
parser.add_argument('--dbname', action='store', dest='DB_NAME',
                    required=True, help='Cloudant DB Name')
parser.add_argument('--tenantid', action='store', dest='TENANT_ID', required=True, help='Wellness api tenant ID')
ARGS = parser.parse_args(sys.argv[1:])

# get Cloudant client
# caller must disconnect() client after use
def get_cloudant_client():        
    url = ARGS.CLOUDANT_URL
    print("using cloudant url ", url)
    client = Cloudant.iam(None,
                    ARGS.API_KEY,
                    url=url,
                    connect=True,
                    adapter=Replay429Adapter(retries=5, initialBackoff=0.1))
    
    return client

# Main func to add sample wellness rule/schema docs. Creates DB if not present
def create_wellness_test_docs():
    client = get_cloudant_client()

    all_dbs = client.all_dbs()
    if ARGS.DB_NAME not in all_dbs:
        print("Creating database", ARGS.DB_NAME)
        my_database = client.create_database(ARGS.DB_NAME)
    else:
        my_database = client[ARGS.DB_NAME]
            
    docid_rule = "rule_configuration:wellness-test1" #seed wellness sample rule
    doc_exists = docid_rule in my_database

    if doc_exists:
        print('Sample rule_configuration exists in the db', docid_rule)
        print('Using sample wellness docs for tenant_id', ARGS.TENANT_ID, " database", ARGS.DB_NAME)          
    else:
        print('creating wellness doc for tenant_id', ARGS.TENANT_ID)          
        add_cloudant_doc('scripts/tenant_initial.json',my_database)
        add_cloudant_doc('scripts/sample1_input_schema.json',my_database)
        add_cloudant_doc('scripts/sample1_rule_config.json',my_database)

    client.disconnect()

def add_cloudant_doc(filepath, db):
    with open(filepath, 'r') as f:
      reqdata = json.load(f)  
    
    db.create_document(reqdata)      

   

def main():    
    # wellness-api: Put call to add tenant_id to be returned as token attribute    
    create_wellness_test_docs()

if __name__ == "__main__":
    main()