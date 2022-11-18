import requests
import json
import csv
import boto3
import os
from io import StringIO

def isfloat(num):
    try:
        float(num)
        return True
    except ValueError:
        return False

def handler(event, context):
    print("Starting the extraction")
    # League leaders
    google_sheet = {
        "id": os.environ.get('SHEET_ID'),
        "sheet": os.environ.get('SHEET_NAME')
    }

    # Get the sheet as csv
    google_sheet_url = "https://docs.google.com/spreadsheets/d/" + google_sheet["id"] +"/gviz/tq?tqx=out:csv&sheet=" + google_sheet['sheet']
    res = requests.get(google_sheet_url)

    csvStringIO = StringIO(res.text)
    rows = csv.reader(csvStringIO, delimiter=',')
    rowsList = list(rows)

    # get the index of the first empty name column
    c = [i for i, x in enumerate(rowsList[0]) if not x]
    headingIndex = c[0] if len(c) > 0 else len(rowsList[0])

    columns = rowsList[0][:headingIndex]
    indexes = [i for i, x in enumerate(columns)]

    data = [ x[:headingIndex] for x in rowsList[1:] ]

    percentCol = [i for i, x in enumerate(data[0]) if '%' in x]

    for i, x in enumerate(data):
        for col in percentCol:
            data[i][col] = round(float(data[i][col].strip('%')) / 100.0, 3)
        for j, val in enumerate(x):
            data[i][j] = data[i][j] if not isfloat(val) else float(data[i][j])
        
    
    jsonResponse = {
        'columns': columns,
        'index': indexes,
        'data' : data
    }

    s3Upload(json.dumps(jsonResponse))

def s3Upload(body):

    encoded_string = body.encode("utf-8")
    bucket_name = os.environ.get('BSL_BUCKET_NAME')
    file_name = os.environ.get('BSL_FILE_NAME')
    s3_path = os.environ.get('BSL_PATH') + file_name

    print("ADDING TO")
    print("BUCKET: " + bucket_name)
    print("PATH: " + s3_path)

    s3 = boto3.resource("s3")
    s3.Bucket(bucket_name).put_object(Key=s3_path, Body=encoded_string)

if(os.environ.get('LOCAL_PATH')):
    handler('test event', 'test context')