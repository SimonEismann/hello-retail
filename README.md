# Hello, Retail!

Hello, Retail! is a Nordstrom Technology open-source project. Hello, Retail! is a 100% serverless, event-driven framework and functional proof-of-concept showcasing a central unified log approach as applied to the retail problem space. All code and patterns are intended to be re-usable for scalable applications large and small.

# Deploy
## Using serverless-benchmarker
```shell
# in the root directory of the repository, install dependencies, STAGE=prod, REGION=us-east-1, COMPANY=yourcompany, TEAM=yourteam
./install.sh REGION STAGE COMPANY TEAM
# before calling, adjust the sb config in hello_retail_benchmark.py accordingly
sb prepare [--local]
```
## Using Docker benchmark
```shell
# remove old versions
docker rm -f hello-retail
# build with the Dockerfile using the online git repository
docker build --no-cache --build-arg AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID> --build-arg AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY> . -t hello-retail
# start up the container
docker run -d --name hello-retail hello-retail
# execute the experiment script in the docker environment
docker exec -it hello-retail bash /hello-retail/runner.sh
# copy the benchmark results to a local folder ./results/
docker cp hello-retail:/results .
```
