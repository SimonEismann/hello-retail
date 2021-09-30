export COMPANY=$3
export TEAM=$4
export REGION=$1
export STAGE=$2
export ACCOUNT_ID=`aws sts get-caller-identity --query Account --output text`
echo $ACCOUNT_ID

# change default bucket name
DOMAIN="hello-retail-${ACCOUNT_ID}.biz"
sed -i "s|hello-retail.biz|${DOMAIN}|g" web/deploy.sh
sed -i "s|hello-retail.biz|${DOMAIN}|g" private.yml
sed -i "s|hello-retail.biz|${DOMAIN}|g" product-photos/productPhotos.yml

npm run root:install:all
