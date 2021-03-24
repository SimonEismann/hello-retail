import base64
import logging
import os
import random
import re
import time

import requests

BENCHMARK_CONFIG = """
event_processing:
  description: Hello Retail Benchmark for AWS.
  provider: aws
  region: us-east-1
  stage: prod
  team: simont
  company: uniwue
"""


# API calls, ew=event-writer, pr=product-receive, pc=product-catalog


# Util

def encodeImage(source_filename, target_filename):
  with open(source_filename, 'rb') as image:  # open binary file in read mode
    image_64_encode = base64.b64encode(image.read())
    with open(target_filename, "wb") as target_image_file:
      target_image_file.write(image_64_encode)


# SB calls

def prepare(spec):
  if not os.path.exists(os.path.dirname(__file__) + "/node_modules"):           # if no dependencies are installed, install dependencies
    spec.run(f"./install.sh {spec['region']} {spec['stage']} {spec['company']} {spec['team']}", image='serverless_cli')

  log = spec.run(f"./deploy.sh {spec['region']} {spec['stage']} {spec['company']} {spec['team']}", image='serverless_cli')

  urls = re.findall(r" [-] https://[-\w.]+execute-api[-\w.]+/\w+/[\w-]+", log)
  for url in urls:
    m = re.match(r" - (https://[-\w.]+/\w+)/event-writer", url)
    if m:
      spec['endpoint_event_writer_api'] = m.group(1)
    else:
      m = re.match(r" - (https://[-\w.]+/\w+)/categories", url)
      if m:
        spec['endpoint_product_catalog_api'] = m.group(1)
      else:
        m = re.match(r" - (https://[-\w.]+/\w+)/sms", url)
        if m:
          spec['endpoint_photo_receive_api'] = m.group(1)

  logging.info(f"endpoint event writer={spec['endpoint_event_writer_api']}")
  logging.info(f"endpoint product catalog={spec['endpoint_product_catalog_api']}")
  logging.info(f"endpoint photo receive={spec['endpoint_photo_receive_api']}")


def invoke(spec):
  image_source_file = "benchmark_images/snowdrop.jpg"
  image_target_file = "benchmark_images/snowdrop-base64.jpg"
  encodeImage(image_source_file, image_target_file)

  out_options = f"--out csv={spec.workload_log_file()}"
  spec.run(f'''k6 run {out_options} -e \"EVENT_WRITER_URL={spec['endpoint_event_writer_api']}\" \\
    -e \"PRODUCT_CATALOG_URL={spec['endpoint_product_catalog_api']}\" \\
    -e \"PHOTO_RECEIVE_URL={spec['endpoint_photo_receive_api']}\" \\
    -e \"IMAGE_FILE={image_target_file}\" workload_script.js''', image = 'loadimpact/k6:0.30.0')


def cleanup(spec):
  spec.run(f"./remove.sh {spec['region']} {spec['stage']} {spec['company']} {spec['team']}", image='serverless_cli')
