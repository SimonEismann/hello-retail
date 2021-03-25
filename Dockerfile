# Execute with the following command:
# docker rm -f facialrecognition ; docker build --build-arg AWS_ACCESS_KEY_ID=YOUR_PUBLIC_KEY --build-arg AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY . -t facialrecognition && docker run -d --name facialrecognition facialrecognition && docker exec -it facialrecognition bash /ReplicationPackage/FacialRecognition/runner.sh
FROM ubuntu:18.04

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

RUN apt-get update --yes
RUN apt-get install git --yes
RUN apt-get install dos2unix --yes
RUN apt-get install jq --yes

RUN apt-get install curl dirmngr apt-transport-https lsb-release ca-certificates --yes
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install nodejs --yes
RUN apt-get install gcc g++ make --yes

RUN apt-get install python3-pip --yes

RUN pip3 install awscli --ignore-installed six

RUN aws configure set aws_access_key_id ${AWS_ACCESS_KEY_ID}
RUN aws configure set aws_secret_access_key ${AWS_SECRET_ACCESS_KEY}
RUN aws configure set region eu-west-1

RUN apt-get install openjdk-8-jre-headless --yes

RUN git config --global user.name "Your Name"
RUN git config --global user.email "you@example.com"
RUN git clone --branch main https://github.com/simontrapp/hello-retail.git
WORKDIR /hello-retail/

RUN chmod 777 /hello-retail/run.sh
RUN chmod 777 /hello-retail/meta-run.sh
RUN chmod 777 /hello-retail/runner.sh
RUN chmod 777 /hello-retail/generateConstantLoad.sh
RUN chmod 777 /hello-retail/install.sh
RUN chmod 777 /hello-retail/deploy.sh
RUN chmod 777 /hello-retail/remove.sh

RUN dos2unix /hello-retail/run.sh
RUN dos2unix /hello-retail/meta-run.sh
RUN dos2unix /hello-retail/runner.sh
RUN dos2unix /hello-retail/generateConstantLoad.sh
RUN dos2unix /hello-retail/install.sh
RUN dos2unix /hello-retail/deploy.sh
RUN dos2unix /hello-retail/remove.sh

RUN ./install.sh eu-west-1 prod company team

CMD sleep 1000000000000000000000
